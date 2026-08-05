import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loginResultadosValidationSchema } from "@/domains/auth-resultados/screens/LoginResultadosPage";
import { POST as loginDevSuperadmin } from "@/app/api/dev/auth/superadmin/route";
import { authSlice, logOut, setAuth, type AuthState } from "@/store/auth/authSlice";
import { resolveDomainLogin, resolvePostLoginRedirect } from "@/store/auth/contextUtils";
import { AUTH_COOKIE_KEYS, handleResultadosAccess, handleVotacionAccess, isExpired } from "../../middleware";

const token = "e30.eyJzdWIiOiJ1c2VyLTEiLCJyb2xlIjoiQUNDRVNTX0FQUFJPVkVSIiwiYWN0aXZlIjp0cnVlLCJleHAiOjQxMDI0NDQ4MDB9.sig";
const baseState: AuthState = { token: null, accessToken: null, role: null, active: false, tenantId: null, availableContexts: [], requiresContextSelection: false, defaultContext: null, activeContext: null, accessStatus: null, user: null };
const makeToken = (payload: Record<string, unknown>) => `${Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url")}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;
const request = (path: string, cookies: Record<string, string>) => new NextRequest(`http://localhost${path}`, { headers: { cookie: Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join("; ") } });
const approver = { ...baseState, token, accessToken: token, role: "ACCESS_APPROVER" as const, active: true, user: { id: "approver-1", email: "approver@test.local", name: "Aprobador", role: "ACCESS_APPROVER" as const, active: true }, availableContexts: [{ type: "ACCESS_APPROVALS" as const, role: "ACCESS_APPROVER" as const }], activeContext: { type: "ACCESS_APPROVALS" as const, role: "ACCESS_APPROVER" as const } };
const global = { ...baseState, token, accessToken: token, role: "SUPERADMIN" as const, active: true, user: { id: "super-1", email: "super@test.local", name: "Superadmin", role: "SUPERADMIN" as const, active: true }, availableContexts: [{ type: "GLOBAL_ADMIN" as const, role: "SUPERADMIN" as const }], activeContext: { type: "GLOBAL_ADMIN" as const, role: "SUPERADMIN" as const } };

describe("MX-03 | auth y acceso | unitarias canónicas", () => {
  beforeEach(() => { localStorage.clear(); document.cookie.split(";").forEach((entry) => { const name = entry.split("=")[0]?.trim(); if (name) document.cookie = `${name}=; Max-Age=0; Path=/`; }); });
  afterEach(() => vi.unstubAllEnvs());

  it("[MX-03][AUT-CRE-P0-001][UNITARIA] valida credenciales de login canónicas", async () => {
    await expect(loginResultadosValidationSchema.validate({ email: "bad", password: "123" }, { abortEarly: false })).rejects.toMatchObject({ errors: expect.arrayContaining(["Correo electrónico inválido", "Mínimo 8 caracteres"]) });
    await expect(loginResultadosValidationSchema.validate({ email: "admin@test.com", password: "12345678" })).resolves.toMatchObject({ email: "admin@test.com" });
  });
  it("[MX-03][AUT-SES-P0-004][UNITARIA] trata un JWT vencido como sesión inválida", () => {
    expect(isExpired(makeToken({ exp: Math.floor(Date.now() / 1000) - 60 }))).toBe(true); expect(isExpired(null)).toBe(true);
  });
  it("[MX-03][AUT-OUT-P0-001][UNITARIA] limpia estado, storage y cookies locales", () => {
    ["token", "user", "authSession", "authActiveContext", "availableContexts", "accessStatus"].forEach((key) => localStorage.setItem(key, "value"));
    const loggedIn = authSlice.reducer(baseState, setAuth({ accessToken: token, role: "ACCESS_APPROVER", active: true, availableContexts: approver.availableContexts, defaultContext: approver.activeContext!, user: approver.user! }));
    expect(document.cookie).toContain("tvd_auth_token="); const loggedOut = authSlice.reducer(loggedIn, logOut());
    expect(loggedOut).toMatchObject({ token: null, accessToken: null, role: null, active: false, activeContext: null, user: null }); expect(localStorage.getItem("token")).toBeNull(); expect(document.cookie).not.toContain("tvd_auth_token=");
  });
  it("[MX-03][AUT-ARE-P0-004][UNITARIA] redirige global fuera de resultados y votación", () => {
    const activeToken = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600, role: "SUPERADMIN", active: true });
    const cookies = { [AUTH_COOKIE_KEYS.token]: activeToken, [AUTH_COOKIE_KEYS.role]: "SUPERADMIN", [AUTH_COOKIE_KEYS.status]: "ACTIVE", [AUTH_COOKIE_KEYS.active]: "true", [AUTH_COOKIE_KEYS.context]: "GLOBAL_ADMIN" };
    expect(handleResultadosAccess(request("/resultados/panel", cookies)).headers.get("location")).toBe("http://localhost/superadmin"); expect(handleVotacionAccess(request("/votacion/elecciones/new", cookies)).headers.get("location")).toBe("http://localhost/superadmin");
  });
  it("[MX-03][AUT-SUP-P0-003][UNITARIA] bloquea dev auth en producción", async () => {
    vi.stubEnv("ENABLE_DEV_AUTH", "true"); vi.stubEnv("NODE_ENV", "production"); const response = await loginDevSuperadmin(); expect(response.status).toBe(404); expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("[MX-03][AUT-APR-P0-001][UNITARIA] mantiene ACCESS_APPROVER en aprobaciones", () => {
    expect(resolveDomainLogin(approver, "resultados")).toMatchObject({ kind: "allowed", redirectTo: "/aprobaciones" }); expect(resolvePostLoginRedirect(approver, "/resultados/panel")).toBe("/aprobaciones");
  });
  it("[MX-03][AUT-SEC-P0-001][UNITARIA] ignora retorno externo y usa home permitido", () => {
    expect(resolveDomainLogin(global, "resultados")).toMatchObject({ redirectTo: "/superadmin" }); expect(resolvePostLoginRedirect(global, "https://evil.test/superadmin")).toBe("/superadmin"); expect(resolvePostLoginRedirect(global, "//evil.test/superadmin")).toBe("/superadmin");
  });
});
