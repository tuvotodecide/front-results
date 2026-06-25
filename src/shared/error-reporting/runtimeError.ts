import { collectRuntimePerformance } from "./performance";
import { sanitizePayload, serializeForLog, truncateString } from "./sanitize";
import type {
  NormalizedRuntimeError,
  RuntimeErrorContext,
  RuntimeErrorInput,
  RuntimeErrorPayload,
} from "./types";

const SESSION_ID_KEY = "frontend-runtime-error-session-id";
const ERROR_COUNT_KEY = "frontend-runtime-error-count";
const DEFAULT_ENVIRONMENT = "unknown";
const DEFAULT_VERSION = "unknown";

const safeStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const createSessionId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const getRuntimeErrorSessionId = (): string => {
  const storage = safeStorage();
  if (!storage) return "unavailable";

  const existing = storage.getItem(SESSION_ID_KEY);
  if (existing) return existing;

  const sessionId = createSessionId();
  storage.setItem(SESSION_ID_KEY, sessionId);
  return sessionId;
};

export const incrementRuntimeErrorCount = (): number => {
  const storage = safeStorage();
  if (!storage) return 1;

  const current = Number(storage.getItem(ERROR_COUNT_KEY) || "0");
  const next = Number.isFinite(current) ? current + 1 : 1;
  storage.setItem(ERROR_COUNT_KEY, String(next));
  return next;
};

export const normalizeRuntimeError = (
  error: unknown,
  componentStack?: string,
  digest?: string,
): NormalizedRuntimeError => {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "Unknown runtime error",
      stacktrace: error.stack || "sin stacktrace disponible",
      componentStack: componentStack
        ? truncateString(componentStack)
        : undefined,
      digest,
    };
  }

  return {
    name: "NonErrorRuntimeFailure",
    message: typeof error === "string" ? error : serializeForLog(error),
    stacktrace: "sin stacktrace disponible",
    componentStack: componentStack ? truncateString(componentStack) : undefined,
    digest,
  };
};

export const collectRuntimeContext = (): RuntimeErrorContext => {
  const location =
    typeof window === "undefined"
      ? null
      : window.location;

  return {
    url: location?.href || "unavailable",
    pathname: location?.pathname || "unavailable",
    timestamp: new Date().toISOString(),
    userAgent:
      typeof navigator === "undefined" ? "unavailable" : navigator.userAgent,
    environment: process.env.NODE_ENV || DEFAULT_ENVIRONMENT,
    appVersion: DEFAULT_VERSION,
    sessionId: getRuntimeErrorSessionId(),
    errorCountInSession: incrementRuntimeErrorCount(),
  };
};

const pickDiagnosticMetadata = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object") return {};

  const record = value as Record<string, unknown>;
  const keys = [
    "url",
    "endpoint",
    "path",
    "method",
    "status",
    "statusCode",
    "statusText",
    "body",
    "payload",
    "request",
    "requestBody",
    "response",
    "responseBody",
    "data",
    "cause",
  ];

  return Object.fromEntries(
    keys
      .filter((key) => record[key] !== undefined)
      .map((key) => [key, record[key]]),
  );
};

export const createErrorSignature = (
  payload: Omit<RuntimeErrorPayload, "signature">,
): string =>
  [
    payload.source,
    payload.context.pathname,
    payload.error.name,
    payload.error.message,
    payload.error.stacktrace.slice(0, 300),
  ].join(":");

export const createRuntimeErrorPayload = (
  input: RuntimeErrorInput,
): RuntimeErrorPayload => {
  const basePayload = {
    source: input.source,
    error: normalizeRuntimeError(input.error, input.componentStack, input.digest),
    context: collectRuntimeContext(),
    performance: collectRuntimePerformance(),
    logs: (input.logs || []).map(serializeForLog),
    metadata: {
      ...pickDiagnosticMetadata(input.error),
      ...(input.metadata && typeof input.metadata === "object"
        ? (input.metadata as Record<string, unknown>)
        : input.metadata !== undefined
          ? { value: input.metadata }
          : {}),
    },
  };

  return sanitizePayload({
    ...basePayload,
    signature: createErrorSignature(basePayload),
  });
};
