import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResultadosPrivateGuard from "@/domains/resultados/guards/ResultadosPrivateGuard";
import VotacionPrivateGuard from "@/domains/votacion/guards/VotacionPrivateGuard";
import SuperadminGuard from "@/domains/superadmin/guards/SuperadminGuard";
import ForgotPasswordResultadosPage from "@/domains/auth-resultados/screens/ForgotPasswordResultadosPage";
import LoginResultadosPage from "@/domains/auth-resultados/screens/LoginResultadosPage";
import LoginVotacionPage from "@/domains/auth-votacion/screens/LoginVotacionPage";
import type { AuthState } from "@/store/auth/authSlice";
import { AUTH_VERSION_MISMATCH_CODE, consumeAuthSessionEndReason, persistAuthSessionEndReason } from "@/store/auth/sessionInvalidation";
import { renderWithAuthStore } from "../utils/renderWithStore";

const router = { replace: vi.fn(), navigate: vi.fn(), pathname: "/resultados/panel", params: new URLSearchParams(), forgot: vi.fn(), login: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: router.replace }), usePathname: () => router.pathname, useSearchParams: () => router.params }));
vi.mock("@/domains/auth-resultados/navigation/compat", () => ({ Link: ({ children, href, to }: { children: ReactNode; href?: string; to?: string }) => <a href={href ?? to}>{children}</a>, useNavigate: () => router.navigate, useSearchParams: () => [router.params] }));
vi.mock("@/domains/auth-votacion/navigation/compat", () => ({ Link: ({ children, href, to }: { children: ReactNode; href?: string; to?: string }) => <a href={href ?? to}>{children}</a>, useNavigate: () => router.navigate, useSearchParams: () => [router.params] }));
vi.mock("@/store/auth/authEndpoints", () => ({ useLoginUserMutation: () => [router.login, { isLoading: false }], useForgotPasswordMutation: () => [router.forgot] }));

const superadmin = {
  token: "token",
  role: "SUPERADMIN",
  active: true,
  user: {
    id: "super",
    email: "super@test.com",
    name: "Super",
    role: "SUPERADMIN",
    active: true,
    status: "ACTIVE",
  },
  activeContext: { type: "GLOBAL_ADMIN", role: "SUPERADMIN" },
} satisfies Partial<AuthState>;

const tenant = {
  token: "token",
  role: "TENANT_ADMIN",
  active: true,
  user: {
    id: "tenant",
    email: "tenant@test.com",
    name: "Tenant",
    role: "TENANT_ADMIN",
    active: true,
    status: "ACTIVE",
  },
  activeContext: { type: "TENANT", role: "TENANT_ADMIN", tenantId: "tenant-1" },
} satisfies Partial<AuthState>;

const territorialMayor = {
  token: "token",
  user: {
    id: "mayor",
    email: "m@test",
    name: "Mayor",
    role: "MAYOR",
    active: true,
    status: "ACTIVE",
  },
  activeContext: { type: "TERRITORIAL", role: "MAYOR" },
} satisfies Partial<AuthState>;

const publicTerritorialUser = {
  token: "token",
  user: {
    id: "public",
    email: "p@test",
    name: "Public",
    role: "publico",
    active: true,
    status: "ACTIVE",
  },
  activeContext: { type: "TERRITORIAL", role: "MAYOR" },
} satisfies Partial<AuthState>;

const accessApprover = {
  token: "token",
  role: "ACCESS_APPROVER",
  active: true,
  user: {
    id: "a",
    email: "a@test",
    name: "A",
    role: "ACCESS_APPROVER",
    active: true,
    status: "ACTIVE",
  },
  activeContext: { type: "ACCESS_APPROVALS", role: "ACCESS_APPROVER" },
} satisfies Partial<AuthState>;

