const isBrowser = () => typeof window !== "undefined";
const defaultCookieAttributes = "Path=/; SameSite=Lax";

export const readStorage = (key: string): string | null => {
  if (!isBrowser()) return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: string) => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures to preserve current runtime behavior.
  }
};

export const writeCookie = (key: string, value: string) => {
  if (!isBrowser()) return;

  try {
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; ${defaultCookieAttributes}`;
  } catch {
    // Ignore cookie write failures to preserve current runtime behavior.
  }
};

export const removeStorage = (key: string) => {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage removal failures to preserve current runtime behavior.
  }
};

export const removeCookie = (key: string) => {
  if (!isBrowser()) return;

  try {
    document.cookie = `${encodeURIComponent(key)}=; Max-Age=0; ${defaultCookieAttributes}`;
  } catch {
    // Ignore cookie removal failures to preserve current runtime behavior.
  }
};
