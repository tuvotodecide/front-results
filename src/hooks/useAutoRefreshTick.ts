import { useEffect, useState } from "react";

interface UseAutoRefreshTickOptions {
  enabled?: boolean;
  intervalMs?: number;
  skipWhenUnfocused?: boolean;
}

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

export default function useAutoRefreshTick(
  options: UseAutoRefreshTickOptions = {},
) {
  const {
    enabled = true,
    intervalMs = DEFAULT_INTERVAL_MS,
    skipWhenUnfocused = true,
  } = options;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      if (
        skipWhenUnfocused &&
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      setTick((prev) => prev + 1);
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [enabled, intervalMs, skipWhenUnfocused]);

  return tick;
}
