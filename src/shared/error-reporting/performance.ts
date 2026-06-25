import type { RuntimeErrorPerformance } from "./types";

type BrowserPerformanceMemory = {
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
};

type BrowserPerformance = Performance & {
  memory?: BrowserPerformanceMemory;
};

const round = (value: number | undefined): number | null =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : null;

export const collectRuntimePerformance = (): RuntimeErrorPerformance => {
  if (typeof window === "undefined" || typeof window.performance === "undefined") {
    return {
      nowMs: null,
      timeSincePageLoadMs: null,
      navigationType: "unavailable",
      domContentLoadedMs: null,
      loadEventMs: null,
      jsHeapSizeLimit: null,
      totalJSHeapSize: null,
      usedJSHeapSize: null,
    };
  }

  const performanceApi = window.performance as BrowserPerformance;
  const navigation = performanceApi.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  const nowMs = round(performanceApi.now());
  const timeOrigin = round(performanceApi.timeOrigin);
  const currentEpochMs = Date.now();

  return {
    nowMs,
    timeSincePageLoadMs:
      timeOrigin === null ? nowMs : Math.max(0, currentEpochMs - timeOrigin),
    navigationType: navigation?.type || "unknown",
    domContentLoadedMs: round(navigation?.domContentLoadedEventEnd),
    loadEventMs: round(navigation?.loadEventEnd),
    jsHeapSizeLimit: round(performanceApi.memory?.jsHeapSizeLimit),
    totalJSHeapSize: round(performanceApi.memory?.totalJSHeapSize),
    usedJSHeapSize: round(performanceApi.memory?.usedJSHeapSize),
  };
};
