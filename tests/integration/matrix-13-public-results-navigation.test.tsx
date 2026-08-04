import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ImagesSection from "@/domains/resultados/components/ImagesSection";
import TablesSection from "@/domains/resultados/components/TablesSection";
import PublicElectionDetailPage from "@/domains/votacion/screens/PublicElectionDetailPage";
import useAutoRefreshTick from "@/hooks/useAutoRefreshTick";
import { FIVE_MINUTES_MS } from "@/utils/electionAutoRefreshWindow";
import { jsonResponse, makePublicElectionResponse, matrix13PublicBallot } from "../fixtures/matrix-13-public";

const resultsHarness = vi.hoisted(() => ({
  electionId: "evt-publico" as string | null,
  electionType: "municipal",
  navigate: vi.fn(),
  params: { electionId: "evt-publico" as string | undefined },
}));

vi.mock("@/domains/resultados/navigation/compat", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

vi.mock("@/domains/resultados/hooks/useElectionConfig", () => ({
  default: () => ({ election: { type: resultsHarness.electionType } }),
}));

vi.mock("@/domains/resultados/hooks/useElectionId", () => ({
  default: () => resultsHarness.electionId,
}));

vi.mock("@/domains/votacion/navigation/compat", () => ({
  useNavigate: () => resultsHarness.navigate,
  useParams: () => resultsHarness.params,
}));

const table = {
  _id: "table-1",
  tableNumber: "12",
  tableCode: "MESA-12",
  electoralLocationId: "location-1",
  active: true,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  __v: 0,
};

const RefreshProbe = () => {
  const tick = useAutoRefreshTick({ enabled: true, intervalMs: FIVE_MINUTES_MS });
  return <output aria-label="tick público">{tick}</output>;
};

beforeEach(() => {
  vi.clearAllMocks();
  resultsHarness.electionId = "evt-publico";
  resultsHarness.electionType = "municipal";
  resultsHarness.params.electionId = "evt-publico";
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("MX-13 | resultados y navegación pública", () => {
  it("[MX-13][PUB-RES-P0-002][INTEGRACION] representa el liderazgo, empate y cero votos con los rótulos actuales", async () => {
    const majorityResponse = makePublicElectionResponse({
      results: [
        { option: "Frente A", votes: 9 },
        { option: "Frente B", votes: 3 },
        { option: "BLANK", votes: 2 },
      ],
    });
    const tieResponse = makePublicElectionResponse({
      results: [
        { option: "Frente A", votes: 4 },
        { option: "Frente B", votes: 4 },
        { option: "BLANK", votes: 1 },
      ],
    });
    const zeroVotesResponse = makePublicElectionResponse({
      results: [
        { option: "Frente A", votes: 0 },
        { option: "Frente B", votes: 0 },
        { option: "BLANK", votes: 0 },
      ],
    });
    expect(majorityResponse).not.toHaveProperty("winnerCandidateId");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(majorityResponse))
      .mockResolvedValueOnce(jsonResponse(tieResponse))
      .mockResolvedValueOnce(jsonResponse(zeroVotesResponse));
    vi.stubGlobal("fetch", fetchMock);

    render(<PublicElectionDetailPage />);
    expect(await screen.findByText("GANADOR")).toBeInTheDocument();
    expect(screen.getAllByText("9 votos")).toHaveLength(2);
    expect(screen.queryByText("GANADOR OFICIAL")).not.toBeInTheDocument();
    cleanup();
    render(<PublicElectionDetailPage />);
    expect(await screen.findByText("EMPATE")).toBeInTheDocument();
    expect(screen.queryByText("GANADOR")).not.toBeInTheDocument();
    expect(screen.queryByText("GANADOR OFICIAL")).not.toBeInTheDocument();
    cleanup();
    render(<PublicElectionDetailPage />);
    expect(await screen.findByText("Distribución de Votos")).toBeInTheDocument();
    expect(screen.getByText("Frente A")).toBeInTheDocument();
    expect(screen.getByText("Frente B")).toBeInTheDocument();
    expect(screen.getAllByText("0 votos")).toHaveLength(2);
    expect(screen.getByText("Votos en Blanco")).toBeInTheDocument();
    expect(screen.queryByText("GANADOR")).not.toBeInTheDocument();
    expect(screen.queryByText("GANADOR OFICIAL")).not.toBeInTheDocument();
  });

  it("[MX-13][PUB-CAT-P1-003][INTEGRACION] actualiza el enlace de mesa cuando cambia la categoría pública de la elección", () => {
    render(<TablesSection tables={[table]} />);
    expect(screen.getByRole("link", { name: /Mesa 12/i })).toHaveAttribute(
      "href",
      "/resultados/mesa/MESA-12?electionId=evt-publico&electionType=municipal",
    );

    cleanup();
    resultsHarness.electionType = "departamental";
    render(<TablesSection tables={[table]} />);
    expect(screen.getByRole("link", { name: /Mesa 12/i })).toHaveAttribute(
      "href",
      "/resultados/mesa/MESA-12?electionId=evt-publico&electionType=departamental",
    );
  });

  it("[MX-13][PUB-TER-P0-001][INTEGRACION] permite abrir resultados públicos con una mesa de otro territorio cuando la elección coincide", async () => {
    const user = userEvent.setup();
    render(<TablesSection tables={[table]} />);

    const mesaLink = screen.getByRole("link", { name: /Mesa 12/i });
    await user.click(mesaLink);
    expect(mesaLink).toHaveAttribute("href", expect.stringContaining("electionId=evt-publico"));
    expect(mesaLink).toHaveAttribute("href", expect.stringContaining("electionType=municipal"));
  });

  it("[MX-13][PUB-MES-P0-002][INTEGRACION] carga una mesa pública y conserva su contexto de elección al abrir el detalle", () => {
    render(<TablesSection tables={[table]} />);

    expect(screen.getByText("MESA-12")).toBeInTheDocument();
    expect(screen.getByText("Procesada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mesa 12/i })).toHaveAttribute(
      "href",
      "/resultados/mesa/MESA-12?electionId=evt-publico&electionType=municipal",
    );
  });

  it("[MX-13][PUB-ACT-P0-003][INTEGRACION] muestra el ballot público y conserva el contexto al acceder a sus detalles", async () => {
    const user = userEvent.setup();
    render(
      <ImagesSection
        images={[matrix13PublicBallot]}
        electionId="evt-publico"
        electionType="municipal"
      />,
    );

    const detailLink = screen.getByRole("link", { name: "Detalles" });
    await user.click(detailLink);
    expect(screen.getByRole("img", { name: "Vista previa de hoja de trabajo electoral" })).toHaveAttribute(
      "src",
      "https://ipfs.io/ipfs/public-image",
    );
    expect(detailLink).toHaveAttribute(
      "href",
      "/resultados/imagen/ballot-publico?electionId=evt-publico&electionType=municipal",
    );
  });

  it("[MX-13][PUB-CAS-P0-004][INTEGRACION] integra versión más apoyada y casos públicos como contexto de la mesa", () => {
    render(
      <ImagesSection
        images={[matrix13PublicBallot]}
        mostSupportedBallot={{ ballotId: "ballot-publico", version: 2, supportCount: 8, totalAttestations: 10 }}
        attestationCases={[
          {
            ballotId: "ballot-publico",
            version: 2,
            location: matrix13PublicBallot.location,
            supports: { users: 5, juries: 3 },
          },
        ]}
      />,
    );

    expect(screen.getByText("Mas apoyada")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("[MX-13][PUB-FIL-P1-001][INTEGRACION] mantiene electionId y electionType al navegar entre resultados, mesa e imagen", () => {
    render(
      <>
        <TablesSection tables={[table]} />
        <ImagesSection images={[matrix13PublicBallot]} electionId="evt-publico" electionType="municipal" />
      </>,
    );

    expect(screen.getByRole("link", { name: /Mesa 12/i })).toHaveAttribute(
      "href",
      expect.stringContaining("electionId=evt-publico&electionType=municipal"),
    );
    expect(screen.getByRole("link", { name: "Detalles" })).toHaveAttribute(
      "href",
      expect.stringContaining("electionId=evt-publico&electionType=municipal"),
    );
  });

  it("[MX-13][PUB-UPD-P1-002][INTEGRACION] reconsulta la vista al recibir un tick de actualización pública", () => {
    vi.useFakeTimers();
    render(<RefreshProbe />);

    expect(screen.getByLabelText("tick público")).toHaveTextContent("0");
    act(() => vi.advanceTimersByTime(FIVE_MINUTES_MS));
    expect(screen.getByLabelText("tick público")).toHaveTextContent("1");
  });

  it("[MX-13][PUB-SEC-P0-001][INTEGRACION] renderiza solo datos públicos cuando el detalle HTTP trae campos administrativos adicionales", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        makePublicElectionResponse({
          dni: "12345678",
          phone: "70000000",
          wallet: "0xsecret",
          token: "token-interno",
          administrators: [{ email: "admin@private.test" }],
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<PublicElectionDetailPage />);

    expect(await screen.findByRole("heading", { name: "Elección pública" })).toBeInTheDocument();
    expect(screen.queryByText("12345678")).not.toBeInTheDocument();
    expect(screen.queryByText("70000000")).not.toBeInTheDocument();
    expect(screen.queryByText("0xsecret")).not.toBeInTheDocument();
    expect(screen.queryByText("token-interno")).not.toBeInTheDocument();
    expect(screen.queryByText("admin@private.test")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [detailRequest, detailInit] = fetchMock.mock.calls[0]!;
    expect(new URL(String(detailRequest)).pathname).toBe(
      "/api/v1/voting/events/public/detail/evt-publico",
    );
    expect(detailInit).toEqual({ method: "GET", headers: { Accept: "application/json" } });
  });
});
