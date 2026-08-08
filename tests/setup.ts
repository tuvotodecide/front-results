import "@testing-library/jest-dom/vitest";

// jsdom's AbortSignal shares Node's native AbortSignal prototype chain (so
// `instanceof` passes) but isn't recognized by Node's internal fetch/Request
// brand check, which is stricter than `instanceof`. RTK Query's fetchBaseQuery
// always attaches a signal (from its own AbortController) when building a
// Request, so under jsdom that signal makes the native Request constructor
// throw before any mocked `fetch` is ever called. Strip all signals so Request
// construction succeeds in tests; request cancellation isn't exercised here.
const NativeRequest = globalThis.Request;
if (NativeRequest) {
  class TestRequest extends NativeRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      super(input, init?.signal ? { ...init, signal: undefined } : init);
    }
  }

  globalThis.Request = TestRequest as typeof Request;
}

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((cookie) => {
      const [name] = cookie.split("=");
      document.cookie = `${name}=; Max-Age=0; Path=/`;
    });
});
