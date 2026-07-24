import { NextRequest } from "next/server";
import { vi } from "vitest";
import {
  DEV_AUTH_COOKIE,
  DEV_AUTH_COOKIE_VALUE,
} from "@/domains/dev-auth/devAuth";
import {
  AUTH_COOKIE_KEYS,
  handleResultadosAccess,
  handleSuperadminAccess,
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
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes roles and statuses", () => {
    expect(normalizeRole("ALCALDE")).toBe("MAYOR");
    expect(normalizeRole("tenantadmin")).toBe("TENANT_ADMIN");
    expect(normalizeRole("ADMIN")).toBe("SUPERADMIN");
    expect(normalizeRole("ACCESS_APPROVER")).toBe("ACCESS_APPROVER");
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

  it("redirects global superadmin users away from resultados admin routes", () => {
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
        [AUTH_COOKIE_KEYS.context]: "GLOBAL_ADMIN",
      }),
    );

    expect(response.headers.get("location")).toBe("http://localhost/superadmin");
  });

  it("allows superadmin users into superadmin routes", () => {
    const token = createToken({
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "SUPERADMIN",
      active: true,
    });

    const response = handleSuperadminAccess(
      createRequest("/superadmin/tvd/contrato", {
        [AUTH_COOKIE_KEYS.token]: token,
        [AUTH_COOKIE_KEYS.role]: "SUPERADMIN",
        [AUTH_COOKIE_KEYS.status]: "ACTIVE",
        [AUTH_COOKIE_KEYS.active]: "true",
        [AUTH_COOKIE_KEYS.context]: "GLOBAL_ADMIN",
      }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("allows GLOBAL_ADMIN context into superadmin routes", () => {
    const token = createToken({
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "SUPERADMIN",
      active: true,
    });

    const response = handleSuperadminAccess(
      createRequest("/superadmin", {
        [AUTH_COOKIE_KEYS.token]: token,
        [AUTH_COOKIE_KEYS.role]: "SUPERADMIN",
        [AUTH_COOKIE_KEYS.status]: "ACTIVE",
        [AUTH_COOKIE_KEYS.active]: "true",
        [AUTH_COOKIE_KEYS.context]: "GLOBAL_ADMIN",
      }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("allows dev superadmin cookie into superadmin routes only when dev auth is enabled", () => {
    vi.stubEnv("ENABLE_DEV_AUTH", "true");

    const response = handleSuperadminAccess(
      createRequest("/superadmin", {
        [DEV_AUTH_COOKIE]: DEV_AUTH_COOKIE_VALUE,
      }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects global superadmin users away from private voting routes", () => {
    const token = createToken({
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "SUPERADMIN",
      active: true,
    });

    const response = handleVotacionAccess(
      createRequest("/votacion/elecciones/new", {
        [AUTH_COOKIE_KEYS.token]: token,
        [AUTH_COOKIE_KEYS.role]: "SUPERADMIN",
        [AUTH_COOKIE_KEYS.status]: "ACTIVE",
        [AUTH_COOKIE_KEYS.active]: "true",
        [AUTH_COOKIE_KEYS.context]: "GLOBAL_ADMIN",
      }),
    );

    expect(response.headers.get("location")).toBe("http://localhost/superadmin");
  });

  it("does not allow dev superadmin cookie when dev auth is disabled", () => {
    const response = handleSuperadminAccess(
      createRequest("/superadmin", {
        [DEV_AUTH_COOKIE]: DEV_AUTH_COOKIE_VALUE,
      }),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost/resultados/login?from=%2Fsuperadmin",
    );
  });

  it("blocks non-superadmin users from superadmin routes", () => {
    const token = createToken({
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "ACCESS_APPROVER",
      active: true,
    });

    const response = handleSuperadminAccess(
      createRequest("/superadmin/gestion/registros", {
        [AUTH_COOKIE_KEYS.token]: token,
        [AUTH_COOKIE_KEYS.role]: "ACCESS_APPROVER",
        [AUTH_COOKIE_KEYS.status]: "ACTIVE",
        [AUTH_COOKIE_KEYS.active]: "true",
        [AUTH_COOKIE_KEYS.context]: "ACCESS_APPROVALS",
      }),
    );

    expect(response.headers.get("location")).toBe("http://localhost/resultados");
  });

  it("redirects anonymous superadmin access to resultados login", () => {
    const response = middleware(createRequest("/superadmin/tvd/asignacion"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/resultados/login?from=%2Fsuperadmin%2Ftvd%2Fasignacion",
    );
  });

  it("lets non-tenant voting users reach the client guard for the domain notice", () => {
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

    expect(response.headers.get("x-middleware-next")).toBe("1");
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

  it("lets access approvers reach voting routes so the client guard can show the domain notice", () => {
    const token = createToken({
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "ACCESS_APPROVER",
      active: true,
    });

    const response = handleVotacionAccess(
      createRequest("/votacion/elecciones/new", {
        [AUTH_COOKIE_KEYS.token]: token,
        [AUTH_COOKIE_KEYS.role]: "ACCESS_APPROVER",
        [AUTH_COOKIE_KEYS.status]: "ACTIVE",
        [AUTH_COOKIE_KEYS.active]: "true",
        [AUTH_COOKIE_KEYS.context]: "ACCESS_APPROVALS",
      }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
