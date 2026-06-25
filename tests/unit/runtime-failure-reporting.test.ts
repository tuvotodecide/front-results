import { NextRequest } from "next/server";
import { describe, expect, it, vi, afterEach } from "vitest";
import { POST } from "@/app/api/error-report/route";
import {
  createRuntimeErrorEmailHtml,
  createRuntimeErrorTextEmail,
} from "@/shared/error-reporting/emailContent";
import { collectRuntimePerformance } from "@/shared/error-reporting/performance";
import {
  createRuntimeErrorPayload,
  normalizeRuntimeError,
} from "@/shared/error-reporting/runtimeError";
import { sanitizePayload, serializeForLog } from "@/shared/error-reporting/sanitize";
import {
  createRuntimeErrorThrottleState,
  shouldSendRuntimeError,
} from "@/shared/error-reporting/throttle";

const originalEnv = { ...process.env };

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...originalEnv };
});

describe("runtime failure reporting", () => {
  it("normalizes Error instances with stacktrace and component stack", () => {
    const error = new Error("Render failed");
    error.stack = "Error: Render failed\n at Component";

    const normalized = normalizeRuntimeError(error, "at <Panel />", "digest-1");

    expect(normalized).toMatchObject({
      name: "Error",
      message: "Render failed",
      stacktrace: "Error: Render failed\n at Component",
      componentStack: "at <Panel />",
      digest: "digest-1",
    });
  });

  it("normalizes non-Error values without inventing stacktrace", () => {
    const normalized = normalizeRuntimeError({ reason: "boom" });

    expect(normalized.name).toBe("NonErrorRuntimeFailure");
    expect(normalized.message).toContain("boom");
    expect(normalized.stacktrace).toBe("sin stacktrace disponible");
  });

  it("sanitizes sensitive keys and truncates large values", () => {
    const sanitized = sanitizePayload({
      password: "secret",
      nested: {
        accessToken: "token",
        safe: "visible",
      },
      large: "x".repeat(5000),
    });

    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.nested.accessToken).toBe("[REDACTED]");
    expect(sanitized.nested.safe).toBe("visible");
    expect(sanitized.large).toContain("[TRUNCATED]");
  });

  it("serializes Error values for logs without throwing", () => {
    const error = new Error("Console failure");
    const serialized = serializeForLog(error);

    expect(serialized).toContain("Console failure");
  });

  it("deduplicates signatures inside the cooldown window", () => {
    const state = createRuntimeErrorThrottleState();

    expect(shouldSendRuntimeError("same-error", state, 1000, 5000)).toBe(true);
    expect(shouldSendRuntimeError("same-error", state, 2000, 5000)).toBe(false);
    expect(shouldSendRuntimeError("same-error", state, 7000, 5000)).toBe(true);
  });

  it("collects runtime performance metrics safely", () => {
    const metrics = collectRuntimePerformance();

    expect(metrics).toHaveProperty("nowMs");
    expect(metrics).toHaveProperty("timeSincePageLoadMs");
    expect(metrics).toHaveProperty("navigationType");
  });

  it("builds a sanitized payload with context and signature", () => {
    window.history.pushState({}, "", "/resultados/panel");

    const payload = createRuntimeErrorPayload({
      source: "console",
      error: new Error("Token leaked"),
      logs: [{ token: "secret", message: "safe" }],
    });

    expect(payload.source).toBe("console");
    expect(payload.context.pathname).toBe("/resultados/panel");
    expect(payload.signature).toContain("console:/resultados/panel");
    expect(payload.logs.join("\n")).toContain("[REDACTED]");
  });

  it("keeps safe API diagnostic metadata and redacts sensitive body fields", () => {
    window.history.pushState({}, "", "/resultados/auditoria-tse");

    const payload = createRuntimeErrorPayload({
      source: "api",
      error: {
        message: "Request failed",
        endpoint: "/api/v1/results",
        method: "POST",
        statusCode: 500,
        requestBody: {
          electionId: "election-1",
          password: "hidden",
          accessToken: "hidden-token",
        },
        responseBody: {
          reason: "database timeout",
          refreshToken: "hidden-refresh",
        },
      },
      metadata: {
        body: {
          tableCode: "mesa-1",
          authorization: "Bearer secret",
        },
      },
    });

    expect(payload.metadata).toMatchObject({
      endpoint: "/api/v1/results",
      method: "POST",
      statusCode: 500,
      requestBody: {
        electionId: "election-1",
        password: "[REDACTED]",
        accessToken: "[REDACTED]",
      },
      responseBody: {
        reason: "database timeout",
        refreshToken: "[REDACTED]",
      },
      body: {
        tableCode: "mesa-1",
        authorization: "[REDACTED]",
      },
    });
  });

  it("renders useful email content with reason, stacktrace, metadata and performance", () => {
    const error = new Error("Audit report failed because TSE response timed out");
    error.stack = "Error: Audit report failed\n at AuditAndMatch";

    const payload = createRuntimeErrorPayload({
      source: "api",
      error,
      componentStack: "at AuditAndMatchPage",
      metadata: {
        endpoint: "/api/v1/reports/audit",
        method: "GET",
        statusCode: 504,
        responseBody: {
          reason: "TSE timeout",
          token: "must-not-leak",
        },
      },
    });

    const html = createRuntimeErrorEmailHtml(payload);
    const text = createRuntimeErrorTextEmail(payload);

    expect(html).toContain("Resumen del error");
    expect(html).toContain("Mensaje / razón del error");
    expect(html).toContain("Audit report failed because TSE response timed out");
    expect(html).toContain("Error: Audit report failed");
    expect(html).toContain("Body/contexto saneado");
    expect(html).toContain("/api/v1/reports/audit");
    expect(html).toContain("Métricas de rendimiento");
    expect(html).toContain("[REDACTED]");
    expect(html).not.toContain("must-not-leak");
    expect(text).toContain("Error message: Audit report failed because TSE response timed out");
    expect(text).toContain("Performance:");
    expect(text).toContain("Body/contexto saneado:");
  });

  it("keeps the server route disabled when SES env is missing", async () => {
    delete process.env.ERROR_ALERT_EMAIL_TO;
    delete process.env.SES_REGION;
    delete process.env.SES_ACCESS_KEY_ID;
    delete process.env.SES_SECRET_ACCESS_KEY;
    delete process.env.SES_FROM_MAIL;

    const payload = createRuntimeErrorPayload({
      source: "global",
      error: new Error("Server route check"),
    });

    const request = new NextRequest("http://localhost/api/error-report", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.status).toBe("disabled");
    expect(body.missingEnv).toContain("ERROR_ALERT_EMAIL_TO");
  });

  it("does not require public env variables for secrets", () => {
    expect(process.env.NEXT_PUBLIC_SES_ACCESS_KEY_ID).toBeUndefined();
    expect(process.env.NEXT_PUBLIC_SES_SECRET_ACCESS_KEY).toBeUndefined();
    expect(process.env.NEXT_PUBLIC_ERROR_ALERT_EMAIL_TO).toBeUndefined();
  });
});