describe("MX-03 | auth y acceso | integraciones canónicas", () => {
  beforeEach(() => { vi.clearAllMocks(); router.pathname = "/resultados/panel"; router.params = new URLSearchParams(); window.sessionStorage.clear(); });
  it("[MX-03][AUT-LOG-P1-001][INTEGRACION] muestra login público sin contenido privado", () => { renderWithAuthStore(<LoginResultadosPage />); expect(screen.queryByText(/panel de control/i)).not.toBeInTheDocument(); expect(screen.getByRole("link", { name: /crear cuenta/i })).toHaveAttribute("href", "/resultados/registrarse"); });
  it("[MX-03][AUT-LOG-P0-003][INTEGRACION] redirige ACCESS_APPROVER a aprobaciones", async () => { const user = userEvent.setup(); router.params = new URLSearchParams("from=/aprobaciones"); router.login.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ accessToken: "token", role: "ACCESS_APPROVER", active: true, availableContexts: [{ type: "TENANT", tenantId: "tenant-1" }, { type: "ACCESS_APPROVALS", role: "ACCESS_APPROVER" }], defaultContext: { type: "TENANT", tenantId: "tenant-1" }, user: { id: "approver", email: "approver@test.com", name: "Approver", role: "ACCESS_APPROVER", active: true } }) }); const { container } = renderWithAuthStore(<LoginResultadosPage />); await user.type(container.querySelector('[data-cy="login-email"]') as HTMLInputElement, "approver@test.com"); await user.type(container.querySelector('[data-cy="login-password"]') as HTMLInputElement, "12345678"); await user.click(container.querySelector('[data-cy="login-submit"]') as HTMLButtonElement); await waitFor(() => expect(router.navigate).toHaveBeenCalledWith("/aprobaciones", { replace: true })); });
  it("[MX-03][AUT-LOG-P0-004][INTEGRACION] permite el contexto global en Superadmin", () => { renderWithAuthStore(<SuperadminGuard><p>global</p></SuperadminGuard>, superadmin); expect(screen.getByText("global")).toBeInTheDocument(); });
  it("[MX-03][AUT-PWD-P1-001][INTEGRACION] conserva resultados al solicitar recuperación", async () => { const user = userEvent.setup(); router.forgot.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ ok: true }) }); const { container } = renderWithAuthStore(<ForgotPasswordResultadosPage />); await user.type(container.querySelector('[data-cy="forgot-email"]') as HTMLInputElement, "user@test.com"); await user.click(container.querySelector('[data-cy="forgot-submit"]') as HTMLButtonElement); await waitFor(() => expect(router.forgot).toHaveBeenCalledWith({ email: "user@test.com" })); expect(screen.getByRole("link", { name: /volver a iniciar sesión/i })).toHaveAttribute("href", "/resultados/login"); });
  it("[MX-03][AUT-SES-P0-006][INTEGRACION] persiste motivo no sensible de AUTH_VERSION_MISMATCH", () => { persistAuthSessionEndReason(AUTH_VERSION_MISMATCH_CODE); expect(consumeAuthSessionEndReason()).toBe(AUTH_VERSION_MISMATCH_CODE); expect(window.sessionStorage.getItem("auth_session_end_reason")).toBeNull(); });
  it("[MX-03][AUT-SES-P1-007][INTEGRACION] consume el reason code una sola vez", () => { persistAuthSessionEndReason(AUTH_VERSION_MISMATCH_CODE); expect(consumeAuthSessionEndReason()).toBe(AUTH_VERSION_MISMATCH_CODE); expect(consumeAuthSessionEndReason()).toBeNull(); });
  it("[MX-03][AUT-GRD-P0-002][INTEGRACION] bloquea rol territorial en resultados", async () => { renderWithAuthStore(<ResultadosPrivateGuard><p>privado</p></ResultadosPrivateGuard>, territorialMayor); await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/resultados")); });
  it("[MX-03][AUT-ARE-P0-001][INTEGRACION] avisa tenant en resultados", async () => { router.pathname = "/resultados/control-personal"; renderWithAuthStore(<ResultadosPrivateGuard><p>privado</p></ResultadosPrivateGuard>, tenant); expect(await screen.findByText("Tu usuario no tiene acceso territorial aprobado.")).toBeInTheDocument(); });
  it("[MX-03][AUT-ARE-P0-002][INTEGRACION] avisa contexto no tenant en votación", async () => { renderWithAuthStore(<VotacionPrivateGuard><p>privado</p></VotacionPrivateGuard>, publicTerritorialUser); expect(await screen.findByText("Tu usuario no tiene acceso institucional aprobado.")).toBeInTheDocument(); });
  it("[MX-03][AUT-ARE-P0-003][INTEGRACION] bloquea approver en Superadmin", () => { renderWithAuthStore(<SuperadminGuard><p>privado</p></SuperadminGuard>, accessApprover); expect(screen.getByText("Acceso restringido")).toBeInTheDocument(); });
  it("[MX-03][AUT-SUP-P0-001][INTEGRACION] permite Superadmin global", () => { renderWithAuthStore(<SuperadminGuard><p>global permitido</p></SuperadminGuard>, superadmin); expect(screen.getByText("global permitido")).toBeInTheDocument(); });
  it("[MX-03][AUT-SUP-P0-002][INTEGRACION] bloquea rol no global", () => { renderWithAuthStore(<SuperadminGuard><p>privado</p></SuperadminGuard>, tenant); expect(screen.getByText("Acceso restringido")).toBeInTheDocument(); });
  it("[MX-03][AUT-UI-P1-001][INTEGRACION] conserva formulario ante 401 visible", async () => { const user = userEvent.setup(); router.login.mockReturnValue({ unwrap: vi.fn().mockRejectedValue({ data: { message: "Credenciales inválidas" } }) }); const { container } = renderWithAuthStore(<LoginVotacionPage />); const email = container.querySelector('[data-cy="login-email"]') as HTMLInputElement; const password = container.querySelector('[data-cy="login-password"]') as HTMLInputElement; await user.type(email, "admin@test.com"); await user.type(password, "12345678"); await user.click(container.querySelector('[data-cy="login-submit"]') as HTMLButtonElement); expect(await screen.findByText("Credenciales inválidas")).toBeInTheDocument(); expect(email).toHaveValue("admin@test.com"); });
});
