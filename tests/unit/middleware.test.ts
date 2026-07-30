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

describe("MX-03 | Autenticación, sesiones, roles y permisos | Frontend Admin | Middleware", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("AUT-LOG-P0-002 | normaliza roles y estados de sesión", () => {
    expect(normalizeRole("ALCALDE")).toBe("MAYOR");
    expect(normalizeRole("tenantadmin")).toBe("TENANT_ADMIN");
    expect(normalizeRole("ADMIN")).toBe("SUPERADMIN");
    expect(normalizeRole("ACCESS_APPROVER")).toBe("ACCESS_APPROVER");
    expect(normalizeRole("unknown")).toBe("publico");

    expect(normalizeStatus("ACTIVE", "false")).toBe("ACTIVE");
    expect(normalizeStatus(null, "true")).toBe("ACTIVE");
    expect(normalizeStatus(undefined, "false")).toBe("PENDING");
  });

  it("AUT-SES-P0-004 | marca tokens expirados como inválidos", () => {
    const expiredToken = createToken({
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    expect(isExpired(expiredToken)).toBe(true);
    expect(isExpired(null)).toBe(true);
  });

  it("AUT-GRD-P0-001 | redirige rutas admin resultados al login canónico sin sesión válida", () => {
    const response = middleware(createRequest("/resultados/panel"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/resultados/login?from=%2Fresultados%2Fpanel",
    );
  });

  it("AUT-STA-P0-002 | redirige usuarios resultados pendientes a pendiente", () => {
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

  it("AUT-GRD-P0-002 / AUT-TER-P0-001 | impide a MAYOR entrar a rutas admin resultados", () => {
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

  it("AUT-ARE-P0-004 | redirige SUPERADMIN global fuera de rutas admin resultados", () => {
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

  it("AUT-SUP-P0-001 | permite usuarios SUPERADMIN en rutas superadmin", () => {
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

  it("AUT-SUP-P0-001 | permite contexto GLOBAL_ADMIN en rutas superadmin", () => {
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

  it("AUT-SUP-P0-003 | permite cookie dev superadmin solo con dev auth habilitado", () => {
    vi.stubEnv("ENABLE_DEV_AUTH", "true");

    const response = handleSuperadminAccess(
      createRequest("/superadmin", {
        [DEV_AUTH_COOKIE]: DEV_AUTH_COOKIE_VALUE,
      }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("AUT-ARE-P0-004 | redirige SUPERADMIN global fuera de rutas privadas de votación", () => {
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

  it("AUT-SUP-P0-003 | bloquea cookie dev superadmin cuando dev auth está deshabilitado", () => {
    const response = handleSuperadminAccess(
      createRequest("/superadmin", {
        [DEV_AUTH_COOKIE]: DEV_AUTH_COOKIE_VALUE,
      }),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost/resultados/login?from=%2Fsuperadmin",
    );
  });

  it("AUT-SUP-P0-002 / AUT-ARE-P0-003 | bloquea usuarios no superadmin en rutas superadmin", () => {
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

  it("AUT-GRD-P0-001 | redirige acceso anónimo superadmin al login resultados", () => {
    const response = middleware(createRequest("/superadmin/tvd/asignacion"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/resultados/login?from=%2Fsuperadmin%2Ftvd%2Fasignacion",
    );
  });

  it("AUT-ARE-P0-002 | deja usuarios no tenant de votación llegar al guard cliente", () => {
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

  it("AUT-ARE-P0-002 | permite tenant admin en rutas canónicas de votación", () => {
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

  it("AUT-ARE-P0-002 | deja ACCESS_APPROVER llegar a votación para aviso de dominio", () => {
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
