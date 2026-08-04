import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PastElectionsPage from "@/domains/votacion/screens/PastElectionsPage";
import PublicElectionDetailPage from "@/domains/votacion/screens/PublicElectionDetailPage";
import VotacionPublicLandingPage from "@/domains/votacion/screens/VotacionPublicLandingPage";
import { PublicLandingRepositoryApi } from "@/features/publicLanding/data/PublicLandingRepository.api";
import { jsonResponse, makePublicElectionResponse, matrix13LandingData } from "../fixtures/matrix-13-public";

const pageHarness = vi.hoisted(() => ({
  landing: vi.fn(),
  past: vi.fn(),
  navigate: vi.fn(),
  params: { electionId: "evt-publico" as string | undefined },
}));

vi.mock("@/features/publicLanding/data/usePublicLandingRepository", () => ({
  useLandingData: () => pageHarness.landing(),
  usePastElections: () => pageHarness.past(),
}));

vi.mock("@/domains/votacion/navigation/compat", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>{children}</a>
  ),
  useNavigate: () => pageHarness.navigate,
  useParams: () => pageHarness.params,
}));

const publicLandingResponse = {
  active: [
    {
      id: "active-1",
      name: "Elección activa",
      objective: "Institución activa",
      votingStart: "2026-08-01T08:00:00.000Z",
      votingEnd: "2026-08-01T18:00:00.000Z",
    },
  ],
  upcoming: [],
  results: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  pageHarness.params.electionId = "evt-publico";
  pageHarness.landing.mockReturnValue({
    data: matrix13LandingData,
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
  pageHarness.past.mockReturnValue({
    elections: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MX-13 | páginas públicas", () => {
  it("[MX-13][PUB-LND-P0-001][INTEGRACION] renderiza /votacion para visitante y presenta un error recuperable de carga", () => {
    render(<VotacionPublicLandingPage />);

    expect(screen.getByRole("heading", { name: /Elecciones públicas/i })).toBeInTheDocument();
    expect(screen.getByText("Información pública para consultar votaciones visibles.")).toBeInTheDocument();

    cleanup();
    pageHarness.landing.mockReturnValue({
      data: null,
      loading: false,
      error: new Error("fallo de carga controlado"),
      refetch: vi.fn(),
    });
    render(<VotacionPublicLandingPage />);

    expect(screen.getByRole("heading", { name: "Error al cargar" })).toBeInTheDocument();
    expect(screen.getByText(/No se pudo cargar la información/i)).toBeInTheDocument();
  });

  it("[MX-13][PUB-LST-P0-002][INTEGRACION] conserva la landing estática pública y verifica separadamente el contrato de elecciones activas", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse(publicLandingResponse));
    vi.stubGlobal("fetch", fetchMock);
    const repository = new PublicLandingRepositoryApi();
    const elections = await repository.getActiveElections();

    render(<VotacionPublicLandingPage />);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0];
    if (!firstCall) throw new Error("fetch no fue invocado");
    const [landingRequest, landingInit] = firstCall;
    expect(new URL(String(landingRequest)).pathname).toBe("/api/v1/voting/events/public/landing");
    expect(landingInit).toEqual({ method: "GET", headers: { Accept: "application/json" } });
    expect(elections.featured).toEqual(
      expect.objectContaining({
        id: "active-1",
        title: "Elección activa",
        organization: "Institución activa",
        status: "ACTIVA",
        isFeatured: true,
      }),
    );
    expect(screen.getByRole("heading", { name: /Elecciones públicas/i })).toBeInTheDocument();
    expect(screen.getByText("Información pública para consultar votaciones visibles.")).toBeInTheDocument();
    expect(screen.queryByText("Elección activa")).not.toBeInTheDocument();
    expect(screen.queryByText(/panel administrativo/i)).not.toBeInTheDocument();
  });

  it("[MX-13][PUB-LST-P1-003][INTEGRACION] carga listado, muestra vacío y error, y navega al detalle público", async () => {
    const user = userEvent.setup();
    pageHarness.past.mockReturnValue({
      elections: [
        {
          id: "past-1",
          title: "Elección universitaria",
          organization: "Universidad pública",
          status: "FINALIZADA",
          isFeatured: false,
          votingSchedule: { from: "1 de agosto", to: "2 de agosto" },
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<PastElectionsPage />);

    await user.type(screen.getByLabelText("Buscar elección"), "sin coincidencia");
    expect(screen.getByRole("heading", { name: "No hay coincidencias" })).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Buscar elección"));
    await user.click(screen.getByRole("button", { name: "Ver elección" }));
    expect(pageHarness.navigate).toHaveBeenCalledWith("/votacion/elecciones/past-1/publica");

    cleanup();
    pageHarness.past.mockReturnValue({ elections: [], loading: false, error: new Error("fallo"), refetch: vi.fn() });
    render(<PastElectionsPage />);
    expect(screen.getByRole("heading", { name: "No se pudieron cargar las elecciones" })).toBeInTheDocument();
  });

  it("[MX-13][PUB-ACC-P0-001][INTEGRACION] abre las vistas públicas de elección, mesa e imagen como visitante sin token", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(makePublicElectionResponse())));
    render(<PublicElectionDetailPage />);

    expect(await screen.findByRole("heading", { name: "Elección pública" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();
    expect(screen.queryByText(/panel administrativo/i)).not.toBeInTheDocument();
  });

  it("[MX-13][PUB-ACC-P0-002][INTEGRACION] resuelve el detalle público válido, inexistente y con error sin abandonar /votacion", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(makePublicElectionResponse())));
    render(<PublicElectionDetailPage />);
    expect(await screen.findByRole("heading", { name: "Elección pública" })).toBeInTheDocument();

    cleanup();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "not found" }, 404)));
    render(<PublicElectionDetailPage />);
    expect(await screen.findByText("Elección no encontrada")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver al inicio" }));
    expect(pageHarness.navigate).toHaveBeenCalledWith("/votacion");

    cleanup();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "fallo" }, 500)));
    render(<PublicElectionDetailPage />);
    expect(await screen.findByText("Error al cargar la elección")).toBeInTheDocument();
  });

  it("[MX-13][PUB-STA-P0-001][INTEGRACION] presenta fases soportadas y usa el fallback público actual para fases no reconocidas", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(makePublicElectionResponse({ phase: "UPCOMING", resultsAvailable: false })))
      .mockResolvedValueOnce(jsonResponse(makePublicElectionResponse({ phase: "ACTIVE", resultsAvailable: false })))
      .mockResolvedValueOnce(jsonResponse(makePublicElectionResponse({ phase: "RESULTS" })))
      .mockResolvedValueOnce(jsonResponse(makePublicElectionResponse({ phase: "OTHER", resultsAvailable: false })))
      .mockResolvedValueOnce(jsonResponse(makePublicElectionResponse({ phase: "UNAVAILABLE", resultsAvailable: false })));
    vi.stubGlobal("fetch", fetchMock);

    render(<PublicElectionDetailPage />);
    expect(await screen.findByText("Próxima")).toBeInTheDocument();
    cleanup();
    render(<PublicElectionDetailPage />);
    expect(await screen.findByText("Votación en curso")).toBeInTheDocument();
    cleanup();
    render(<PublicElectionDetailPage />);
    expect(await screen.findByText("Votación Finalizada")).toBeInTheDocument();
    cleanup();
    render(<PublicElectionDetailPage />);
    expect(await screen.findByText("Próxima")).toBeInTheDocument();
    expect(screen.queryByText("Estado no disponible")).not.toBeInTheDocument();
    cleanup();
    render(<PublicElectionDetailPage />);
    expect(await screen.findByText("Próxima")).toBeInTheDocument();
    expect(screen.queryByText("Elección no disponible públicamente")).not.toBeInTheDocument();
  });

  it("[MX-13][PUB-STA-P1-002][INTEGRACION] presenta votación activa y papeleta para fases sin resultados públicos", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(makePublicElectionResponse({ phase: "ACTIVE", resultsAvailable: false, results: [] })))
      .mockResolvedValueOnce(jsonResponse(makePublicElectionResponse({ phase: "RESULTS", resultsAvailable: false, results: [] })));
    vi.stubGlobal("fetch", fetchMock);

    render(<PublicElectionDetailPage />);
    expect(await screen.findByText("Votación en curso")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Papeleta Electoral" })).toBeInTheDocument();
    cleanup();
    render(<PublicElectionDetailPage />);
    expect(await screen.findByText("Votación Finalizada")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Papeleta Electoral" })).toBeInTheDocument();
    expect(screen.queryByText("Aún no hay resultados disponibles")).not.toBeInTheDocument();
  });

  it("[MX-13][PUB-INF-P0-001][INTEGRACION] renderiza encabezado, cronograma, estado y consulta pública de padrón cuando está habilitada", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(makePublicElectionResponse({ publicEligibilityEnabled: true }))));
    render(<PublicElectionDetailPage />);

    expect(await screen.findByRole("heading", { name: "Elección pública" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Horario de Votación" })).toBeInTheDocument();
    expect(screen.getByText("Votación Finalizada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Consultar mi estado" })).toBeInTheDocument();
  });

  it("[MX-13][PUB-INF-P0-002][INTEGRACION] presenta una alternativa sin candidatos y una candidatura con cargo asociado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          makePublicElectionResponse({
            resultsAvailable: false,
            options: [
              { id: "option-empty", name: "Alternativa pública", color: "#2563eb", candidates: [] },
              {
                id: "option-role",
                name: "Frente con candidatura",
                color: "#059669",
                candidates: [{ id: "candidate-1", name: "Carla Pública", roleName: "Presidencia" }],
              },
            ],
          }),
        ),
      ),
    );
    render(<PublicElectionDetailPage />);

    expect(await screen.findByRole("heading", { name: "Alternativa pública" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frente con candidatura" })).toBeInTheDocument();
    expect(screen.getByText("Carla Pública")).toBeInTheDocument();
    expect(screen.getByText("Presidencia")).toBeInTheDocument();
  });

  it("[MX-13][PUB-RES-P0-001][INTEGRACION] muestra la distribución actual y vuelve a la papeleta sin resultados", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          makePublicElectionResponse({
            results: [
              { option: "Frente A", votes: 1 },
              { option: "Frente B", votes: 2 },
              { option: "BLANK", votes: 3 },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(makePublicElectionResponse({ resultsAvailable: false, results: [] })),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<PublicElectionDetailPage />);

    expect(await screen.findByRole("heading", { name: "Distribución de Votos" })).toBeInTheDocument();
    expect(screen.getByText("16.67%")).toBeInTheDocument();
    expect(screen.getByText("2 votos")).toBeInTheDocument();
    expect(screen.getByText("Votos en Blanco")).toBeInTheDocument();

    cleanup();
    render(<PublicElectionDetailPage />);
    expect(await screen.findByRole("heading", { name: "Papeleta Electoral" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Distribución de Votos" })).not.toBeInTheDocument();
  });
});
