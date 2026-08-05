import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResultadosGeneralesPage from "@/domains/resultados/screens/ResultadosGeneralesPage";
import AccessApprovalsGuard from "@/domains/access-approvals/guards/AccessApprovalsGuard";
import ResultadosPrivateGuard from "@/domains/resultados/guards/ResultadosPrivateGuard";

type MockAuth = {
  token: string | null;
  user: {
    role: string;
    id?: string;
    email?: string;
    name?: string;
    active?: boolean;
    status?: string;
  } | null;
  availableContexts: [];
  activeContext: null;
};

const scope = vi.hoisted(() => ({
  state: { auth: { user: { role: "GOVERNOR" }, token: "token", availableContexts: [], activeContext: null } as MockAuth, results: { filterIds: { departmentId: "foreign-dep", provinceId: "", municipalityId: "foreign-mun", electoralSeatId: "", electoralLocationId: "" } } },
  getResults: vi.fn(), getLiveResults: vi.fn(), contract: vi.fn(), replace: vi.fn(), pathname: vi.fn(),
  searchParams: new URLSearchParams("electionType=governor"),
  setSearchParams: vi.fn(),
  electionConfig: { election: { type: "governor" }, hasActiveConfig: true, isVotingPeriod: false, isResultsPeriod: true, isAutoRefreshWindow: false },
}));
vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
  useSelector: (selector: (state: typeof scope.state) => unknown) => selector(scope.state),
}));
vi.mock("@/domains/resultados/navigation/compat", () => ({ useSearchParams: () => [scope.searchParams, scope.setSearchParams] as const }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: scope.replace }), usePathname: () => scope.pathname(), useSearchParams: () => new URLSearchParams() }));
vi.mock("@/domains/resultados/hooks/useElectionId", () => ({ default: () => "election-2026" }));
vi.mock("@/domains/resultados/hooks/useElectionConfig", () => ({ default: () => scope.electionConfig }));
vi.mock("@/hooks/useMyContract", () => ({ useMyContract: () => scope.contract() }));
vi.mock("@/hooks/useAutoRefreshTick", () => ({ default: () => 0 }));
vi.mock("@/hooks/useCountedBallots", () => ({ useCountedBallots: () => ({ tables: [] }) }));
vi.mock("@/domains/resultados/hooks/usePublicResultsScope", () => ({ usePublicResultsScope: () => ({ isPublic: false, isLoading: false, isScopeValid: true }) }));
vi.mock("@/store/departments/departmentsEndpoints", () => ({ useGetDepartmentsQuery: () => ({ data: [] }) }));
vi.mock("@/store/resultados/resultadosEndpoints", () => ({ useLazyGetResultsByLocationQuery: () => [scope.getResults], useLazyGetLiveResultsByLocationQuery: () => [scope.getLiveResults] }));
vi.mock("@/legacy-pages/Resultados/Graphs", () => ({ default: () => <div>gráfico</div> }));
vi.mock("@/legacy-pages/Resultados/StatisticsBars", () => ({ default: () => <div>participación</div> }));
vi.mock("@/domains/resultados/components/Breadcrumb2", () => ({ default: () => <div>Inicio</div> }));

const result = { unwrap: () => Promise.resolve({ results: [], summary: { validVotes: 0, nullVotes: 0, blankVotes: 0 } }) };

describe("MX-10 | alcance contractual en resultados", () => {
  beforeEach(() => {
    vi.useRealTimers(); vi.clearAllMocks(); scope.pathname.mockReturnValue("/resultados/control-personal");
    scope.state.auth = {
      user: { role: "GOVERNOR" }, token: "token", availableContexts: [], activeContext: null,
    };
    scope.searchParams = new URLSearchParams("electionType=governor");
    scope.state.results.filterIds = { departmentId: "foreign-dep", provinceId: "", municipalityId: "foreign-mun", electoralSeatId: "", electoralLocationId: "" };
    scope.getResults.mockReturnValue(result); scope.getLiveResults.mockReturnValue(result);
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); });
  it("[MX-10][PER-GOV-P0-001][INTEGRACION] fuerza el departamento contractual aunque el estado contenga filtros externos", async () => {
    scope.state.auth.user = { role: "GOVERNOR" };
    scope.contract.mockReturnValue({ status: "has_active", contract: { territory: { departmentId: "dep-lp" } } });
    render(<ResultadosGeneralesPage />);
    await waitFor(() => expect(scope.getResults).toHaveBeenCalledTimes(2));
    expect(scope.getResults).toHaveBeenCalledWith(expect.objectContaining({ department: "dep-lp", municipality: "foreign-mun" }), true);
    expect(scope.getResults).not.toHaveBeenCalledWith(expect.objectContaining({ department: "foreign-dep" }), true);
  });
  it("[MX-10][PER-MAY-P0-002][INTEGRACION] fuerza departamento y municipio contractuales frente a filtros externos", async () => {
    scope.state.auth.user = { role: "MAYOR" };
    scope.contract.mockReturnValue({ status: "has_active", contract: { territory: { departmentId: "dep-lp", municipalityId: "mun-lp" } } });
    render(<ResultadosGeneralesPage />);
    await waitFor(() => expect(scope.getResults).toHaveBeenCalledTimes(2));
    expect(scope.getResults).toHaveBeenCalledWith(expect.objectContaining({ department: "dep-lp", municipality: "mun-lp" }), true);
  });
  it("[MX-10][PER-APP-P0-004][INTEGRACION] bloquea la bandeja de aprobación para un rol territorial ajeno", async () => {
    scope.state.auth = {
      token: "token", availableContexts: [], activeContext: null,
      user: { id: "mayor", email: "mayor@test", name: "Alcalde", role: "MAYOR", active: true, status: "ACTIVE" },
    };
    render(<AccessApprovalsGuard><div>datos de aprobación</div></AccessApprovalsGuard>);
    expect(await screen.findByText(/no tiene acceso/i)).toBeInTheDocument();
    expect(screen.queryByText("datos de aprobación")).not.toBeInTheDocument();
  });
  it("[MX-10][SEC-TEN-P0-001][INTEGRACION] redirige una ruta territorial privada sin sesión sin renderizar datos protegidos", async () => {
    scope.state.auth = { token: null, user: null, availableContexts: [], activeContext: null };
    render(<ResultadosPrivateGuard><div>reporte territorial</div></ResultadosPrivateGuard>);
    await waitFor(() => expect(scope.replace).toHaveBeenCalledWith("/resultados/login?from=%2Fresultados%2Fcontrol-personal"));
    expect(screen.queryByText("reporte territorial")).not.toBeInTheDocument();
  });
});
