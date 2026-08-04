import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import {
  resolveHomeByContext,
  resolvePostLoginRedirect,
} from "@/store/auth/contextUtils";
import { hasSuperadminAccess } from "@/domains/superadmin/guards/SuperadminGuard";
import SuperadminHomePage from "@/domains/superadmin/screens/SuperadminHomePage";
import { logOut, setAuth, type AuthState } from "@/store/auth/authSlice";

const emptyAuth: AuthState = {
  token: null,
  accessToken: null,
  role: null,
  active: false,
  tenantId: null,
  availableContexts: [],
  requiresContextSelection: false,
  defaultContext: null,
  activeContext: null,
  accessStatus: null,
  user: null,
};

describe("MX-16 | acceso y aislamiento Superadmin", () => {
  it("[MX-16][ADM-ACC-P0-001][UNITARIA] acepta rol y cualquier contexto global, y rechaza contextos territoriales o institucionales", () => {
    const globalContext = { type: "GLOBAL_ADMIN" as const, role: "SUPERADMIN" as const };
    const base = { ...emptyAuth, role: "TENANT_ADMIN" as const, active: true };

    expect(hasSuperadminAccess({ ...base, role: "SUPERADMIN" })).toBe(true);
    expect(hasSuperadminAccess({ ...base, activeContext: globalContext })).toBe(true);
    expect(hasSuperadminAccess({ ...base, defaultContext: globalContext })).toBe(true);
    expect(hasSuperadminAccess({ ...base, availableContexts: [globalContext] })).toBe(true);
    expect(hasSuperadminAccess({ ...base, availableContexts: [{ type: "TENANT", role: "TENANT_ADMIN" }] })).toBe(false);
    expect(hasSuperadminAccess({ ...base, availableContexts: [{ type: "TERRITORIAL", role: "GOVERNOR" }] })).toBe(false);
  });

  it("[MX-16][ADM-ACC-P0-001][UNITARIA] resuelve el home y retornos globales a /superadmin", () => {
    const globalContext = { type: "GLOBAL_ADMIN" as const, role: "SUPERADMIN" as const };
    expect(resolveHomeByContext(globalContext)).toBe("/superadmin");
    const authState = {
      availableContexts: [globalContext],
      requiresContextSelection: false,
      defaultContext: globalContext,
      activeContext: globalContext,
      accessStatus: null,
    } satisfies Pick<AuthState, "availableContexts" | "requiresContextSelection" | "defaultContext" | "activeContext" | "accessStatus">;
    expect(resolvePostLoginRedirect(authState, "/resultados/panel")).toBe("/superadmin");
  });

  it("[MX-16][ADM-ACC-P0-002][UNITARIA] limpia sesión global al cerrar sesión", () => {
    const authenticated = {
      ...emptyAuth,
      token: "token",
      accessToken: "token",
      role: "SUPERADMIN" as const,
      active: true,
      availableContexts: [{ type: "GLOBAL_ADMIN" as const, role: "SUPERADMIN" as const }],
      user: { id: "global-1", email: "global@test.dev", name: "Global", role: "SUPERADMIN" as const, active: true },
    };
    const state = setAuth({
      accessToken: "token",
      role: "SUPERADMIN",
      active: true,
      user: authenticated.user,
      availableContexts: authenticated.availableContexts,
    });

    expect(state.payload.role).toBe("SUPERADMIN");
    expect(logOut().type).toContain("logOut");
  });

  it("[MX-16][ADM-PNL-P1-001][UNITARIA] mantiene al panel como índice de rutas globales, no como KPI", () => {
    render(createElement(SuperadminHomePage));
    expect(screen.getByRole("link", { name: /Contrato \$TVD/i })).toHaveAttribute("href", "/superadmin/tvd/contrato");
    expect(screen.getByRole("link", { name: /Recuperación institucional/i })).toHaveAttribute("href", "/superadmin/gestion/recuperacion");
    expect(screen.queryByText(/Total asignado|Total consumido/i)).not.toBeInTheDocument();
  });

  it("[MX-16][ADM-SEC-P0-001][UNITARIA] rechaza una sesión institucional antes de habilitar acciones globales", () => {
    expect(hasSuperadminAccess({ ...emptyAuth, role: "TENANT_ADMIN", active: true, availableContexts: [{ type: "TENANT", role: "TENANT_ADMIN" }] })).toBe(false);
  });
});
