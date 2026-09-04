import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VotacionPublicLandingPage from "@/domains/votacion/screens/VotacionPublicLandingPage";
import PastElectionsPage from "@/domains/votacion/screens/PastElectionsPage";
import PublicElectionDetailPage from "@/domains/votacion/screens/PublicElectionDetailPage";
import VotacionPublicShell from "@/domains/votacion/layout/VotacionPublicShell";
import { PublicElectionRepositoryApi } from "@/features/publicElectionDetail/data/PublicElectionRepository.api";
import { PublicLandingRepositoryApi } from "@/features/publicLanding/data/PublicLandingRepository.api";
import {
  jsonResponse,
  makePublicElectionResponse,
  matrix13LandingData,
} from "../fixtures/matrix-13-public";
import { renderWithAuthStore } from "../utils/renderWithStore";

const publicHarness = vi.hoisted(() => ({
  landing: vi.fn(),
  pastElections: vi.fn(),
  navigate: vi.fn(),
  params: { electionId: "evt-publico" as string | undefined },
}));

vi.mock("@/features/publicLanding/data/usePublicLandingRepository", () => ({
  useLandingData: () => publicHarness.landing(),
  usePastElections: () => publicHarness.pastElections(),
}));

vi.mock("@/domains/votacion/navigation/compat", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>{children}</a>
  ),
  useNavigate: () => publicHarness.navigate,
  useParams: () => publicHarness.params,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/votacion",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: ReactNode;
  }) => <a href={href} {...props}>{children}</a>,
}));

