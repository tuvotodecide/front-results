const MAX_STRING_LENGTH = 4000;
const MAX_ARRAY_LENGTH = 40;
const MAX_OBJECT_KEYS = 80;
const REDACTED = "[REDACTED]";
const CIRCULAR = "[Circular]";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "apikey",
  "accesskey",
  "access_token",
  "refresh_token",
  "accesstoken",
  "refreshtoken",
]);

export const isSensitiveKey = (key: string): boolean => {
  const normalized = key.toLowerCase().replace(/[-_\s]/g, "");
  return SENSITIVE_KEYS.has(normalized) || SENSITIVE_KEYS.has(key.toLowerCase());
};

export const truncateString = (
  value: string,
  maxLength = MAX_STRING_LENGTH,
): string => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}\n[TRUNCATED]`;
};

export const sanitizeValue = (
  value: unknown,
  seen: WeakSet<object> = new WeakSet<object>(),
): unknown => {
  if (typeof value === "string") return truncateString(value);
  if (value === null || typeof value !== "object") return value;

  if (seen.has(value)) return CIRCULAR;
  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_LENGTH)
      .map((item) => sanitizeValue(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, MAX_OBJECT_KEYS)
      .map(([key, nestedValue]) => [
        key,
        isSensitiveKey(key) ? REDACTED : sanitizeValue(nestedValue, seen),
      ]),
  );
};

export const serializeForLog = (value: unknown): string => {
  if (typeof value === "string") return truncateString(value);
  if (value instanceof Error) {
    return truncateString(`${value.name}: ${value.message}\n${value.stack || ""}`);
  }

  try {
    return truncateString(JSON.stringify(sanitizeValue(value), null, 2));
  } catch (error) {
    return `[Unserializable value: ${
      error instanceof Error ? error.message : String(error)
    }]`;
  }
};

export const sanitizePayload = <T>(payload: T): T => sanitizeValue(payload) as T;
