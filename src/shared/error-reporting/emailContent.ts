import { serializeForLog } from "./sanitize";
import type { RuntimeErrorPayload } from "./types";

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const pre = (value: unknown): string =>
  `<pre style="white-space:pre-wrap;background:#f6f8fa;border:1px solid #d0d7de;border-radius:6px;padding:12px;">${escapeHtml(
    typeof value === "string" ? value : JSON.stringify(value, null, 2),
  )}</pre>`;

const hasMetadata = (payload: RuntimeErrorPayload): boolean =>
  Boolean(
    payload.metadata &&
      typeof payload.metadata === "object" &&
      Object.keys(payload.metadata).length > 0,
  );

export const createRuntimeErrorEmailHtml = (
  payload: RuntimeErrorPayload,
  logoUrl = "",
): string => `<!doctype html>
<html lang="es">
  <body style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.5;">
    ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="height:40px;margin-bottom:16px;" />` : ""}
    <h1>Frontend Admin runtime error detected</h1>
    <h2>Resumen del error</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
      <tr><td><strong>Aplicación</strong></td><td>Frontend Admin</td></tr>
      <tr><td><strong>Entorno</strong></td><td>${escapeHtml(payload.context.environment)}</td></tr>
      <tr><td><strong>Timestamp</strong></td><td>${escapeHtml(payload.context.timestamp)}</td></tr>
      <tr><td><strong>Origen</strong></td><td>${escapeHtml(payload.source)}</td></tr>
      <tr><td><strong>URL</strong></td><td>${escapeHtml(payload.context.url)}</td></tr>
      <tr><td><strong>Ruta</strong></td><td>${escapeHtml(payload.context.pathname)}</td></tr>
      <tr><td><strong>Nombre</strong></td><td>${escapeHtml(payload.error.name)}</td></tr>
      <tr><td><strong>Razón / mensaje</strong></td><td>${escapeHtml(payload.error.message)}</td></tr>
      <tr><td><strong>Firma</strong></td><td>${escapeHtml(payload.signature)}</td></tr>
      <tr><td><strong>Errores en sesión</strong></td><td>${escapeHtml(payload.context.errorCountInSession)}</td></tr>
    </table>

    <h2>Mensaje / razón del error</h2>
    ${pre(`${payload.error.name}: ${payload.error.message}`)}

    <h2>Stacktrace</h2>
    ${pre(payload.error.stacktrace || "sin stacktrace disponible")}

    <h2>Component stack</h2>
    ${pre(payload.error.componentStack || "sin component stack disponible")}

    <h2>User agent</h2>
    ${pre(payload.context.userAgent)}

    <h2>Métricas de rendimiento</h2>
    ${pre(payload.performance)}

    <h2>Logs</h2>
    ${pre(payload.logs.length > 0 ? payload.logs.join("\n\n") : "sin logs adicionales")}

    <h2>Body/contexto saneado</h2>
    ${pre(hasMetadata(payload) ? payload.metadata : "sin metadata adicional")}
  </body>
</html>`;

export const createRuntimeErrorTextEmail = (
  payload: RuntimeErrorPayload,
): string =>
  [
    "Frontend Admin runtime error detected",
    "",
    "Resumen del error:",
    `Environment: ${payload.context.environment}`,
    `Timestamp: ${payload.context.timestamp}`,
    `Source: ${payload.source}`,
    `URL: ${payload.context.url}`,
    `Pathname: ${payload.context.pathname}`,
    `Error name: ${payload.error.name}`,
    `Error message: ${payload.error.message}`,
    `Signature: ${payload.signature}`,
    `Session error count: ${payload.context.errorCountInSession}`,
    "",
    "Mensaje / razon del error:",
    `${payload.error.name}: ${payload.error.message}`,
    "",
    "Stacktrace:",
    payload.error.stacktrace || "sin stacktrace disponible",
    "",
    "Component stack:",
    payload.error.componentStack || "sin component stack disponible",
    "",
    "Performance:",
    serializeForLog(payload.performance),
    "",
    "Logs:",
    payload.logs.join("\n\n") || "sin logs adicionales",
    "",
    "Body/contexto saneado:",
    hasMetadata(payload) ? serializeForLog(payload.metadata) : "sin metadata adicional",
  ].join("\n");
