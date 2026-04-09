import "@testing-library/jest-dom/vitest";

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
