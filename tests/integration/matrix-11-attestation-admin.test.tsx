import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import AuditAndMatchPage from "@/domains/resultados/screens/AuditAndMatchPage";
import PersonalParticipationPage from "@/domains/resultados/screens/PersonalParticipationPage";
import {
  auditSummary,
  delegateActivity,
  delegateTableActivity,
  executiveSummary,
  mayorContract,
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
    key: "mx-11-attestation-admin",
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

vi.mock("@/store/departments/departmentsEndpoints", () => ({
  useGetDepartmentsQuery: vi.fn(() => ({ data: [], isLoading: false })),
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

vi.mock("@/legacy-pages/Resultados/StatisticsBars", () => ({
  default: ({ voteData }: { voteData: Array<{ name: string; value: number }> }) => (
    <div data-testid="attestation-participation-bars">
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

describe("MX-11 | Atestiguamiento, actas y evidencias | Frontend Admin", () => {
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

  it("[ADM-AUD-P1-005][ADM-IMG-P1-001][TRA-P1-004] muestra auditoria comparada, imagen de acta y fechas operativas sin corregir resultados", async () => {
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
    expect(screen.queryByRole("button", { name: /aprobar|corregir|rechazar/i })).toBeNull();
  });

  it("[ADM-CAS-P1-003][ADM-MES-P1-002] muestra estados de casos y versiones por mesa sin convertir la consulta en resultados oficiales", () => {
    testHarness.useGetAuditoriaTSEQuery.mockReturnValue({
      data: { total: 0, observados: 0, sinObservaciones: 0, pendientes: 0, details: [] },
      isLoading: false,
    });
    const { rerender } = render(<AuditAndMatchPage />);

    expect(screen.getByText("Auditoría vs Resultados TSE")).toBeInTheDocument();
    expect(screen.getByText("Ver reporte detallado por hoja de trabajo")).toBeInTheDocument();
    expect(screen.queryByText(/ganador|porcentaje general|publicacion oficial/i)).toBeNull();

    testHarness.useGetAuditoriaTSEQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });
    rerender(<AuditAndMatchPage />);

    expect(screen.getByText("Cargando auditoría vs TSE...")).toBeInTheDocument();
  });

  it("[ADM-REP-P1-004][SEC-DEL-P0-005][SEC-ACC-P0-001] muestra actividad de delegados por contrato y territorio con datos minimos", async () => {
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
    expect(screen.queryByText(/directorio general|alta de delegado|retiro de delegado/i)).toBeNull();
  });

  it("[SEC-ACC-P0-001][SEC-DEL-P0-005] bloquea usuario sin alcance y muestra error seguro sin datos de contrato ajeno", () => {
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
    expect(screen.queryByText("contract-other")).toBeNull();

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
    expect(screen.queryByText(/token|authorization|x-api-key|dni/i)).toBeNull();
  });
});
