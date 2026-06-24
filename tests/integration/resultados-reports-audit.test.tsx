import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ResultadosGeneralesPage from "@/domains/resultados/screens/ResultadosGeneralesPage";
import AuditAndMatchPage from "@/domains/resultados/screens/AuditAndMatchPage";
import PersonalParticipationPage from "@/domains/resultados/screens/PersonalParticipationPage";
import {
  auditSummary,
  countedTables,
  delegateActivity,
  delegateTableActivity,
  executiveSummary,
  mayorContract,
  resultadosSummary,
} from "../fixtures/admin/resultadosReports";

const testHarness = vi.hoisted(() => {
  const state = {
    auth: {
      token: "token",
      user: {
        id: "mayor-1",
        role: "MAYOR",
        departmentId: "dep-lp",
        municipalityId: "mun-lp",
      },
    },
    election: {
      selectedElectionId: "election-2026",
    },
    results: {
      filters: {
        department: "La Paz",
        province: "",
        municipality: "La Paz",
        electoralLocation: "",
        electoralSeat: "",
      },
      filterIds: {
        departmentId: "dep-lp",
        provinceId: "",
        municipalityId: "mun-lp",
        electoralLocationId: "",
        electoralSeatId: "",
      },
    },
  };

  return {
    state,
    searchParams: new URLSearchParams("electionType=mayor"),
    navigate: vi.fn(),
    getResultsByLocation: vi.fn(),
    getLiveResultsByLocation: vi.fn(),
    useCountedBallots: vi.fn(),
    useMyContract: vi.fn(),
    useElectionConfig: vi.fn(),
    useElectionId: vi.fn(),
    usePublicResultsScope: vi.fn(),
    useGetAuditoriaTSEQuery: vi.fn(),
    useGetConfigurationStatusQuery: vi.fn(),
    useGetMyContractQuery: vi.fn(),
    useGetExecutiveSummaryQuery: vi.fn(),
    useGetDelegateActivityQuery: vi.fn(),
  };
});

vi.mock("react-redux", () => ({
  useSelector: (selector: any) => selector(testHarness.state),
}));

vi.mock("@/domains/resultados/navigation/compat", () => ({
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => testHarness.navigate,
  useSearchParams: () => [testHarness.searchParams, vi.fn()] as const,
  useLocation: () => ({
    pathname: "/resultados",
    search: `?${testHarness.searchParams.toString()}`,
    hash: "",
    state: null,
    key: "resultados-test",
  }),
}));

vi.mock("@/domains/resultados/hooks/useElectionId", () => ({
  default: () => testHarness.useElectionId(),
}));

vi.mock("@/domains/resultados/hooks/useElectionConfig", () => ({
  default: () => testHarness.useElectionConfig(),
}));

vi.mock("@/domains/resultados/hooks/usePublicResultsScope", () => ({
  usePublicResultsScope: (...args: any[]) => testHarness.usePublicResultsScope(...args),
}));

vi.mock("@/hooks/useMyContract", () => ({
  useMyContract: () => testHarness.useMyContract(),
}));

vi.mock("@/hooks/useAutoRefreshTick", () => ({
  default: () => 0,
}));

vi.mock("@/hooks/useCountedBallots", () => ({
  useCountedBallots: (...args: any[]) => testHarness.useCountedBallots(...args),
}));

