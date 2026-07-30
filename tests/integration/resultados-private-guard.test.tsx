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

describe("MX-03 | Autenticación, sesiones, roles y permisos | Frontend Admin | Resultados guard", () => {
  beforeEach(() => {
    replace.mockReset();
    usePathname.mockReturnValue("/resultados/panel");
    useSearchParams.mockReturnValue(new URLSearchParams("view=full"));
  });

  it("AUT-GRD-P0-001 | redirige anónimos al login canónico conservando from", async () => {
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

  it("AUT-STA-P0-002 | redirige usuarios pendientes a la página pendiente", async () => {
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

  it("AUT-GRD-P0-002 | redirige roles restringidos fuera de rutas admin", async () => {
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

  it("AUT-ARE-P0-001 | muestra aviso de dominio para contextos tenant en resultados", async () => {
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

  it("AUT-STA-P0-002 | muestra aviso pendiente sin CTA de registro para territorial registrado", async () => {
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

  it("AUT-GRD-P0-002 | renderiza contenido cuando el rol está permitido", () => {
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
