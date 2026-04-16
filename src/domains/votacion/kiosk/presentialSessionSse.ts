import { getRuntimeEnv } from "@/shared/system/runtimeEnv";

export type PresentialSseEvent = {
  event: string;
  data: unknown;
};

type ConnectPresentialSseOptions = {
  url: string;
  kioskToken?: string | null;
  bearerToken?: string | null;
  signal: AbortSignal;
  onOpen?: () => void;
  onEvent: (event: PresentialSseEvent) => void;
};

const baseApiUrl =
  getRuntimeEnv("VITE_BASE_API_URL", "NEXT_PUBLIC_BASE_API_URL") ||
  "http://localhost:3000/api/v1";

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, "");

export const buildPresentialApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath.startsWith("/api/")) {
    try {
      const base = new URL(baseApiUrl);
      return `${base.protocol}//${base.host}${normalizedPath}`;
    } catch {
      return normalizedPath;
    }
  }

  const normalizedBase = normalizeBaseUrl(baseApiUrl);
  return `${normalizedBase}${normalizedPath}`;
};

const buildHeaders = (
  kioskToken?: string | null,
  bearerToken?: string | null,
) => {
  const headers = new Headers({
    Accept: "text/event-stream",
    "Cache-Control": "no-cache",
  });

  if (kioskToken) {
    headers.set("x-kiosk-token", kioskToken);
  } else if (bearerToken) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }

  return headers;
};

const parsePayload = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const dispatchChunk = (
  rawChunk: string,
  onEvent: (event: PresentialSseEvent) => void,
) => {
  const chunk = rawChunk.trim();
  if (!chunk) return;

  let eventName = "message";
  const dataLines: string[] = [];

  chunk.split("\n").forEach((line) => {
    if (!line || line.startsWith(":")) return;
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
      return;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  });

  onEvent({
    event: eventName,
    data: parsePayload(dataLines.join("\n")),
  });
};

export const extractApiErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as
      | { message?: string; error?: string; details?: string }
      | undefined;

    return (
      payload?.message ||
      payload?.error ||
      payload?.details ||
      `Error ${response.status}`
    );
  } catch {
    return `Error ${response.status}`;
  }
};

export const connectPresentialSse = async ({
  url,
  kioskToken,
  bearerToken,
  signal,
  onOpen,
  onEvent,
}: ConnectPresentialSseOptions) => {
  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(kioskToken, bearerToken),
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(await extractApiErrorMessage(response));
  }

  if (!response.body) {
    throw new Error("El navegador no expuso el stream SSE.");
  }

  onOpen?.();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

    let separatorIndex = buffer.indexOf("\n\n");
    while (separatorIndex >= 0) {
      const chunk = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      dispatchChunk(chunk, onEvent);
      separatorIndex = buffer.indexOf("\n\n");
    }
  }
};
