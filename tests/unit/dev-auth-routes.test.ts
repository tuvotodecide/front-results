import { NextRequest } from "next/server";
import { vi } from "vitest";
import {
  DEV_AUTH_COOKIE,
  DEV_AUTH_COOKIE_VALUE,
} from "@/domains/dev-auth/devAuth";
import { POST as loginDevSuperadmin } from "@/app/api/dev/auth/superadmin/route";
import { POST as logoutDevSuperadmin } from "@/app/api/dev/auth/logout/route";
import { GET as getDevSession } from "@/app/api/dev/auth/session/route";

const createRequest = (cookies: Record<string, string> = {}) => {
  const cookieHeader = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

  return new NextRequest("http://localhost/api/dev/auth/session", {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
};

describe("MX-03 | Autenticación, sesiones, roles y permisos | Frontend Admin | Dev auth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("AUT-SUP-P0-003 | crea sesión dev superadmin solo con flag habilitado", async () => {
    vi.stubEnv("ENABLE_DEV_AUTH", "true");

    const response = await loginDevSuperadmin();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(DEV_AUTH_COOKIE);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(body.session).toMatchObject({
      isDevSession: true,
      role: "SUPERADMIN",
      activeContext: { type: "GLOBAL_ADMIN" },
      user: { role: "SUPERADMIN" },
    });
    expect(JSON.stringify(body)).not.toContain("accessToken");
    expect(JSON.stringify(body)).not.toContain("refreshToken");
    expect(JSON.stringify(body)).not.toContain("token");
  });

  it("AUT-SUP-P0-003 | bloquea dev auth en producción", async () => {
    vi.stubEnv("ENABLE_DEV_AUTH", "true");
    vi.stubEnv("NODE_ENV", "production");

    const response = await loginDevSuperadmin();

    expect(response.status).toBe(404);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("AUT-SUP-P0-003 | dev session devuelve usuario mock seguro sin token", async () => {
    vi.stubEnv("ENABLE_DEV_AUTH", "true");

    const response = await getDevSession(
      createRequest({ [DEV_AUTH_COOKIE]: DEV_AUTH_COOKIE_VALUE }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.authenticated).toBe(true);
    expect(body.session.user.email).toBe("superadmin.local@tuvotodecide.dev");
    expect(JSON.stringify(body)).not.toContain("accessToken");
    expect(JSON.stringify(body)).not.toContain("refreshToken");
  });

  it("AUT-GRD-P0-001 | dev session responde no autenticado sin cookie dev", async () => {
    vi.stubEnv("ENABLE_DEV_AUTH", "true");

    const response = await getDevSession(createRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.authenticated).toBe(false);
    expect(JSON.stringify(body)).not.toContain("SUPERADMIN");
  });

  it("AUT-SUP-P0-003 | dev session queda bloqueada si dev auth está deshabilitado", async () => {
    const response = await getDevSession(
      createRequest({ [DEV_AUTH_COOKIE]: DEV_AUTH_COOKIE_VALUE }),
    );

    expect(response.status).toBe(404);
  });

  it("AUT-OUT-P0-001 | logout dev limpia la cookie dev", async () => {
    vi.stubEnv("ENABLE_DEV_AUTH", "true");

    const response = await logoutDevSuperadmin();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(DEV_AUTH_COOKIE);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
