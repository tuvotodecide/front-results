"use client";

import { useMemo, useSyncExternalStore } from "react";
import { isBrowser } from "@/shared/platform/browser";

export interface BrowserLocationSnapshot {
  pathname: string;
  search: string;
  hash: string;
  href: string;
}

const EMPTY_SNAPSHOT: BrowserLocationSnapshot = {
  pathname: "",
  search: "",
  hash: "",
  href: "",
};

let cachedSnapshot: BrowserLocationSnapshot = EMPTY_SNAPSHOT;

const listeners = new Set<() => void>();
let historyPatched = false;
let notifyTimeoutId: number | null = null;

const notifyListeners = () => {
  if (!isBrowser()) {
    return;
  }

  if (notifyTimeoutId !== null) {
    window.clearTimeout(notifyTimeoutId);
  }

  notifyTimeoutId = window.setTimeout(() => {
    notifyTimeoutId = null;
    listeners.forEach((listener) => listener());
  }, 0);
};

const patchHistory = () => {
  if (!isBrowser() || historyPatched) {
    return;
  }

  historyPatched = true;

  const wrapHistoryMethod = (method: "pushState" | "replaceState") => {
    const original = window.history[method];

    window.history[method] = function patchedHistoryMethod(
      ...args: Parameters<History["pushState"]>
    ) {
      const result = original.apply(this, args);
      notifyListeners();
      return result;
    };
  };

  wrapHistoryMethod("pushState");
  wrapHistoryMethod("replaceState");
};

const getSnapshot = (): BrowserLocationSnapshot => {
  if (!isBrowser()) {
    return EMPTY_SNAPSHOT;
  }

  const nextSnapshot = {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    href: window.location.href,
  };

  if (
    cachedSnapshot.pathname === nextSnapshot.pathname &&
    cachedSnapshot.search === nextSnapshot.search &&
    cachedSnapshot.hash === nextSnapshot.hash &&
    cachedSnapshot.href === nextSnapshot.href
  ) {
    return cachedSnapshot;
  }

  cachedSnapshot = nextSnapshot;
  return cachedSnapshot;
};

const subscribe = (listener: () => void) => {
  if (!isBrowser()) {
    return () => undefined;
  }

  patchHistory();
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  window.addEventListener("hashchange", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
    window.removeEventListener("hashchange", listener);
  };
};

export const useBrowserLocation = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SNAPSHOT);

export const useBrowserSearchParams = () => {
  const { search } = useBrowserLocation();

  return useMemo(() => new URLSearchParams(search), [search]);
};

const buildUrl = ({
  pathname,
  search,
  hash,
}: {
  pathname?: string;
  search?: string;
  hash?: string;
}) => {
  if (!isBrowser()) {
    return "";
  }

  const nextPathname = pathname ?? window.location.pathname;
  const normalizedSearch = search
    ? search.startsWith("?")
      ? search
      : `?${search}`
    : "";
  const normalizedHash = hash
    ? hash.startsWith("#")
      ? hash
      : `#${hash}`
    : "";

  return `${nextPathname}${normalizedSearch}${normalizedHash}`;
};

export const replaceBrowserUrl = ({
  pathname,
  search,
  hash,
}: {
  pathname?: string;
  search?: string;
  hash?: string;
}) => {
  if (!isBrowser()) {
    return;
  }

  window.history.replaceState(window.history.state, "", buildUrl({
    pathname,
    search,
    hash,
  }));
};

export const pushBrowserUrl = ({
  pathname,
  search,
  hash,
}: {
  pathname?: string;
  search?: string;
  hash?: string;
}) => {
  if (!isBrowser()) {
    return;
  }

  window.history.pushState(window.history.state, "", buildUrl({
    pathname,
    search,
    hash,
  }));
};
