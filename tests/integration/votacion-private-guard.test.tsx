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

  it("redirects authenticated non-tenant roles to root", async () => {
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
      },
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/");
    });
  });

  it("renders children for tenant admins", () => {
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
      },
    );

    expect(screen.getByText("private voting")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
