import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginVotacionPage from "@/domains/auth-votacion/screens/LoginVotacionPage";
import { renderWithAuthStore } from "../utils/renderWithStore";

const router = {
  navigate: vi.fn(),
  params: new URLSearchParams(),
  login: vi.fn(),
};

vi.mock("@/domains/auth-votacion/navigation/compat", () => ({
  Link: ({ children, href, to }: { children: ReactNode; href?: string; to?: string }) => (
    <a href={href ?? to}>{children}</a>
  ),
  useNavigate: () => router.navigate,
  useSearchParams: () => [router.params],
}));

vi.mock("@/store/auth/authEndpoints", () => ({
  useLoginUserMutation: () => [router.login, { isLoading: false }],
}));

describe("MX-02 | Gestión de instituciones, administradores y wallets | acceso suspendido", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    router.params = new URLSearchParams();
  });

  it("[MX-02][D-DIS-008][INTEGRACION] bloquea el acceso institucional de una relación suspendida desde el flujo real de login", async () => {
    const user = userEvent.setup();
    router.login.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        accessToken: "suspended-token",
        role: "TENANT_ADMIN",
        active: true,
        availableContexts: [],
        accessStatus: {
          tenant: {
            hasApprovedAccess: false,
            latestStatus: "SUSPENDED",
            canRequest: false,
            shouldSelectTenantContext: false,
            message: "",
            items: [{ status: "SUSPENDED", reason: "Acceso suspendido." }],
          },
          territorial: {
            hasApprovedAccess: false,
            status: "NONE",
            canRequest: false,
            message: "",
          },
        },
        user: {
          id: "suspended-admin",
          email: "suspended@tenant.test",
          name: "Administradora suspendida",
          role: "TENANT_ADMIN",
          active: true,
        },
      }),
    });

    const { container } = renderWithAuthStore(<LoginVotacionPage />);
    await user.type(
      container.querySelector('[data-cy="login-email"]') as HTMLInputElement,
      "suspended@tenant.test",
    );
    await user.type(
      container.querySelector('[data-cy="login-password"]') as HTMLInputElement,
      "12345678",
    );
    await user.click(
      container.querySelector('[data-cy="login-submit"]') as HTMLButtonElement,
    );

    expect(
      await screen.findByRole("heading", { name: "Acceso suspendido." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Acceso requerido")).toBeInTheDocument();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(container.querySelector('[data-cy="login-email"]')).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: /Añadir administrador|Transferir rol principal|Suspender|Reactivar/i,
      }),
    ).not.toBeInTheDocument();
  });
});
