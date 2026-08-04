import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import AuditAndMatchPage from "@/domains/resultados/screens/AuditAndMatchPage";
import PersonalParticipationPage from "@/domains/resultados/screens/PersonalParticipationPage";
import ResultadosImagenPage from "@/domains/resultados/screens/ResultadosImagenPage";
import ResultadosMesaPage from "@/domains/resultados/screens/ResultadosMesaPage";
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
    params: { id: "ballot-1", tableCode: "LP-001-01" },
    navigate: vi.fn(),
    dispatch: vi.fn(),
    getBallotsByTableCode: vi.fn(),
    getResultsByLocation: vi.fn(),
    getLiveResultsByLocation: vi.fn(),
    useMyContract: vi.fn(),
    useElectionConfig: vi.fn(),
    useElectionId: vi.fn(),
    usePublicResultsScope: vi.fn(),
    useGetAuditoriaTSEQuery: vi.fn(),
    useGetConfigurationStatusQuery: vi.fn(),
    useGetMyContractQuery: vi.fn(),
    useGetExecutiveSummaryQuery: vi.fn(),
    useGetDelegateActivityQuery: vi.fn(),
    useGetBallotQuery: vi.fn(),
    useGetBallotByTableCodeQuery: vi.fn(),
    useGetAttestationsByBallotIdQuery: vi.fn(),
    useGetAttestationsByDepartmentIdQuery: vi.fn(),
    useGetAttestationsByMunicipalityIdQuery: vi.fn(),
    useGetMostSupportedBallotByTableCodeQuery: vi.fn(),
    useGetAttestationCasesByTableCodeQuery: vi.fn(),
    useGetElectoralTableByTableCodeQuery: vi.fn(),
    useCountedBallots: vi.fn(),
  };
});

vi.mock("react-redux", () => ({
  useSelector: (selector: any) => selector(testHarness.state),
  useDispatch: () => testHarness.dispatch,
}));

