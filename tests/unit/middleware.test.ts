import { NextRequest } from "next/server";
import {
  AUTH_COOKIE_KEYS,
  handleResultadosAccess,
  handleVotacionAccess,
  isExpired,
  middleware,
  normalizeRole,
  normalizeStatus,
} from "../../middleware";

const createToken = (payload: Record<string, unknown>) => {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
    "base64url",
  );
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
};

const createRequest = (
  pathname: string,
  cookies: Record<string, string> = {},
) => {
  const cookieHeader = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

  return new NextRequest(`http://localhost${pathname}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
};

describe("middleware access rules", () => {
  it("normalizes roles and statuses", () => {
    expect(normalizeRole("ALCALDE")).toBe("MAYOR");
    expect(normalizeRole("tenantadmin")).toBe("TENANT_ADMIN");
    expect(normalizeRole("unknown")).toBe("publico");

    expect(normalizeStatus("ACTIVE", "false")).toBe("ACTIVE");
    expect(normalizeStatus(null, "true")).toBe("ACTIVE");
    expect(normalizeStatus(undefined, "false")).toBe("PENDING");
  });

  it("marks expired tokens as invalid", () => {
    const expiredToken = createToken({
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    expect(isExpired(expiredToken)).toBe(true);
    expect(isExpired(null)).toBe(true);
  });

  it("redirects resultados admin paths to canonical login when there is no valid session", () => {
    const response = middleware(createRequest("/resultados/panel"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/resultados/login?from=%2Fresultados%2Fpanel",
    );
  });

  it("redirects pending resultados users to pendiente", () => {
    const token = createToken({
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "SUPERADMIN",
      active: false,
    });

    const response = handleResultadosAccess(
      createRequest("/resultados/panel", {
        [AUTH_COOKIE_KEYS.token]: token,
        [AUTH_COOKIE_KEYS.role]: "SUPERADMIN",
        [AUTH_COOKIE_KEYS.status]: "PENDING",
        [AUTH_COOKIE_KEYS.active]: "false",
      }),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost/resultados/pendiente",
    );
  });

  it("prevents mayor users from entering resultados admin routes", () => {
    const token = createToken({
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "MAYOR",
      active: true,
    });

    const response = handleResultadosAccess(
      createRequest("/resultados/departamentos", {
        [AUTH_COOKIE_KEYS.token]: token,
        [AUTH_COOKIE_KEYS.role]: "MAYOR",
        [AUTH_COOKIE_KEYS.status]: "ACTIVE",
        [AUTH_COOKIE_KEYS.active]: "true",
      }),
    );

    expect(response.headers.get("location")).toBe("http://localhost/resultados");
  });

  it("allows superadmin users into resultados admin routes", () => {
    const token = createToken({
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "SUPERADMIN",
      active: true,
    });

    const response = handleResultadosAccess(
      createRequest("/resultados/panel", {
        [AUTH_COOKIE_KEYS.token]: token,
        [AUTH_COOKIE_KEYS.role]: "SUPERADMIN",
        [AUTH_COOKIE_KEYS.status]: "ACTIVE",
        [AUTH_COOKIE_KEYS.active]: "true",
      }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects non-tenant voting users to root", () => {
    const token = createToken({
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "publico",
      active: true,
    });

    const response = handleVotacionAccess(
      createRequest("/votacion/elecciones/new", {
        [AUTH_COOKIE_KEYS.token]: token,
        [AUTH_COOKIE_KEYS.role]: "publico",
        [AUTH_COOKIE_KEYS.status]: "ACTIVE",
        [AUTH_COOKIE_KEYS.active]: "true",
      }),
    );

    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("allows tenant admin users into canonical voting routes", () => {
    const token = createToken({
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "TENANT_ADMIN",
      active: true,
    });

    const response = handleVotacionAccess(
      createRequest("/votacion/elecciones/new", {
        [AUTH_COOKIE_KEYS.token]: token,
        [AUTH_COOKIE_KEYS.role]: "TENANT_ADMIN",
        [AUTH_COOKIE_KEYS.status]: "ACTIVE",
        [AUTH_COOKIE_KEYS.active]: "true",
      }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
