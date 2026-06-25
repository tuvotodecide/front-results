"use client";

import { createRuntimeErrorPayload } from "./runtimeError";
import {
  createRuntimeErrorThrottleState,
  shouldSendRuntimeError,
} from "./throttle";
import type { RuntimeErrorInput } from "./types";

const ERROR_REPORT_ENDPOINT = "/api/error-report";
const throttleState = createRuntimeErrorThrottleState();

let listenersInstalled = false;
let consoleWrapped = false;
let reportingInFlight = false;
let originalConsoleError: typeof console.error | null = null;

const isReportLoop = (input: RuntimeErrorInput): boolean => {
  const message =
    input.error instanceof Error
      ? input.error.message
      : typeof input.error === "string"
        ? input.error
        : "";

  return message.includes(ERROR_REPORT_ENDPOINT);
};

export const reportRuntimeError = (input: RuntimeErrorInput): void => {
  if (typeof window === "undefined") return;
  if (reportingInFlight || isReportLoop(input)) return;

  const payload = createRuntimeErrorPayload(input);
  if (!shouldSendRuntimeError(payload.signature, throttleState)) return;

  reportingInFlight = true;
  void fetch(ERROR_REPORT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive: true,
  })
    .catch((error: unknown) => {
      originalConsoleError?.("Runtime error report failed", error);
    })
    .finally(() => {
      reportingInFlight = false;
    });
};

const getErrorEventPayload = (event: ErrorEvent): unknown => {
  if (event.error) return event.error;
  return new Error(event.message || "Global browser error");
};

const getPromiseRejectionPayload = (event: PromiseRejectionEvent): unknown => {
  if (event.reason) return event.reason;
  return new Error("Unhandled promise rejection without reason");
};

const getConsoleMetadata = (args: unknown[]): unknown =>
  args.find(
    (item) =>
      item &&
      typeof item === "object" &&
      !(item instanceof Error),
  );

export const installRuntimeErrorReporting = (): VoidFunction => {
  if (typeof window === "undefined") return () => {};
  if (listenersInstalled) return () => {};

  listenersInstalled = true;
  originalConsoleError = console.error.bind(console);

  const onError = (event: ErrorEvent) => {
    reportRuntimeError({
      source: "global",
      error: getErrorEventPayload(event),
      logs: [event.message, event.filename, event.lineno, event.colno],
    });
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    reportRuntimeError({
      source: "promise",
      error: getPromiseRejectionPayload(event),
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  if (!consoleWrapped) {
    consoleWrapped = true;
    console.error = (...args: unknown[]) => {
      originalConsoleError?.(...args);
      reportRuntimeError({
        source: "console",
        error: args.find((item) => item instanceof Error) || String(args[0] || "console.error"),
        logs: args,
        metadata: getConsoleMetadata(args),
      });
    };
  }

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
};

export const restoreConsoleErrorForTests = (): void => {
  if (originalConsoleError) {
    console.error = originalConsoleError;
  }
  consoleWrapped = false;
};