vi.mock("@/domains/resultados/navigation/compat", () => ({
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => testHarness.navigate,
  useParams: () => testHarness.params,
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

vi.mock("@/store/resultados/resultadosEndpoints", () => ({
  useLazyGetResultsByLocationQuery: () => [testHarness.getResultsByLocation],
  useLazyGetLiveResultsByLocationQuery: () => [testHarness.getLiveResultsByLocation],
}));

vi.mock("@/store/ballots/ballotsEndpoints", () => ({
  useGetBallotQuery: (...args: any[]) => testHarness.useGetBallotQuery(...args),
  useGetBallotByTableCodeQuery: (...args: any[]) => testHarness.useGetBallotByTableCodeQuery(...args),
  useLazyGetBallotByTableCodeQuery: () => [testHarness.getBallotsByTableCode],
}));

vi.mock("@/store/attestations/attestationsEndpoints", () => ({
  useGetAttestationsByBallotIdQuery: (...args: any[]) =>
    testHarness.useGetAttestationsByBallotIdQuery(...args),
  useGetAttestationsByDepartmentIdQuery: (...args: any[]) =>
    testHarness.useGetAttestationsByDepartmentIdQuery(...args),
  useGetAttestationsByMunicipalityIdQuery: (...args: any[]) =>
    testHarness.useGetAttestationsByMunicipalityIdQuery(...args),
  useGetMostSupportedBallotByTableCodeQuery: (...args: any[]) =>
    testHarness.useGetMostSupportedBallotByTableCodeQuery(...args),
  useGetAttestationCasesByTableCodeQuery: (...args: any[]) =>
    testHarness.useGetAttestationCasesByTableCodeQuery(...args),
}));

vi.mock("@/store/electoralTables/electoralTablesEndpoints", () => ({
  useGetElectoralTableByTableCodeQuery: (...args: any[]) =>
    testHarness.useGetElectoralTableByTableCodeQuery(...args),
}));

vi.mock("@/hooks/useCountedBallots", () => ({
  useCountedBallots: (...args: any[]) => testHarness.useCountedBallots(...args),
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

vi.mock("@/legacy-pages/Resultados/Graphs", () => ({
  default: ({ data }: { data: Array<{ name: string; value: number }> }) => (
    <div data-testid="attestation-results-graph">
      {data.map((item) => (
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

const ballotFixture = {
  _id: "ballot-1",
  electionId: "election-2026",
  tableCode: "LP-001-01",
  tableNumber: "1",
  electoralLocationId: "loc-central",
  image: "ipfs://cid-acta-1",
  ipfsUri: "ipfs://metadata-acta-1",
  recordId: "record-1",
  version: 1,
  status: "PROCESSED",
  valuable: true,
  createdAt: "2026-04-18T19:00:00.000Z",
  updatedAt: "2026-04-18T20:00:00.000Z",
  __v: 0,
  location: {
    department: "La Paz",
    province: "Murillo",
    municipality: "La Paz",
    electoralSeat: "Asiento 1",
    electoralLocationName: "Unidad Educativa Central",
    district: "Distrito 1",
    zone: "Zona Central",
  },
  votes: {
    parties: {
      validVotes: 10,
      nullVotes: 1,
      blankVotes: 2,
      partyVotes: [{ partyId: "Partido Verde", votes: 10 }],
      totalVotes: 13,
    },
    deputies: {
      validVotes: 7,
      nullVotes: 0,
      blankVotes: 1,
      partyVotes: [{ partyId: "Partido Azul", votes: 7 }],
      totalVotes: 8,
    },
  },
};

const ballotVersionFixture = {
  ...ballotFixture,
  _id: "ballot-2",
  version: 2,
  image: "ipfs://cid-acta-2",
  recordId: "record-2",
  votes: {
    ...ballotFixture.votes,
    parties: {
      ...ballotFixture.votes.parties,
      partyVotes: [{ partyId: "Partido Verde", votes: 8 }],
      validVotes: 8,
      totalVotes: 11,
    },
  },
};

const attestationFixture = [
  {
    _id: "attestation-1",
    support: true,
    ballotId: "ballot-1",
    isJury: false,
    dni: "1234567",
    userRole: "DELEGATE",
    userName: "Ana Delegada",
    createdAt: "2026-04-18T20:10:00.000Z",
    updatedAt: "2026-04-18T20:10:00.000Z",
  },
  {
    _id: "attestation-2",
    support: false,
    ballotId: "ballot-1",
    isJury: true,
    dni: "7654321",
    userRole: "JURY",
    userName: "Luis Jurado",
    createdAt: "2026-04-18T20:11:00.000Z",
    updatedAt: "2026-04-18T20:11:00.000Z",
  },
];

const resolvedPromise = (value: unknown) => ({
  unwrap: vi.fn().mockResolvedValue(value),
});

const flushEffects = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe("MX-11 | Atestiguamiento, actas y evidencias | Frontend Admin", () => {
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
    testHarness.params = { id: "ballot-1", tableCode: "LP-001-01" };
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
    testHarness.getResultsByLocation.mockReturnValue(
      resolvedPromise({ results: [], summary: { validVotes: 0, nullVotes: 0, blankVotes: 0 } }),
    );
    testHarness.getLiveResultsByLocation.mockReturnValue(
      resolvedPromise({ results: [], summary: { validVotes: 0, nullVotes: 0, blankVotes: 0 } }),
    );
    testHarness.getBallotsByTableCode.mockReturnValue(
      resolvedPromise([ballotFixture, ballotVersionFixture]),
    );
    testHarness.useGetBallotQuery.mockReturnValue({
      data: ballotFixture,
      isError: false,
    });
    testHarness.useGetBallotByTableCodeQuery.mockReturnValue({
      data: [ballotFixture, ballotVersionFixture],
      isError: false,
    });
    testHarness.useGetAttestationsByBallotIdQuery.mockReturnValue({
      data: attestationFixture,
      isError: false,
    });
    testHarness.useGetAttestationsByDepartmentIdQuery.mockReturnValue({
      data: { data: [] },
      isError: false,
    });
    testHarness.useGetAttestationsByMunicipalityIdQuery.mockReturnValue({
      data: { data: attestationFixture },
      isError: false,
    });
    testHarness.useGetMostSupportedBallotByTableCodeQuery.mockReturnValue({
      data: { ballotId: "ballot-2", version: 2, supportCount: 4, totalAttestations: 5 },
      isLoading: false,
    });
    testHarness.useGetAttestationCasesByTableCodeQuery.mockReturnValue({
      data: {
        ballots: [
          { ballotId: "ballot-1", version: 1, supports: { users: 2, juries: 1 } },
          { ballotId: "ballot-2", version: 2, supports: { users: 4, juries: 1 } },
        ],
      },
      isLoading: false,
    });
    testHarness.useGetElectoralTableByTableCodeQuery.mockReturnValue({
      data: {
        _id: "table-1",
        tableCode: "LP-001-01",
        tableNumber: "1",
        electoralLocation: { _id: "loc-central" },
      },
      isError: false,
      isLoading: false,
      isFetching: false,
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
  });

  it("[MX-11][ADM-AUD-P1-005][INTEGRACION] muestra comparación persistida y navega al acta sin corregirla", async () => {
    const user = userEvent.setup();

    render(<AuditAndMatchPage />);

    expect(screen.getByText("Auditoría vs Resultados TSE")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(3);
    expect(testHarness.useGetAuditoriaTSEQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        electionId: "election-2026",
        department: "La Paz",
        municipality: "La Paz",
      }),
      { skip: false },
    );

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

  it("[BASELINE_ACTUAL][NO_CUBRE_MATRIZ] mantiene visible el detalle de mesa aunque no exista resumen de caso", async () => {
    render(<ResultadosMesaPage />);

    await flushEffects();

    expect(screen.getByText("Mesa #1")).toBeInTheDocument();
    expect(screen.getByText("Código: LP-001-01")).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: "Hoja de trabajo electoral" }),
    ).toHaveLength(2);
    expect(screen.queryByText("En verificación")).toBeNull();
    expect(screen.queryByText("Resumen del caso")).toBeNull();
    expect(screen.queryByText(/Sin resolución/i)).toBeNull();
  });

  it("[MX-11][ADM-REP-P1-004][INTEGRACION] muestra sólo actividad de atestiguamiento del contrato permitido", async () => {
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

  it("[BASELINE_ACTUAL][NO_CUBRE_MATRIZ] consulta atestiguamientos por acta en la UI actual", async () => {
    render(<ResultadosImagenPage />);

    await flushEffects();

    expect(screen.getByText("Ana Delegada")).toBeInTheDocument();
    expect(testHarness.useGetAttestationsByBallotIdQuery).toHaveBeenLastCalledWith(
      "ballot-1",
      expect.objectContaining({ skip: false }),
    );
  });

  it("[MX-11][ADM-IMG-P1-001][INTEGRACION] consulta una acta, muestra evidencia y comunica una imagen inexistente", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ResultadosImagenPage />);

    await flushEffects();

    expect(testHarness.useGetBallotQuery).toHaveBeenCalledWith(
      "ballot-1",
      expect.objectContaining({ skip: false }),
    );
    expect(testHarness.useGetAttestationsByBallotIdQuery).toHaveBeenCalledWith(
      "ballot-1",
      expect.objectContaining({ skip: false }),
    );
    expect(screen.getByText("Partido Verde: 10")).toBeInTheDocument();
    expect(screen.getByText("Ana Delegada")).toBeInTheDocument();
    expect(screen.getByText("Validado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Imagen" })).toHaveAttribute(
      "href",
      "https://ipfs.io/ipfs/cid-acta-1",
    );

    await user.type(screen.getByRole("textbox"), "ballot-404");
    await user.keyboard("{Enter}");

    expect(testHarness.navigate).toHaveBeenCalledWith(
      "/resultados/imagen/ballot-404?electionType=mayor",
    );

    testHarness.params = { ...testHarness.params, id: "ballot-404" };
    testHarness.useGetBallotQuery.mockReturnValue({ data: undefined, isError: true });
    rerender(<ResultadosImagenPage />);

    expect(screen.getByText('No se encontró la imagen "ballot-404"')).toBeInTheDocument();
  });

  it("[MX-11][ADM-MES-P1-002][INTEGRACION] consulta versiones y evidencias de mesa sin presentar resultados consolidados", async () => {
    const user = userEvent.setup();
    testHarness.getResultsByLocation.mockImplementation((request: { electionType?: string }) =>
      resolvedPromise(
        request.electionType === "municipal"
          ? {
              results: [{ partyId: "Partido Verde", totalVotes: 10 }],
              summary: { validVotes: 10, nullVotes: 1, blankVotes: 2 },
            }
          : {
              results: [{ partyId: "Concejalía Verde", totalVotes: 8 }],
              summary: { validVotes: 8, nullVotes: 1, blankVotes: 2 },
            },
      ),
    );

    render(<ResultadosMesaPage />);

    await flushEffects();

    expect(testHarness.getBallotsByTableCode).toHaveBeenCalledWith({
      tableCode: "LP-001-01",
      electionId: "election-2026",
    });
    expect(screen.getByText("Mesa #1")).toBeInTheDocument();
    expect(screen.getByText("Código: LP-001-01")).toBeInTheDocument();

    const workpaperCards = screen
      .getAllByRole("heading", { name: "Hoja de trabajo electoral" })
      .map((heading) => heading.closest('[class~="sm:max-w-sm"]'));
    const [versionOneCard, versionTwoCard] = workpaperCards;

    if (!versionOneCard || !versionTwoCard) {
      throw new Error("Las dos tarjetas de versiones de acta no están disponibles.");
    }

    expect(within(versionOneCard).getByText("Versión").parentElement).toHaveTextContent("1");
    expect(within(versionOneCard).getByText("Usuarios").parentElement).toHaveTextContent("2");
    expect(within(versionOneCard).getByText("Jurados").parentElement).toHaveTextContent("1");
    expect(
      within(versionOneCard).getByRole("img", {
        name: "Vista previa de hoja de trabajo electoral",
      }),
    ).toHaveAttribute("src", "https://ipfs.io/ipfs/cid-acta-1");
    expect(within(versionOneCard).getByRole("link", { name: "Detalles" })).toHaveAttribute(
      "href",
      "/resultados/imagen/ballot-1?electionId=election-2026&electionType=mayor",
    );

    expect(within(versionTwoCard).getByText("Versión").parentElement).toHaveTextContent("2");
    expect(within(versionTwoCard).getByText("Usuarios").parentElement).toHaveTextContent("4");
    expect(within(versionTwoCard).getByText("Jurados").parentElement).toHaveTextContent("1");
    expect(within(versionTwoCard).getByText("Mas apoyada")).toBeInTheDocument();
    expect(
      within(versionTwoCard).getByRole("img", {
        name: "Vista previa de hoja de trabajo electoral",
      }),
    ).toHaveAttribute("src", "https://ipfs.io/ipfs/cid-acta-2");
    expect(within(versionTwoCard).getByRole("link", { name: "Detalles" })).toHaveAttribute(
      "href",
      "/resultados/imagen/ballot-2?electionId=election-2026&electionType=mayor",
    );

    const graphCards = screen.getAllByTestId("attestation-results-graph");
    const municipalVotes = graphCards.find((graph) =>
      within(graph).queryByText("Partido Verde: 10"),
    );
    const councilVotes = graphCards.find((graph) =>
      within(graph).queryByText("Concejalía Verde: 8"),
    );

    if (!municipalVotes || !councilVotes) {
      throw new Error("Los votos de las dos versiones de acta no están disponibles.");
    }

    expect(within(municipalVotes).getByText("Partido Verde: 10")).toBeInTheDocument();
    expect(within(councilVotes).getByText("Concejalía Verde: 8")).toBeInTheDocument();
    expect(screen.queryByText(/consolidación|ganador oficial|porcentaje general/i)).toBeNull();

    await user.type(screen.getByRole("textbox"), "LP-002-02");
    await user.keyboard("{Enter}");

    expect(testHarness.navigate).toHaveBeenCalledWith(
      "/resultados/mesa/LP-002-02?electionId=election-2026&electionType=mayor",
    );
  });

  it("[MX-11][TRA-P1-004][INTEGRACION] muestra la fecha disponible del atestiguamiento en el detalle de acta", async () => {
    render(<ResultadosImagenPage />);

    await flushEffects();

    const attestationTime = new Date(attestationFixture[0].createdAt).toLocaleTimeString();
    expect(screen.getByText("Ana Delegada")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        element?.textContent === `DELEGATE • ${attestationTime}`,
      ),
    ).toBeInTheDocument();
  });

  it("[MX-11][SEC-DEL-P0-005][INTEGRACION] enlaza la actividad autorizada con el detalle mínimo del acta", async () => {
    const user = userEvent.setup();
    const participation = render(<PersonalParticipationPage />);

    expect(screen.getByText(/Alcaldía de La Paz/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /ver reporte por mesa/i }));
    expect(screen.getByText("Ana Delegada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver hoja de trabajo/i })).toHaveAttribute(
      "href",
      "/resultados/mesa/LP-001-01?electionId=election-2026&electionType=mayor",
    );

    participation.unmount();
    render(<ResultadosImagenPage />);

    await flushEffects();

    expect(screen.getByText("Ana Delegada")).toBeInTheDocument();
    expect(screen.getByText("Validado")).toBeInTheDocument();
    expect(screen.getByText("Codigo mesa: LP-001-01")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        element?.textContent === `DELEGATE • ${new Date(attestationFixture[0].createdAt).toLocaleTimeString()}`,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/directorio general|alta de delegado|retiro de delegado/i)).toBeNull();
  });
});
