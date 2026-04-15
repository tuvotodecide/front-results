import { screen, waitFor } from "@testing-library/react";
import ResultadosPrivateGuard from "@/domains/resultados/guards/ResultadosPrivateGuard";
import { renderWithAuthStore } from "../utils/renderWithStore";

const replace = vi.fn();
const usePathname = vi.fn();
const useSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => usePathname(),
  useSearchParams: () => useSearchParams(),
}));

describe("ResultadosPrivateGuard", () => {
  beforeEach(() => {
    replace.mockReset();
    usePathname.mockReturnValue("/resultados/panel");
    useSearchParams.mockReturnValue(new URLSearchParams("view=full"));
  });

  it("redirects anonymous users to canonical login preserving from", async () => {
    renderWithAuthStore(
      <ResultadosPrivateGuard>
        <div>private content</div>
      </ResultadosPrivateGuard>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        "/resultados/login?from=%2Fresultados%2Fpanel%3Fview%3Dfull",
      );
    });
    expect(screen.queryByText("private content")).not.toBeInTheDocument();
  });

  it("redirects pending users to pendiente", async () => {
    renderWithAuthStore(
      <ResultadosPrivateGuard>
        <div>private content</div>
      </ResultadosPrivateGuard>,
      {
        token: "token",
        user: {
          id: "1",
          email: "user@test.com",
          name: "User",
          role: "SUPERADMIN",
          active: false,
          status: "PENDING",
        },
      },
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/resultados/pendiente");
    });
  });

  it("redirects restricted roles away from admin routes", async () => {
    renderWithAuthStore(
      <ResultadosPrivateGuard>
        <div>private content</div>
      </ResultadosPrivateGuard>,
      {
        token: "token",
        user: {
          id: "1",
          email: "mayor@test.com",
          name: "Mayor",
          role: "MAYOR",
          active: true,
          status: "ACTIVE",
        },
        activeContext: {
          type: "TERRITORIAL",
          role: "MAYOR",
        },
      },
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/resultados");
    });
  });

  it("shows a domain access notice for tenant contexts in resultados routes", async () => {
    usePathname.mockReturnValue("/resultados/control-personal");

    renderWithAuthStore(
      <ResultadosPrivateGuard>
        <div>private content</div>
      </ResultadosPrivateGuard>,
      {
        token: "token",
        user: {
          id: "1",
          email: "tenant@test.com",
          name: "Tenant",
          role: "TENANT_ADMIN",
          active: true,
          status: "ACTIVE",
        },
        activeContext: {
          type: "TENANT",
          role: "TENANT_ADMIN",
          tenantId: "tenant-1",
        },
      },
    );

    await waitFor(() => {
      expect(
        screen.getByText("Tu usuario no tiene acceso territorial aprobado."),
      ).toBeInTheDocument();
    });
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("Registrarme en resultados")).toBeInTheDocument();
  });

  it("shows pending approval notice without register CTA for registered territorial users", async () => {
    usePathname.mockReturnValue("/resultados");

    renderWithAuthStore(
      <ResultadosPrivateGuard>
        <div>private content</div>
      </ResultadosPrivateGuard>,
      {
        token: "token",
        user: {
          id: "1",
          email: "mayor@test.com",
          name: "Mayor",
          role: "MAYOR",
          active: true,
          status: "ACTIVE",
          territorialAccessStatus: "PENDING_APPROVAL",
        },
        activeContext: {
          type: "TENANT",
          role: "TENANT_ADMIN",
          tenantId: "tenant-1",
        },
      },
    );

    await waitFor(() => {
      expect(
        screen.getByText("Tu solicitud territorial está pendiente de aprobación."),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("Registrarme en resultados")).not.toBeInTheDocument();
    expect(screen.getByText("Volver al inicio")).toBeInTheDocument();
    expect(screen.getByText("Ir a votación")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders children when the role is allowed", () => {
    renderWithAuthStore(
      <ResultadosPrivateGuard>
        <div>private content</div>
      </ResultadosPrivateGuard>,
      {
        token: "token",
        user: {
          id: "1",
          email: "admin@test.com",
          name: "Admin",
          role: "SUPERADMIN",
          active: true,
          status: "ACTIVE",
        },
        activeContext: {
          type: "GLOBAL_ADMIN",
          role: "ADMIN",
        },
      },
    );

    expect(screen.getByText("private content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
