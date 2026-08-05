import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PersonalParticipationPage from "@/domains/resultados/screens/PersonalParticipationPage";

const reportHarness = vi.hoisted(() => ({
  navigate: vi.fn(),
  myContract: vi.fn(),
  electionId: vi.fn(),
  electionConfig: vi.fn(),
  getContract: vi.fn(),
  getSummary: vi.fn(),
  getActivity: vi.fn(),
}));

vi.mock("@/domains/resultados/navigation/compat", () => ({
  Link: ({ children, to }: { children: string; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => reportHarness.navigate,
}));
vi.mock("@/hooks/useMyContract", () => ({
  useMyContract: () => reportHarness.myContract(),
}));
vi.mock("@/domains/resultados/hooks/useElectionId", () => ({
  default: () => reportHarness.electionId(),
}));
vi.mock("@/domains/resultados/hooks/useElectionConfig", () => ({
  default: () => reportHarness.electionConfig(),
}));
vi.mock("@/store/reports/clientReportEndpoints", () => ({
  useGetMyContractQuery: (...args: unknown[]) => reportHarness.getContract(...args),
  useGetExecutiveSummaryQuery: (...args: unknown[]) => reportHarness.getSummary(...args),
  useGetDelegateActivityQuery: (...args: unknown[]) => reportHarness.getActivity(...args),
}));

const activeContract = {
  id: "contract-lp",
  electionId: "election-2026",
  role: "MAYOR" as const,
  active: true,
  startDate: "2026-01-01T00:00:00.000Z",
  endDate: "2026-12-31T23:59:59.000Z",
  territory: { type: "municipality" as const, municipalityId: "mun-lp", municipalityName: "La Paz" },
};

const query = (data: unknown, extras: Record<string, unknown> = {}) => ({
  data,
  isLoading: false,
  isError: false,
  ...extras,
});

describe("MX-10 | contratos y reporte operativo territorial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reportHarness.electionId.mockReturnValue("election-2026");
    reportHarness.electionConfig.mockReturnValue({ election: { type: "mayor" } });
    reportHarness.myContract.mockReturnValue({
      status: "has_active", contract: activeContract, isLoading: false, isError: false,
    });
    reportHarness.getContract.mockReturnValue(query({ hasContract: true }));
    reportHarness.getSummary.mockReturnValue(query({
      summary: { totalDelegatesAuthorized: 3, activeDelegates: 2, participationRate: "66.67%" },
    }));
    reportHarness.getActivity.mockImplementation((params: { groupBy?: string }) =>
      query({ data: params.groupBy === "table"
        ? [{ tableCode: "LP-001-15", location: "Recinto Central", attestationDetails: [{ dni: "100", delegateName: "Ana Autorizada", ballotId: "ballot-1" }] }]
        : [{ dni: "100", name: "Ana Autorizada", totalAttestations: 1 }, { dni: "200", name: "Beto Sin Actividad", totalAttestations: 0 }] }),
    );
  });

  afterEach(() => cleanup());

  it("[MX-10][CON-LST-P1-004][INTEGRACION] muestra el contrato activo y el territorio que habilita el reporte", () => {
    render(<PersonalParticipationPage />);
    expect(screen.getByRole("heading", { name: "Participación de Personal" })).toBeInTheDocument();
    expect(screen.getByText("Alcaldía de La Paz")).toBeInTheDocument();
    expect(reportHarness.getContract).toHaveBeenCalledWith({ electionId: "election-2026" }, { skip: false });
  });

  it("[MX-10][DEL-LST-P1-005][INTEGRACION] muestra únicamente la actividad de delegados devuelta para el contrato actual", async () => {
    const user = userEvent.setup();
    render(<PersonalParticipationPage />);
    await user.click(screen.getByRole("button", { name: /Ver reporte por mesa/i }));
    expect(screen.getByText("Ana Autorizada")).toBeInTheDocument();
    expect(screen.getByText("Beto Sin Actividad")).toBeInTheDocument();
    expect(screen.queryByText("Delegado de otro contrato")).not.toBeInTheDocument();
  });

  it("[MX-10][PER-NOC-P0-003][INTEGRACION] bloquea el reporte cuando el usuario territorial no tiene contratos", () => {
    reportHarness.myContract.mockReturnValue({ status: "no_contracts", contract: null, isLoading: false, isError: false });
    render(<PersonalParticipationPage />);
    expect(screen.getByRole("heading", { name: "Sin contratos asignados" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Participación de Personal" })).not.toBeInTheDocument();
    expect(reportHarness.getSummary).toHaveBeenCalledWith(expect.anything(), { skip: true });
  });

  it("[MX-10][PER-REP-P1-005][INTEGRACION] presenta resumen, delegados con y sin actividad y contrato inválido", async () => {
    const user = userEvent.setup();
    render(<PersonalParticipationPage />);
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/66.67%/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Ver reporte por mesa/i }));
    expect(screen.getByRole("heading", { name: /Delegados que participaron/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Delegados que NO participaron/i })).toBeInTheDocument();
    cleanup();
    reportHarness.getContract.mockReturnValue(query({ hasContract: false }));
    render(<PersonalParticipationPage />);
    expect(screen.getByRole("heading", { name: "Contrato no encontrado" })).toBeInTheDocument();
  });

  it("[MX-10][SEC-DEL-P0-003][INTEGRACION] consulta la actividad con la elección contractual y no expone datos ajenos en la vista", async () => {
    const user = userEvent.setup();
    render(<PersonalParticipationPage />);
    expect(reportHarness.getActivity).toHaveBeenCalledWith({ electionId: "election-2026", groupBy: "table" }, { skip: false });
    await user.click(screen.getByRole("button", { name: /Ver reporte por mesa/i }));
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.queryByText("99999999")).not.toBeInTheDocument();
  });

  it("[MX-10][TRA-P1-001][INTEGRACION] conserva la consulta contractual fechada y refresca la actividad operativa visible", async () => {
    const user = userEvent.setup();
    render(<PersonalParticipationPage />);

    expect(reportHarness.getContract).toHaveBeenCalledWith(
      { electionId: "election-2026" },
      { skip: false },
    );
    await user.click(screen.getByRole("button", { name: /Ver reporte por mesa/i }));
    expect(screen.getByText("Ana Autorizada")).toBeInTheDocument();
    expect(reportHarness.getActivity).toHaveBeenCalledWith(
      { electionId: "election-2026", groupBy: "table" },
      { skip: false },
    );
  });
});
