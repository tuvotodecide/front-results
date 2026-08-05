import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import SuperadminGuard, { hasSuperadminAccess } from "@/domains/superadmin/guards/SuperadminGuard";
import SuperadminTopNav from "@/domains/superadmin/layout/SuperadminTopNav";
import SuperadminHomePage from "@/domains/superadmin/screens/SuperadminHomePage";
import { resolveHomeByContext, resolvePostLoginRedirect } from "@/store/auth/contextUtils";
import { logOut, type AuthState } from "@/store/auth/authSlice";
import { renderWithAuthStore } from "../utils/renderWithStore";
import { AUTH_COOKIE_KEYS, config, handleResultadosAccess, handleVotacionAccess } from "../../middleware";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/superadmin", useRouter: () => router }));

const globalAuth = {
  token: "global-token", role: "SUPERADMIN", active: true,
  activeContext: { type: "GLOBAL_ADMIN" as const, role: "SUPERADMIN" as const },
  user: { id: "global-1", email: "global@test.dev", name: "Global", role: "SUPERADMIN" as const, active: true },
};

const accessAuth = {
  token: "global-token",
  accessToken: "global-token",
  role: "SUPERADMIN" as const,
  active: true,
  tenantId: null,
  availableContexts: [{ type: "GLOBAL_ADMIN" as const, role: "SUPERADMIN" as const }],
  requiresContextSelection: false,
  defaultContext: null,
  activeContext: { type: "GLOBAL_ADMIN" as const, role: "SUPERADMIN" as const },
  accessStatus: null,
  user: { id: "global-1", email: "global@test.dev", name: "Global", role: "SUPERADMIN" as const, active: true },
} satisfies AuthState;

const request = (path: string) => new NextRequest(`http://localhost${path}`, { headers: { cookie: `${AUTH_COOKIE_KEYS.token}=eyJhbGciOiJub25lIn0.eyJleHAiOjQxMDI0NDQ4MDAsInJvbGUiOiJTVVBFUkFETUlOIiwiYWN0aXZlIjp0cnVlfQ.sig; ${AUTH_COOKIE_KEYS.role}=SUPERADMIN; ${AUTH_COOKIE_KEYS.status}=ACTIVE; ${AUTH_COOKIE_KEYS.active}=true; ${AUTH_COOKIE_KEYS.context}=GLOBAL_ADMIN` } });

const middlewareMatchers = config.matcher as readonly string[];

const isMatchedByMiddleware = (pathname: string) =>
  middlewareMatchers.some((matcher) => {
    if (matcher === "/votacion/elecciones/:electionId/config/:path*") {
      return /^\/votacion\/elecciones\/[^/]+\/config(?:\/.*)?$/.test(pathname);
    }
    if (matcher.endsWith("/:path*")) {
      const prefix = matcher.slice(0, -"/:path*".length);
      return pathname === prefix || pathname.startsWith(`${prefix}/`);
    }
    return pathname === matcher;
  });

