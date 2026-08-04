import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResultadosPrivateGuard from "@/domains/resultados/guards/ResultadosPrivateGuard";
import { renderWithAuthStore } from "../utils/renderWithStore";

const navigation = vi.hoisted(() => ({ replace: vi.fn(), pathname: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigation.replace }),
  usePathname: () => navigation.pathname(),
  useSearchParams: () => new URLSearchParams(),
}));

describe("MX-10 | revocación territorial", () => {
  beforeEach(() => { vi.clearAllMocks(); navigation.pathname.mockReturnValue("/resultados/control-personal"); });
  it("[MX-10][SEC-BLO-P0-004][INTEGRACION] bloquea el contenido privado cuando la sesión refrescada comunica acceso territorial revocado", async () => {
    renderWithAuthStore(<ResultadosPrivateGuard><div>datos territoriales</div></ResultadosPrivateGuard>, {
      token: "token",
      user: { id: "mayor", email: "mayor@test", name: "Alcalde", role: "MAYOR", active: true, status: "ACTIVE", territorialAccessStatus: "REVOKED" },
      activeContext: { type: "TENANT", role: "TENANT_ADMIN", tenantId: "tenant-1" },
    });
    expect(await screen.findByRole("heading", { name: "El acceso territorial fue revocado." })).toBeInTheDocument();
    expect(screen.queryByText("datos territoriales")).not.toBeInTheDocument();
  });
});
