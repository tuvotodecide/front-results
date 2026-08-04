import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccessApprovalsGuard from "@/domains/access-approvals/guards/AccessApprovalsGuard";
import ResultadosPrivateGuard from "@/domains/resultados/guards/ResultadosPrivateGuard";
import { useMyContract } from "@/hooks/useMyContract";
import { renderWithAuthStore } from "../utils/renderWithStore";

const accessHarness = vi.hoisted(() => ({
  elections: vi.fn(),
  activeContract: vi.fn(),
  replace: vi.fn(),
  pathname: vi.fn(),
}));

vi.mock("@/store/contracts/contractsEndpoints", () => ({
  useGetMyElectionsQuery: (...args: unknown[]) => accessHarness.elections(...args),
}));
vi.mock("@/store/reports/clientReportEndpoints", () => ({
  useGetMyActiveContractQuery: (...args: unknown[]) => accessHarness.activeContract(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: accessHarness.replace }),
  usePathname: () => accessHarness.pathname(),
  useSearchParams: () => new URLSearchParams(),
}));

const ContractProbe = () => {
  const contract = useMyContract();
  return <output>{JSON.stringify(contract)}</output>;
};

const activeContract = (role: "GOVERNOR" | "MAYOR") => ({
  id: `contract-${role.toLowerCase()}`,
  electionId: "election-2026",
  role,
  active: true,
  territory:
    role === "GOVERNOR"
      ? { type: "department", departmentId: "dep-lp", departmentName: "La Paz" }
      : { type: "municipality", municipalityId: "mun-lp", municipalityName: "La Paz" },
});

describe("MX-10 | alcance territorial y acceso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accessHarness.pathname.mockReturnValue("/resultados/control-personal");
    accessHarness.elections.mockReturnValue({ data: [], isLoading: false, isError: false });
    accessHarness.activeContract.mockReturnValue({ data: { contract: null }, isLoading: false, isError: false });
  });

  it("[MX-10][PER-GOV-P0-001][UNITARIA] resuelve el contrato activo de Gobernador con su departamento forzado", () => {
    const contract = activeContract("GOVERNOR");
    accessHarness.elections.mockReturnValue({
      data: [{ electionId: "election-2026", electionName: "Elección 2026", isActive: true, contracts: [contract] }],
      isLoading: false,
      isError: false,
    });
    accessHarness.activeContract.mockReturnValue({ data: { contract }, isLoading: false, isError: false });
    renderWithAuthStore(<ContractProbe />, {
      token: "token", user: { id: "gov", email: "gov@test", name: "Gobernador", role: "GOVERNOR", active: true, status: "ACTIVE" },
    });
    const value = screen.getByRole("status").textContent ?? "";
    expect(value).toContain('"status":"has_active"');
    expect(value).toContain('"departmentId":"dep-lp"');
    expect(value).not.toContain('"municipalityId"');
  });

  it("[MX-10][PER-MAY-P0-002][UNITARIA] resuelve el contrato activo de Alcalde con su municipio forzado", () => {
    const contract = activeContract("MAYOR");
    accessHarness.elections.mockReturnValue({
      data: [{ electionId: "election-2026", electionName: "Elección 2026", isActive: true, contracts: [contract] }],
      isLoading: false,
      isError: false,
    });
    accessHarness.activeContract.mockReturnValue({ data: { contract }, isLoading: false, isError: false });
    renderWithAuthStore(<ContractProbe />, {
      token: "token", user: { id: "mayor", email: "mayor@test", name: "Alcalde", role: "MAYOR", active: true, status: "ACTIVE" },
    });
    const value = screen.getByRole("status").textContent ?? "";
    expect(value).toContain('"status":"has_active"');
    expect(value).toContain('"municipalityId":"mun-lp"');
    expect(value).not.toContain('"departmentId"');
  });

  it("[MX-10][PER-APP-P0-004][UNITARIA] bloquea la interfaz de aprobaciones a un rol que no tiene contexto autorizado", async () => {
    renderWithAuthStore(<AccessApprovalsGuard><div>datos de aprobación</div></AccessApprovalsGuard>, {
      token: "token", user: { id: "mayor", email: "mayor@test", name: "Alcalde", role: "MAYOR", active: true, status: "ACTIVE" },
      activeContext: { type: "TERRITORIAL", role: "MAYOR" },
    });
    expect(await screen.findByText(/no tiene acceso/i)).toBeInTheDocument();
    expect(screen.queryByText("datos de aprobación")).not.toBeInTheDocument();
  });

  it("[MX-10][SEC-TEN-P0-001][UNITARIA] redirige una ruta territorial privada sin sesión y no renderiza sus datos", async () => {
    renderWithAuthStore(<ResultadosPrivateGuard><div>reporte territorial</div></ResultadosPrivateGuard>);
    await waitFor(() => expect(accessHarness.replace).toHaveBeenCalledWith("/resultados/login?from=%2Fresultados%2Fcontrol-personal"));
    expect(screen.queryByText("reporte territorial")).not.toBeInTheDocument();
  });
});