describe("MX-16 | acceso y shell Superadmin", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); router.replace.mockReset(); });

  it("[MX-16][ADM-ACC-P0-001][INTEGRACION] resuelve acceso global, home, rutas privadas y rutas públicas sin exponer datos con sesión inválida", async () => {
    const globalContext = { type: "GLOBAL_ADMIN" as const, role: "SUPERADMIN" as const };
    expect(hasSuperadminAccess({ ...accessAuth, availableContexts: [globalContext] })).toBe(true);
    expect(hasSuperadminAccess({ ...accessAuth, role: "TENANT_ADMIN", activeContext: null, availableContexts: [{ type: "TENANT", role: "TENANT_ADMIN" }], user: { ...accessAuth.user, role: "TENANT_ADMIN" } })).toBe(false);
    expect(resolveHomeByContext(globalContext)).toBe("/superadmin");
    expect(resolvePostLoginRedirect({ availableContexts: [globalContext], requiresContextSelection: false, defaultContext: globalContext, activeContext: globalContext, accessStatus: null }, "/resultados/panel")).toBe("/superadmin");
    renderWithAuthStore(<SuperadminGuard><p>Panel global</p></SuperadminGuard>, globalAuth);
    expect(screen.getByText("Panel global")).toBeInTheDocument();
    vi.stubEnv("ENABLE_DEV_AUTH", "true");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ session: globalAuth }), { status: 200 })));
    cleanup();
    renderWithAuthStore(<SuperadminGuard><p>Panel dev</p></SuperadminGuard>);
    await waitFor(() => expect(screen.getByText("Panel dev")).toBeInTheDocument());
    expect(handleVotacionAccess(request("/votacion/elecciones/new")).headers.get("location")).toBe("http://localhost/superadmin");
    expect(handleResultadosAccess(request("/resultados/panel")).headers.get("location")).toBe("http://localhost/superadmin");
    expect(isMatchedByMiddleware("/votacion/elecciones/election-publica/publica")).toBe(false);
    expect(isMatchedByMiddleware("/votacion/elecciones/pasadas")).toBe(false);
    expect(isMatchedByMiddleware("/resultados/mesa/table-publica")).toBe(false);
    expect(isMatchedByMiddleware("/resultados/imagen/image-publica")).toBe(false);
    cleanup();
    renderWithAuthStore(<SuperadminGuard><p>Datos globales inválidos</p></SuperadminGuard>);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/resultados/login?from=%2Fsuperadmin"));
    expect(screen.queryByText("Datos globales inválidos")).not.toBeInTheDocument();
  });

  it("[MX-16][ADM-ACC-P0-002][INTEGRACION] mantiene menú, navegación global, contexto autorizado y cierre de sesión sin habilitar una sesión institucional", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<SuperadminTopNav />, globalAuth);
    await user.click(screen.getByRole("button", { name: /\$TVD/i }));
    expect(screen.getByRole("link", { name: /Contrato \$TVD/i })).toHaveAttribute("href", "/superadmin/tvd/contrato");
    await user.click(screen.getByRole("button", { name: /Gestión/i }));
    expect(screen.getByRole("link", { name: /Recuperación institucional/i })).toHaveAttribute("href", "/superadmin/gestion/recuperacion");
    expect(resolvePostLoginRedirect({ availableContexts: [{ type: "GLOBAL_ADMIN", role: "SUPERADMIN" }], requiresContextSelection: false, defaultContext: null, activeContext: globalAuth.activeContext, accessStatus: null }, "/superadmin/tvd/contrato")).toBe("/superadmin/tvd/contrato");
    expect(logOut().type).toContain("logOut");
    cleanup();
    renderWithAuthStore(<SuperadminGuard><p>Contenido institucional</p></SuperadminGuard>, { ...globalAuth, role: "TENANT_ADMIN", activeContext: null, user: { ...globalAuth.user, role: "TENANT_ADMIN" } });
    expect(screen.getByText("Acceso restringido")).toBeInTheDocument();
    expect(screen.queryByText("Contenido institucional")).not.toBeInTheDocument();
  });

  it("[MX-16][ADM-PNL-P1-001][INTEGRACION] navega desde cards con enlaces semánticos", () => {
    renderWithAuthStore(<SuperadminHomePage />, globalAuth);
    expect(screen.getByRole("link", { name: /Operaciones \$TVD/i })).toHaveAttribute("href", "/superadmin/tvd/operaciones");
  });

  it("[MX-16][ADM-SEC-P0-001][INTEGRACION] restringe URL directa para visitante e institucional, conserva rutas públicas y sanitiza los errores de acceso", async () => {
    renderWithAuthStore(<SuperadminGuard><p>Datos globales</p></SuperadminGuard>);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/resultados/login?from=%2Fsuperadmin"));
    expect(screen.queryByText("Datos globales")).not.toBeInTheDocument();
    expect(isMatchedByMiddleware("/resultados/mesa/table-publica")).toBe(false);
    expect(isMatchedByMiddleware("/resultados/imagen/image-publica")).toBe(false);
    expect(isMatchedByMiddleware("/votacion/elecciones/election-publica/publica")).toBe(false);
  });

  it("[MX-16][ADM-UX-P2-001][INTEGRACION] actualiza aria-expanded al operar los dropdowns", async () => {
    const user = userEvent.setup();
    renderWithAuthStore(<SuperadminTopNav />, globalAuth);
    const tvd = screen.getByRole("button", { name: /\$TVD/i });
    expect(tvd).toHaveAttribute("aria-expanded", "false");
    await user.click(tvd);
    expect(tvd).toHaveAttribute("aria-expanded", "true");
  });
});
