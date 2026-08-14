import { act, screen, waitFor } from "@testing-library/react";
import VotacionPrivateGuard from "@/domains/votacion/guards/VotacionPrivateGuard";
import { setActiveContext } from "@/store/auth/authSlice";
import { renderWithAuthStore } from "../utils/renderWithStore";

const replace = vi.fn();
let pathname = "/votacion";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname,
}));

describe("MX-03 | Autenticación, sesiones, roles y permisos | Frontend Admin | Votación guard", () => {
  beforeEach(() => {
    replace.mockReset();
    pathname = "/votacion";
  });

  it("AUT-GRD-P0-001 | redirige anónimos al login canónico de votación", async () => {
    renderWithAuthStore(
      <VotacionPrivateGuard>
        <div>private voting</div>
      </VotacionPrivateGuard>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/votacion/login");
    });
  });

  it("AUT-STA-P0-002 | redirige usuarios rechazados a rechazado", async () => {
    renderWithAuthStore(
      <VotacionPrivateGuard>
        <div>private voting</div>
      </VotacionPrivateGuard>,
      {
        token: "token",
        user: {
          id: "1",
          email: "user@test.com",
          name: "User",
          role: "TENANT_ADMIN",
          active: false,
          status: "REJECTED",
        },
      },
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/votacion/rechazado");
    });
  });

  it("AUT-ARE-P0-002 | muestra aviso de dominio para autenticados sin contexto tenant", async () => {
    renderWithAuthStore(
      <VotacionPrivateGuard>
        <div>private voting</div>
      </VotacionPrivateGuard>,
      {
        token: "token",
        user: {
          id: "1",
          email: "public@test.com",
          name: "Public",
          role: "publico",
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
      expect(
        screen.getByText("Tu usuario no tiene acceso institucional aprobado."),
      ).toBeInTheDocument();
    });
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("Registrarme en votación")).toBeInTheDocument();
  });

  it("AUT-GRD-P0-002 | renderiza contenido para contextos tenant permitidos", () => {
    renderWithAuthStore(
      <VotacionPrivateGuard>
        <div>private voting</div>
      </VotacionPrivateGuard>,
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

    expect(screen.getByText("private voting")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("AUT-ARE-P0-002 | mantiene tenant admin sin wallet en la ruta de votación solicitada", () => {
    renderWithAuthStore(
      <VotacionPrivateGuard>
        <div>private voting</div>
      </VotacionPrivateGuard>,
      {
        token: "token",
        user: {
          id: "1",
          email: "tenant@test.com",
          name: "Tenant",
          role: "TENANT_ADMIN",
          active: true,
          status: "ACTIVE",
          tenantId: "tenant-1",
        },
        activeContext: {
          type: "TENANT",
          role: "TENANT_ADMIN",
          tenantId: "tenant-1",
          requiresWalletUpdate: true,
          walletStatus: "MISSING",
          hasWallet: false,
        },
      },
    );

    expect(screen.getByText("private voting")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("AUT-ARE-P0-002 | permite la cuenta institucional al PRIMARY vigente aunque no tenga wallet", () => {
    pathname = "/votacion/cuenta-institucional";

    renderWithAuthStore(
      <VotacionPrivateGuard>
        <div>private voting</div>
      </VotacionPrivateGuard>,
      {
        token: "token",
        user: {
          id: "1",
          email: "tenant@test.com",
          name: "Tenant",
          role: "TENANT_ADMIN",
          active: true,
          status: "ACTIVE",
          tenantId: "tenant-1",
        },
        activeContext: {
          type: "TENANT",
          role: "PRIMARY",
          tenantId: "tenant-1",
          requiresWalletUpdate: true,
          walletStatus: "MISSING",
          hasWallet: false,
        },
        availableContexts: [
          {
            type: "TENANT",
            role: "PRIMARY",
            tenantId: "tenant-1",
            requiresWalletUpdate: true,
            walletStatus: "MISSING",
            hasWallet: false,
          },
        ],
      },
    );

    expect(screen.getByText("private voting")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("AUT-ARE-P0-003 | bloquea al SECONDARY vigente por URL directa sin renderizar la vista", async () => {
    pathname = "/votacion/cuenta-institucional";

    renderWithAuthStore(
      <VotacionPrivateGuard>
        <div>cuenta sensible</div>
      </VotacionPrivateGuard>,
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
          role: "SECONDARY",
          tenantId: "tenant-1",
        },
        availableContexts: [
          { type: "TENANT", role: "SECONDARY", tenantId: "tenant-1" },
        ],
      },
    );

    expect(screen.queryByText("cuenta sensible")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/votacion/elecciones");
    });
  });

  it("AUT-ARE-P0-004 | usa el rol vigente del tenant y bloquea a un ex-PRIMARY", async () => {
    pathname = "/votacion/cuenta-institucional";

    renderWithAuthStore(
      <VotacionPrivateGuard>
        <div>cuenta sensible</div>
      </VotacionPrivateGuard>,
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
          role: "PRIMARY",
          tenantId: "tenant-1",
        },
        availableContexts: [
          { type: "TENANT", role: "SECONDARY", tenantId: "tenant-1" },
        ],
      },
    );

    expect(screen.queryByText("cuenta sensible")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/votacion/elecciones");
    });
  });

  it("AUT-ARE-P0-005 | recalcula el permiso al cambiar de tenant", async () => {
    pathname = "/votacion/cuenta-institucional";
    const contexts = [
      { type: "TENANT" as const, role: "PRIMARY", tenantId: "tenant-a" },
      { type: "TENANT" as const, role: "SECONDARY", tenantId: "tenant-b" },
    ];
    const { store } = renderWithAuthStore(
      <VotacionPrivateGuard>
        <div>cuenta sensible</div>
      </VotacionPrivateGuard>,
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
        activeContext: contexts[0],
        availableContexts: contexts,
      },
    );

    expect(screen.getByText("cuenta sensible")).toBeInTheDocument();
    act(() => {
      store.dispatch(setActiveContext(contexts[1]));
    });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/votacion/elecciones");
    });
    expect(screen.queryByText("cuenta sensible")).not.toBeInTheDocument();
  });
});
