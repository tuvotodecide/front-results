const NAVIGATION_START_EVENT = "app:navigation-start";

export const emitNavigationStart = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
};

export const onNavigationStart = (listener: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(NAVIGATION_START_EVENT, listener);
  return () => {
    window.removeEventListener(NAVIGATION_START_EVENT, listener);
  };
};

export const resolveLogoutDestination = (pathname: string) => {
  if (pathname.startsWith("/resultados")) {
    return "/resultados/login";
  }

  return "/votacion/login";
};
