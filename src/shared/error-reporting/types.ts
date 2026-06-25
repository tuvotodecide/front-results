export type RuntimeErrorSource =
  | "render"
  | "next-error"
  | "global"
  | "promise"
  | "console"
  | "api";

export interface RuntimeErrorPerformance {
  nowMs: number | null;
  timeSincePageLoadMs: number | null;
  navigationType: string;
  domContentLoadedMs: number | null;
  loadEventMs: number | null;
  jsHeapSizeLimit: number | null;
  totalJSHeapSize: number | null;
  usedJSHeapSize: number | null;
}

export interface RuntimeErrorContext {
  url: string;
  pathname: string;
  timestamp: string;
  userAgent: string;
  environment: string;
  appVersion: string;
  sessionId: string;
  errorCountInSession: number;
}

export interface NormalizedRuntimeError {
  name: string;
  message: string;
  stacktrace: string;
  componentStack?: string;
  digest?: string;
}

export interface RuntimeErrorPayload {
  source: RuntimeErrorSource;
  error: NormalizedRuntimeError;
  context: RuntimeErrorContext;
  performance: RuntimeErrorPerformance;
  logs: string[];
  metadata?: unknown;
  signature: string;
}

export interface RuntimeErrorInput {
  source: RuntimeErrorSource;
  error: unknown;
  componentStack?: string;
  logs?: unknown[];
  metadata?: unknown;
  digest?: string;
}
