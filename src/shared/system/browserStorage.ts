const isBrowser = () => typeof window !== "undefined";

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

export const removeStorage = (key: string) => {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage removal failures to preserve current runtime behavior.
  }
};
