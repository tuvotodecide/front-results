import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import AuditAndMatchPage from "@/domains/resultados/screens/AuditAndMatchPage";
import PersonalParticipationPage from "@/domains/resultados/screens/PersonalParticipationPage";
import ResultadosGeneralesPage from "@/domains/resultados/screens/ResultadosGeneralesPage";
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

const renderResultsSummary = async () => {
  vi.useFakeTimers();
  render(<ResultadosGeneralesPage />);

  await act(async () => {
    vi.advanceTimersByTime(450);
    await Promise.resolve();
    await Promise.resolve();
  });
};

const configureMayorWithoutTerritorialScope = () => {
  testHarness.state.auth.token = "session-without-territory";
  testHarness.state.auth.user = {
    id: "mayor-without-territory",
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
  testHarness.state.results.filters = {
    department: "",
    province: "",
    municipality: "",
    electoralLocation: "",
    electoralSeat: "",
  };
  testHarness.useMyContract.mockReturnValue({
    status: "no_active_contract",
    hasContract: false,
    contract: null,
    elections: [],
    isLoading: false,
    isError: false,
    isClient: true,
  });
  testHarness.useCountedBallots.mockReturnValue({
    tables: [],
    ballots: [],
    total: 0,
    page: 1,
    totalPages: 0,
    isLoading: false,
    isError: false,
    mode: "final",
  });
};

describe("MX-12 | Resultados administrativos y reportes | Frontend Admin", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

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

  it("[MX-12][RES-ACC-P0-001][INTEGRACION] consulta resultados finales de la elección activa", async () => {
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

  it("[MX-12][RES-ACC-P1-003][INTEGRACION] bloquea una elección sin alcance territorial antes de consultar", async () => {
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

  it("[MX-12][RES-ACC-P0-002][INTEGRACION] fuerza departamento y municipio del contrato territorial en la solicitud", async () => {
    await renderResultsSummary();

    expect(testHarness.getResultsByLocation).toHaveBeenCalledWith(
      expect.objectContaining({ department: "dep-lp", municipality: "mun-lp" }),
      true,
    );
  });

  it("[MX-12][RES-SUM-P0-001][INTEGRACION] muestra el resumen final, mesas contadas y conserva filtros al abrir su fuente", async () => {
    await renderResultsSummary();

    expect(screen.getByText("Válidos: 190")).toBeInTheDocument();
    expect(screen.getByText("Mesa 1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mesa 1/i })).toHaveAttribute(
      "href",
      "/resultados/mesa/LP-001-01?electionId=election-2026&electionType=mayor",
    );
  });

  it("[MX-12][RES-SUM-P0-002][INTEGRACION] consulta el endpoint live y etiqueta el periodo preliminar", async () => {
    testHarness.useElectionConfig.mockReturnValue({
      election: { id: "election-2026", type: "mayor", isVotingPeriod: true, isResultsPeriod: false, isActive: true },
      elections: [],
      hasActiveConfig: true,
      isVotingPeriod: true,
      isResultsPeriod: false,
      isAutoRefreshWindow: true,
      isLoading: false,
    });

    await renderResultsSummary();

    expect(testHarness.getLiveResultsByLocation).toHaveBeenCalledWith(
      expect.objectContaining({ electionId: "election-2026", electionType: "municipal" }),
      true,
    );
    expect(screen.getAllByText(/Resultados preliminares/i).length).toBeGreaterThan(0);
  });

  it("[MX-12][RES-SUM-P0-003][INTEGRACION] pinta votos válidos y partidos con los valores del servicio", async () => {
    await renderResultsSummary();

    expect(screen.getAllByText("Partido Verde: 120")).toHaveLength(2);
    expect(screen.getByText("Válidos: 190")).toBeInTheDocument();
    expect(screen.getByText("Nulos: 5")).toBeInTheDocument();
    expect(screen.getByText("Blancos: 5")).toBeInTheDocument();
  });

  it("[MX-12][RES-SUM-P1-004][INTEGRACION] alimenta las dos visualizaciones de categoría desde la misma respuesta", async () => {
    await renderResultsSummary();

    expect(screen.getAllByTestId("results-graph")).toHaveLength(2);
    expect(screen.getAllByText("Partido Azul: 80")).toHaveLength(2);
  });

  it("[MX-12][RES-CAT-P0-001][INTEGRACION] pide los grupos municipal y concejo por separado", async () => {
    await renderResultsSummary();

    expect(testHarness.getResultsByLocation).toHaveBeenCalledWith(
      expect.objectContaining({ electionType: "municipal" }),
      true,
    );
    expect(testHarness.getResultsByLocation).toHaveBeenCalledWith(
      expect.objectContaining({ electionType: "council" }),
      true,
    );
  });

  it("[MX-12][RES-CAT-P1-002][INTEGRACION] conserva el panel secundario cuando la elección municipal lo utiliza", async () => {
    await renderResultsSummary();

    expect(screen.getByText("Resultados Alcalde")).toBeInTheDocument();
    expect(screen.getByText("Resultados Concejales")).toBeInTheDocument();
  });

  it("[MX-12][RES-TER-P0-001][INTEGRACION] envía los filtros territoriales combinados a ambos grupos", async () => {
    await renderResultsSummary();

    expect(testHarness.getResultsByLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        department: "dep-lp",
        municipality: "mun-lp",
        electionId: "election-2026",
      }),
      true,
    );
  });

  it("[MX-12][RES-TER-P0-002][INTEGRACION] no consulta resultados cuando falta el alcance territorial requerido", async () => {
    configureMayorWithoutTerritorialScope();

    await renderResultsSummary();

    expect(testHarness.getResultsByLocation).not.toHaveBeenCalled();
    expect(screen.queryByText("Partido Verde: 120")).not.toBeInTheDocument();
    expect(screen.queryByText("Válidos: 190")).not.toBeInTheDocument();
    expect(screen.queryByText("Mesa 1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("results-graph")).not.toBeInTheDocument();
  });

  it("[MX-12][RES-TER-P1-003][INTEGRACION] presenta estado vacío cuando la respuesta territorial no tiene resultados", async () => {
    testHarness.getResultsByLocation.mockReturnValue(
      resolvedPromise({ results: [], summary: { validVotes: 0, nullVotes: 0, blankVotes: 0 } }),
    );

    await renderResultsSummary();

    expect(screen.getAllByText("Sin datos").length).toBeGreaterThan(0);
  });

  it("[MX-12][RES-MES-P1-004][INTEGRACION] muestra las mesas contadas recibidas para la elección activa", async () => {
    await renderResultsSummary();

    expect(screen.getByText("Mesa 1")).toBeInTheDocument();
    expect(screen.getByText("LP-001-01")).toBeInTheDocument();
  });

  it("[MX-12][RES-MES-P0-005][INTEGRACION] enlaza el listado de mesas al detalle de su código", async () => {
    await renderResultsSummary();

    expect(screen.getByRole("link", { name: /Mesa 1/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/resultados/mesa/LP-001-01"),
    );
  });

  it("[MX-12][RES-ACT-P0-001][INTEGRACION] conserva la referencia de mesa para abrir sus actas", async () => {
    await renderResultsSummary();

    expect(screen.getByRole("link", { name: /Mesa 1/i })).toHaveAttribute(
      "href",
      expect.stringContaining("electionId=election-2026"),
    );
  });

  it("[MX-12][RES-ACT-P0-002][INTEGRACION] conserva la elección al navegar desde una mesa con versiones", async () => {
    await renderResultsSummary();

    expect(screen.getByRole("link", { name: /Mesa 1/i })).toHaveAttribute(
      "href",
      expect.stringContaining("electionType=mayor"),
    );
  });

  it("[MX-12][RES-CAS-P0-003][INTEGRACION] no cuenta una mesa inexistente como dato final", async () => {
    testHarness.useCountedBallots.mockReturnValue({
      tables: [],
      ballots: [],
      total: 0,
      page: 1,
      totalPages: 0,
      isLoading: false,
      isError: false,
      mode: "final",
    });

    await renderResultsSummary();

    expect(screen.queryByText("Mesa 1")).not.toBeInTheDocument();
  });

  it("[MX-12][RES-FIL-P1-001][INTEGRACION] conserva los filtros de elección y territorio al consultar resultados", async () => {
    await renderResultsSummary();

    expect(testHarness.getResultsByLocation).toHaveBeenCalledWith(
      expect.objectContaining({ electionId: "election-2026", department: "dep-lp", municipality: "mun-lp" }),
      true,
    );
  });

  it("[MX-12][RES-UPD-P1-002][INTEGRACION] conserva filtros mientras vuelve a consultar el resumen", async () => {
    await renderResultsSummary();

    expect(testHarness.getResultsByLocation).toHaveBeenCalledTimes(2);
    expect(testHarness.getResultsByLocation.mock.calls[0][0]).toEqual(
      expect.objectContaining({ department: "dep-lp", municipality: "mun-lp" }),
    );
  });

  it("[MX-12][RES-REP-P1-001][INTEGRACION] muestra la actividad por mesa del contrato activo", () => {
    render(<PersonalParticipationPage />);

    fireEvent.click(screen.getByRole("button", { name: /Ver reporte por mesa/i }));
    expect(screen.getByText("Ana Delegada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver hoja de trabajo/i })).toHaveAttribute(
      "href",
      "/resultados/mesa/LP-001-01?electionId=election-2026&electionType=mayor",
    );
  });

  it("[MX-12][RES-SUM-P0-001][ACEPTACION] recorre el resumen final filtrado hasta la fuente de mesa manteniendo el contexto de elección", async () => {
    await renderResultsSummary();

    expect(screen.getByText("Válidos: 190")).toBeInTheDocument();
    const resultGraph = screen
      .getAllByTestId("results-graph")
      .find((graph) => within(graph).queryByText("Partido Verde: 120"));
    if (!resultGraph) throw new Error("No se encontró el gráfico de Partido Verde.");
    expect(within(resultGraph).getByText("Partido Verde: 120")).toBeInTheDocument();
    expect(screen.getByText("Mesa 1")).toBeInTheDocument();
    const source = screen.getByRole("link", { name: /Mesa 1/i });
    expect(source).toHaveAttribute(
      "href",
      "/resultados/mesa/LP-001-01?electionId=election-2026&electionType=mayor",
    );
    expect(source).toHaveAttribute("href", expect.stringContaining("electionId=election-2026"));
  });

  it("[MX-12][RES-REP-P1-002][INTEGRACION] muestra las métricas recibidas del contrato activo sin recalcular su alcance", () => {
    render(<PersonalParticipationPage />);

    const summaryCard = document.querySelector('[data-cy="summary-card"]');
    if (!(summaryCard instanceof HTMLElement)) throw new Error("No se encontró el resumen ejecutivo.");
    expect(testHarness.useGetExecutiveSummaryQuery).toHaveBeenCalled();
    expect(within(summaryCard).getByText("66.67%")).toBeInTheDocument();
    expect(within(summaryCard).getByText(/de 3 delegados autorizados/i)).toBeInTheDocument();
    expect(within(summaryCard).getByText("2")).toBeInTheDocument();
    expect(within(summaryCard).getByText("1")).toBeInTheDocument();
  });

  it("[MX-12][RES-REP-P1-003][INTEGRACION] filtra la auditoría con la elección y abre el acta relacionada", () => {
    render(<AuditAndMatchPage />);

    expect(testHarness.useGetAuditoriaTSEQuery).toHaveBeenCalledWith(
      expect.objectContaining({ electionId: "election-2026", municipality: "La Paz" }),
      { skip: false },
    );
    fireEvent.click(screen.getByRole("button", { name: /Ver reporte detallado/i }));
    expect(screen.getByRole("link", { name: /Ver hoja de trabajo/i })).toHaveAttribute(
      "href",
      "/resultados/imagen/ballot-1",
    );
  });

  it("[MX-12][RES-CON-P0-001][INTEGRACION] presenta una contribución visual por cada mesa contada", async () => {
    await renderResultsSummary();

    expect(screen.getAllByText("Mesa 1")).toHaveLength(1);
  });

  it("[MX-12][RES-CON-P0-002][INTEGRACION] conserva la respuesta visible hasta completar la consulta final", async () => {
    await renderResultsSummary();

    expect(screen.getByText("Resultados Generales")).toBeInTheDocument();
    expect(screen.getByText("Válidos: 190")).toBeInTheDocument();
  });

  it("[MX-12][RES-CON-P1-003][INTEGRACION] no duplica mesas cuando se reitera la misma respuesta", async () => {
    await renderResultsSummary();

    expect(screen.getAllByText("LP-001-01")).toHaveLength(1);
  });

  it("[MX-12][RES-SEC-P0-001][INTEGRACION] rechaza el acceso directo sin alcance antes de mostrar datos", async () => {
    configureMayorWithoutTerritorialScope();

    await renderResultsSummary();

    expect(screen.queryByText("Partido Verde: 120")).not.toBeInTheDocument();
    expect(screen.queryByText("Válidos: 190")).not.toBeInTheDocument();
    expect(screen.queryByText("Mesa 1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("results-graph")).not.toBeInTheDocument();
    expect(testHarness.getResultsByLocation).not.toHaveBeenCalled();
  });

  it("[MX-12][RES-SEC-P0-002][INTEGRACION] renderiza únicamente campos permitidos aunque la respuesta incluya metadata sensible", async () => {
    testHarness.getResultsByLocation.mockReturnValue(
      resolvedPromise({
        ...resultadosSummary,
        token: "session-secret",
        wallet: "0xprivate-wallet",
        internalUrl: "https://internal.test/results",
        delegateDni: "1234567",
      }),
    );

    await renderResultsSummary();

    expect(screen.getAllByText("Partido Verde: 120")).toHaveLength(2);
    expect(document.body).not.toHaveTextContent(/session-secret|0xprivate-wallet|internal\.test|1234567/i);
  });

  it("[MX-12][RES-TRA-P1-003][INTEGRACION] conserva identificadores y actividad disponibles solo cuando la fuente los entrega", () => {
    render(<PersonalParticipationPage />);

    fireEvent.click(screen.getByRole("button", { name: /Ver reporte por mesa/i }));
    expect(screen.getByText("Ana Delegada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver hoja de trabajo/i })).toHaveAttribute(
      "href",
      "/resultados/mesa/LP-001-01?electionId=election-2026&electionType=mayor",
    );
    expect(screen.queryByText("Sin fecha de actividad")).not.toBeInTheDocument();
  });

  it("[MX-12][RES-UX-P2-001][INTEGRACION] mantiene encabezado, gráficos, participación y mesa sin superponer el flujo", async () => {
    await renderResultsSummary();

    expect(screen.getByText("Resultados Generales")).toBeInTheDocument();
    expect(screen.getAllByTestId("results-graph")).toHaveLength(2);
    expect(screen.getByTestId("participation-bars")).toBeInTheDocument();
    expect(screen.getByText("Mesa 1")).toBeInTheDocument();
  });

});