const landingResponse = {
  active: [
    {
      id: "active-1",
      name: "Elección activa",
      objective: "Institución activa",
      votingStart: "2026-08-01T08:00:00.000Z",
      votingEnd: "2026-08-01T18:00:00.000Z",
    },
  ],
  upcoming: [
    {
      id: "upcoming-1",
      name: "Elección próxima",
      objective: "Institución próxima",
      votingStart: "2026-08-02T08:00:00.000Z",
      votingEnd: "2026-08-02T18:00:00.000Z",
    },
  ],
  results: [
    {
      id: "results-1",
      name: "Elección finalizada",
      objective: "Institución finalizada",
      votingStart: "2026-07-01T08:00:00.000Z",
      votingEnd: "2026-07-01T18:00:00.000Z",
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.clearAllMocks();
  publicHarness.params.electionId = "evt-publico";
  publicHarness.landing.mockReturnValue({
    data: matrix13LandingData,
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
  publicHarness.pastElections.mockReturnValue({
    elections: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe("MX-13 | landing y detalle público", () => {
  it("[MX-13][PUB-LND-P0-001][UNITARIA] renderiza hero, beneficios, confianza, pasos y contacto para un visitante sin sesión", () => {
    render(<VotacionPublicLandingPage />);

    expect(screen.getByRole("heading", { name: /Elecciones públicas/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Beneficios públicos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Confianza pública" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cómo consultar" })).toBeInTheDocument();
    screen.getAllByRole("link", { name: "Registrarme" }).forEach((link) => {
      expect(link).toHaveAttribute("href", "/votacion/registrarse");
    });
    expect(screen.getByText("publico@tvd.test")).toBeInTheDocument();

    cleanup();
    publicHarness.landing.mockReturnValue({
      data: null,
      loading: false,
      error: new Error("fallo controlado"),
      refetch: vi.fn(),
    });
    render(<VotacionPublicLandingPage />);

    expect(screen.getByRole("heading", { name: "Error al cargar" })).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo cargar la información. Por favor, intenta de nuevo más tarde."),
    ).toBeInTheDocument();
  });

  it("[MX-13][PUB-LST-P0-002][UNITARIA] transforma próximas, activas y finalizadas y destaca primero la activa", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(landingResponse)));
    const repository = new PublicLandingRepositoryApi();
    const result = await repository.getActiveElections();

    expect(result.featured).toEqual(
      expect.objectContaining({ id: "active-1", status: "ACTIVA", isFeatured: true }),
    );
    expect(result.others).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "upcoming-1", status: "PROXIMA" }),
        expect.objectContaining({ id: "results-1", status: "FINALIZADA" }),
      ]),
    );
  });

  it("[MX-13][PUB-LST-P1-003][UNITARIA] filtra por título u organización y abre la tarjeta con teclado", async () => {
    const user = userEvent.setup();
    publicHarness.pastElections.mockReturnValue({
      elections: [
        {
          id: "past-1",
          title: "Elección municipal",
          organization: "Gobierno local",
          status: "FINALIZADA",
          isFeatured: false,
        },
        {
          id: "past-2",
          title: "Elección universitaria",
          organization: "Universidad pública",
          status: "PROXIMA",
          isFeatured: false,
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<PastElectionsPage />);
    await user.type(screen.getByLabelText("Buscar elección"), "universidad");

    expect(screen.getByText("Elección universitaria")).toBeInTheDocument();
    expect(screen.queryByText("Elección municipal")).not.toBeInTheDocument();

    screen.getByRole("button", { name: /Elección universitaria/i }).focus();
    await user.keyboard("{Enter}");
    expect(publicHarness.navigate).toHaveBeenCalledWith(
      "/votacion/elecciones/past-2/publica",
    );
  });

  it("[MX-13][PUB-ACC-P0-001][UNITARIA] conserva el shell de votación como público sin requerir token", () => {
    renderWithAuthStore(
      <VotacionPublicShell>
        <h1>Contenido público de votación</h1>
      </VotacionPublicShell>,
    );

    expect(screen.getByRole("main").parentElement).toHaveAttribute("data-access", "public");
    expect(
      screen.getByRole("heading", { name: "Contenido público de votación" }),
    ).toBeInTheDocument();
  });

  it("[MX-13][PUB-ACC-P0-002][UNITARIA] informa ID inválido y conserva el regreso público", async () => {
    const user = userEvent.setup();
    publicHarness.params.electionId = undefined;
    render(<PublicElectionDetailPage />);

    expect(await screen.findByText("ID de elección no válido")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver al inicio" }));
    expect(publicHarness.navigate).toHaveBeenCalledWith("/votacion");
  });

  it("[MX-13][PUB-STA-P0-001][UNITARIA] mapea fases UPCOMING, ACTIVE y RESULTS a estados públicos", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(makePublicElectionResponse({ phase: "UPCOMING" })))
      .mockResolvedValueOnce(jsonResponse(makePublicElectionResponse({ phase: "ACTIVE" })))
      .mockResolvedValueOnce(jsonResponse(makePublicElectionResponse({ phase: "RESULTS" })));
    vi.stubGlobal("fetch", fetchMock);
    const repository = new PublicElectionRepositoryApi();

    await expect(repository.getPublicElectionDetail("upcoming")).resolves.toEqual(
      expect.objectContaining({ status: "UPCOMING" }),
    );
    await expect(repository.getPublicElectionDetail("active")).resolves.toEqual(
      expect.objectContaining({ status: "LIVE" }),
    );
    await expect(repository.getPublicElectionDetail("results")).resolves.toEqual(
      expect.objectContaining({ status: "FINISHED" }),
    );
  });

  it("[MX-13][PUB-STA-P1-002][UNITARIA] muestra la votación activa y la papeleta finalizada sin resultados", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(makePublicElectionResponse({ phase: "ACTIVE", resultsAvailable: false, results: [] })),
      )
      .mockResolvedValueOnce(
        jsonResponse(makePublicElectionResponse({ phase: "RESULTS", resultsAvailable: false, results: [] })),
      );
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

  it("[MX-13][PUB-INF-P0-001][UNITARIA] limita el detalle a nombre, objetivo, fechas, estado y consulta pública", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          makePublicElectionResponse({
            wallet: "0xprivate",
            administrators: [{ email: "admin@private.test" }],
            privateKey: "private-key",
          }),
        ),
      ),
    );
    const repository = new PublicElectionRepositoryApi();
    const detail = await repository.getPublicElectionDetail("evt-publico");

    expect(detail).toEqual(
      expect.objectContaining({
        title: "Elección pública",
        subtitle: "Institución pública",
        status: "FINISHED",
        publicEligibilityEnabled: true,
      }),
    );
    expect(detail).not.toHaveProperty("wallet");
    expect(detail).not.toHaveProperty("administrators");
    expect(detail).not.toHaveProperty("privateKey");
  });

  it("[MX-13][PUB-INF-P0-002][UNITARIA] presenta opciones de referéndum y candidaturas con su cargo visible", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          makePublicElectionResponse({
            isReferendum: true,
            objective: "¿Aprueba el reglamento?",
            resultsAvailable: false,
            results: [],
            options: [{ id: "yes", name: "Sí", color: "#2563eb", candidates: [] }],
          }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          makePublicElectionResponse({
            resultsAvailable: false,
            results: [],
            options: [
              {
                id: "option-role",
                name: "Frente con candidatura",
                color: "#059669",
                candidates: [{ id: "candidate-1", name: "Carla Pública", roleName: "Presidencia" }],
              },
            ],
          }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<PublicElectionDetailPage />);

    expect(await screen.findByText("Referéndum")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "¿Aprueba el reglamento?" })).toBeInTheDocument();
    expect(screen.getByText("Opción 1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sí" })).toBeInTheDocument();

    cleanup();
    render(<PublicElectionDetailPage />);
    expect(await screen.findByRole("heading", { name: "Frente con candidatura" })).toBeInTheDocument();
    expect(screen.getByText("Carla Pública")).toBeInTheDocument();
    expect(screen.getByText("Presidencia")).toBeInTheDocument();
  });

  it("[MX-13][PUB-RES-P0-001][UNITARIA] calcula distribución pública, blancos y porcentaje con dos decimales", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          makePublicElectionResponse({
            results: [
              { option: "Frente A", votes: 1 },
              { option: "Frente B", votes: 2 },
              { option: "BLANK", votes: 3 },
            ],
          }),
        ),
      ),
    );
    const repository = new PublicElectionRepositoryApi();
    const detail = await repository.getPublicElectionDetail("evt-resultados");

    expect(detail?.results).toEqual(
      expect.objectContaining({
        totalVotes: 6,
        candidates: expect.arrayContaining([
          expect.objectContaining({ party: "Frente A", votes: 1, percent: 16.67 }),
          expect.objectContaining({ party: "Frente B", votes: 2, percent: 33.33 }),
          expect.objectContaining({ id: "blank", votes: 3, percent: 50 }),
        ]),
      }),
    );
  });

  it("[MX-13][PUB-RES-P0-002][UNITARIA] muestra empate sin convertir votos blancos en ganador oficial", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          makePublicElectionResponse({
            results: [
              { option: "Frente A", votes: 20 },
              { option: "Frente B", votes: 20 },
              { option: "BLANK", votes: 25 },
            ],
          }),
        ),
      ),
    );
    render(<PublicElectionDetailPage />);

    expect(await screen.findByText("EMPATE")).toBeInTheDocument();
    expect(screen.getByText("Candidaturas empatadas:")).toBeInTheDocument();
    expect(screen.queryByText("GANADOR")).not.toBeInTheDocument();
  });
});