vi.mock("@/store/departments/departmentsEndpoints", () => ({
  useGetDepartmentsQuery: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock("@/store/resultados/resultadosEndpoints", () => ({
  useLazyGetResultsByLocationQuery: () => [testHarness.getResultsByLocation],
  useLazyGetLiveResultsByLocationQuery: () => [testHarness.getLiveResultsByLocation],
}));

vi.mock("@/store/personal/personalEndpoints", () => ({
  useGetAuditoriaTSEQuery: (...args: any[]) => testHarness.useGetAuditoriaTSEQuery(...args),
}));

vi.mock("@/store/configurations/configurationsEndpoints", () => ({
  useGetConfigurationStatusQuery: (...args: any[]) =>
    testHarness.useGetConfigurationStatusQuery(...args),
}));

vi.mock("@/store/reports/clientReportEndpoints", () => ({
  useGetMyContractQuery: (...args: any[]) => testHarness.useGetMyContractQuery(...args),
  useGetExecutiveSummaryQuery: (...args: any[]) =>
    testHarness.useGetExecutiveSummaryQuery(...args),
  useGetDelegateActivityQuery: (...args: any[]) =>
    testHarness.useGetDelegateActivityQuery(...args),
}));

vi.mock("@/legacy-pages/Resultados/Graphs", () => ({
  default: ({ data }: { data: Array<{ name: string; value: number }> }) => (
    <div data-testid="results-graph">
      {data.map((item) => (
        <span key={item.name}>
          {item.name}: {item.value}
        </span>
      ))}
    </div>
  ),
}));

vi.mock("@/legacy-pages/Resultados/StatisticsBars", () => ({
  default: ({ voteData }: { voteData: Array<{ name: string; value: number }> }) => (
    <div data-testid="participation-bars">
      {voteData.map((item) => (
        <span key={item.name}>
          {item.name}: {item.value}
        </span>
      ))}
    </div>
  ),
}));

vi.mock("@/domains/resultados/components/Breadcrumb2", () => ({
  default: () => <nav>Inicio / Resultados</nav>,
}));

const resolvedPromise = (value: any) => ({
  unwrap: vi.fn().mockResolvedValue(value),
});

describe("resultados, reportes y auditoria", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    testHarness.state.auth.token = "token";
    testHarness.state.auth.user = {
      id: "mayor-1",
      role: "MAYOR",
      departmentId: "dep-lp",
      municipalityId: "mun-lp",
    };
    testHarness.state.results.filterIds = {
      departmentId: "dep-lp",
      provinceId: "",
      municipalityId: "mun-lp",
      electoralLocationId: "",
      electoralSeatId: "",
    };
    testHarness.state.results.filters = {
      department: "La Paz",
      province: "",
      municipality: "La Paz",
      electoralLocation: "",
      electoralSeat: "",
    };
    testHarness.searchParams = new URLSearchParams("electionType=mayor");
    testHarness.useElectionId.mockReturnValue("election-2026");
    testHarness.useElectionConfig.mockReturnValue({
      election: {
        id: "election-2026",
        type: "mayor",
        isVotingPeriod: false,
        isResultsPeriod: true,
        isActive: true,
      },
      elections: [],
      hasActiveConfig: true,
      isVotingPeriod: false,
      isResultsPeriod: true,
      isAutoRefreshWindow: false,
      isLoading: false,
    });
    testHarness.usePublicResultsScope.mockReturnValue({
      isPublic: false,
      isLoading: false,
      hasContracts: false,
      isScopeValid: true,
      reason: null,
    });
    testHarness.useMyContract.mockReturnValue({
      status: "has_active",
      hasContract: true,
      contract: mayorContract,
      elections: [],
      isLoading: false,
      isError: false,
      isClient: true,
    });
    testHarness.useCountedBallots.mockReturnValue({
      tables: countedTables,
      ballots: [],
      total: 1,
      page: 1,
      totalPages: 1,
      isLoading: false,
      isError: false,
      mode: "final",
    });
    testHarness.getResultsByLocation.mockReturnValue(resolvedPromise(resultadosSummary));
    testHarness.getLiveResultsByLocation.mockReturnValue(resolvedPromise(resultadosSummary));
    testHarness.useGetConfigurationStatusQuery.mockReturnValue({
      data: { hasActiveConfig: true },
      isLoading: false,
    });
    testHarness.useGetAuditoriaTSEQuery.mockReturnValue({
      data: auditSummary,
      isLoading: false,
    });
    testHarness.useGetMyContractQuery.mockReturnValue({
      data: { hasContract: true, contract: mayorContract },
      isLoading: false,
      isError: false,
    });
    testHarness.useGetExecutiveSummaryQuery.mockReturnValue({
      data: executiveSummary,
      isLoading: false,
      isError: false,
    });
    testHarness.useGetDelegateActivityQuery.mockImplementation((params: any) => {
      if (params?.groupBy === "table") {
        return { data: delegateTableActivity, isLoading: false, isError: false };
      }
      return { data: delegateActivity, isLoading: false, isError: false };
    });
  });

  it("applies territorial filters and renders results tables with data", async () => {
    vi.useFakeTimers();

    render(<ResultadosGeneralesPage />);

    expect(screen.getByText("Resultados Generales")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(450);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(testHarness.getResultsByLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        electionId: "election-2026",
        electionType: "municipal",
        department: "dep-lp",
        municipality: "mun-lp",
      }),
      true,
    );
    expect(screen.getAllByText("Partido Verde: 120")).toHaveLength(2);
    expect(screen.getByText("Válidos: 190")).toBeInTheDocument();
    expect(screen.getByText("Mesa 1")).toBeInTheDocument();
  });

  it("shows an empty public-scope message when the selected territory is not allowed", async () => {
    vi.useFakeTimers();
    testHarness.state.auth.token = null as any;
    testHarness.state.auth.user = null as any;
    testHarness.usePublicResultsScope.mockReturnValue({
      isPublic: true,
      isLoading: false,
      hasContracts: true,
      isScopeValid: false,
      reason: "No hay resultados públicos disponibles para este municipio.",
    });

    render(<ResultadosGeneralesPage />);

    await act(async () => {
      vi.advanceTimersByTime(450);
      await Promise.resolve();
    });

    expect(testHarness.getResultsByLocation).not.toHaveBeenCalled();
    expect(
      screen.getByText("No hay resultados públicos disponibles para este municipio."),
    ).toBeInTheDocument();
  });

  it("blocks restricted users without territorial scope before querying results", async () => {
    vi.useFakeTimers();
    testHarness.state.auth.user = {
      id: "mayor-2",
      role: "MAYOR",
      departmentId: "",
      municipalityId: "",
    };
    testHarness.state.results.filterIds = {
      departmentId: "",
      provinceId: "",
      municipalityId: "",
      electoralLocationId: "",
      electoralSeatId: "",
    };
    testHarness.useMyContract.mockReturnValue({
      status: "has_active",
      hasContract: false,
      contract: null,
      elections: [],
      isLoading: false,
      isError: false,
      isClient: true,
    });

    render(<ResultadosGeneralesPage />);

    await act(async () => {
      vi.advanceTimersByTime(450);
      await Promise.resolve();
    });

    expect(testHarness.getResultsByLocation).not.toHaveBeenCalled();
    expect(screen.getAllByText("Sin datos").length).toBeGreaterThan(0);
  });

  it("renders audit summary and detailed audit rows", async () => {
    const user = userEvent.setup();

    render(<AuditAndMatchPage />);

    expect(screen.getByText("Auditoría vs Resultados TSE")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(3);

    await user.click(
      screen.getByRole("button", {
        name: /ver reporte detallado por hoja de trabajo/i,
      }),
    );

    expect(screen.getByText("Unidad Educativa Central")).toBeInTheDocument();
    expect(screen.getByText("Ana Auditora")).toBeInTheDocument();
    expect(screen.getByText("No coincide")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver hoja de trabajo/i })).toHaveAttribute(
      "href",
      "/resultados/imagen/ballot-1",
    );
  });

  it("renders audit empty and loading states", () => {
    testHarness.useGetAuditoriaTSEQuery.mockReturnValue({
      data: { total: 0, observados: 0, sinObservaciones: 0, pendientes: 0, details: [] },
      isLoading: false,
    });
    const { rerender } = render(<AuditAndMatchPage />);

    expect(screen.getByText("Auditoría vs Resultados TSE")).toBeInTheDocument();
    expect(screen.getByText("Ver reporte detallado por hoja de trabajo")).toBeInTheDocument();

    testHarness.useGetAuditoriaTSEQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });
    rerender(<AuditAndMatchPage />);

    expect(screen.getByText("Cargando auditoría vs TSE...")).toBeInTheDocument();
  });

  it("renders participation reports and delegate activity with territorial context", async () => {
    const user = userEvent.setup();

    render(<PersonalParticipationPage />);

    expect(screen.getByText("Participación de Personal")).toBeInTheDocument();
    expect(screen.getByText(/Alcaldía de La Paz/i)).toBeInTheDocument();
    expect(screen.getByText("66.67%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ver reporte por mesa/i }));

    expect(screen.getByText("Delegados que participaron (1 registros)")).toBeInTheDocument();
    expect(screen.getByText("Ana Delegada")).toBeInTheDocument();
    expect(screen.getByText("Delegados que NO participaron (1)")).toBeInTheDocument();
    expect(screen.getByText("Luis Sin Voto")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver hoja de trabajo/i })).toHaveAttribute(
      "href",
      "/resultados/mesa/LP-001-01?electionId=election-2026&electionType=mayor",
    );
  });

  it("renders report access and API error states", () => {
    testHarness.useMyContract.mockReturnValue({
      status: "not_client",
      hasContract: false,
      contract: null,
      elections: [],
      isLoading: false,
      isError: false,
      isClient: false,
    });
    const { rerender } = render(<PersonalParticipationPage />);

    expect(screen.getByText("Acceso restringido")).toBeInTheDocument();

    testHarness.useMyContract.mockReturnValue({
      status: "has_active",
      hasContract: true,
      contract: mayorContract,
      elections: [],
      isLoading: false,
      isError: false,
      isClient: true,
    });
    testHarness.useGetMyContractQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    rerender(<PersonalParticipationPage />);

    expect(screen.getByText("Error al cargar el reporte")).toBeInTheDocument();
  });
});
