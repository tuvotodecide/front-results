import { screen, waitFor } from "@testing-library/react";
import VotacionPrivateGuard from "@/domains/votacion/guards/VotacionPrivateGuard";
import { renderWithAuthStore } from "../utils/renderWithStore";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("VotacionPrivateGuard", () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it("redirects anonymous users to canonical voting login", async () => {
    renderWithAuthStore(
      <VotacionPrivateGuard>
        <div>private voting</div>
      </VotacionPrivateGuard>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/votacion/login");
    });
  });

  it("redirects rejected users to rechazado", async () => {
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

  it("shows a domain access notice for authenticated non-tenant contexts", async () => {
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

  it("renders children for tenant contexts", () => {
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
});
