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
      },
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/resultados");
    });
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
      },
    );

    expect(screen.getByText("private content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
