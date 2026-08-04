import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ImagesSection from "@/domains/resultados/components/ImagesSection";
import TablesSection from "@/domains/resultados/components/TablesSection";
import PublicElectionDetailPage from "@/domains/votacion/screens/PublicElectionDetailPage";
import { PublicElectionRepositoryApi } from "@/features/publicElectionDetail/data/PublicElectionRepository.api";
import useAutoRefreshTick from "@/hooks/useAutoRefreshTick";
import {
  getResultsLabels,
  type ResultsElectionType,
} from "@/legacy/resultados/resultsLabels";
import {
  FIVE_MINUTES_MS,
  isElectionInAutoRefreshWindow,
} from "@/utils/electionAutoRefreshWindow";
import { buildGeneralResultsLink } from "@/utils/resultsGeneralLink";
import { buildResultsTableLink } from "@/utils/resultsTableLink";
import {
  jsonResponse,
  makePublicElectionResponse,
  matrix13PublicBallot as publicBallot,
} from "../fixtures/matrix-13-public";

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
  default: () => ({
    election: {
      type: new URLSearchParams(window.location.search).get("electionType") ?? resultsHarness.electionType,
    },
  }),
}));

vi.mock("@/domains/resultados/hooks/useElectionId", () => ({
  default: () => new URLSearchParams(window.location.search).get("electionId") ?? resultsHarness.electionId,
}));

vi.mock("@/domains/votacion/navigation/compat", () => ({
  useNavigate: () => resultsHarness.navigate,
  useParams: () => resultsHarness.params,
}));

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("MX-13 | territorio, mesa, acta y seguridad pública", () => {
  it("[MX-13][PUB-CAT-P1-003][UNITARIA] reconoce las categorías actuales y usa el fallback presidencial para aliases no soportados", () => {
    const publicCategory = (category: string) =>
      getResultsLabels(category as ResultsElectionType);

    expect(getResultsLabels("presidential")).toEqual({
      primary: "Resultados Presidenciales",
      secondary: "Resultados Diputados",
    });
    expect(publicCategory("deputies")).toEqual({
      primary: "Resultados Presidenciales",
      secondary: "Resultados Diputados",
    });
    expect(getResultsLabels("departamental")).toEqual({
      primary: "Resultados Gobernador",
      secondary: "Resultados Asambleísta por Territorio",
    });
    expect(publicCategory("governor")).toEqual({
      primary: "Resultados Gobernador",
      secondary: "Resultados Asambleísta por Territorio",
    });
    expect(getResultsLabels("municipal")).toEqual({
      primary: "Resultados Alcalde",
      secondary: "Resultados Concejales",
    });
    expect(publicCategory("mayor")).toEqual({
      primary: "Resultados Alcalde",
      secondary: "Resultados Concejales",
    });
    expect(publicCategory("assembly")).toEqual({
      primary: "Resultados Presidenciales",
      secondary: "Resultados Diputados",
    });
    expect(publicCategory("council")).toEqual({
      primary: "Resultados Presidenciales",
      secondary: "Resultados Diputados",
    });
    expect(getResultsLabels(null)).toEqual({
      primary: "Resultados Presidenciales",
      secondary: "Resultados Diputados",
    });
  });

  it("[MX-13][PUB-TER-P0-001][UNITARIA] conserva los filtros territoriales que el helper público reconoce actualmente", () => {
    const publicScope = {
      electionId: "evt-publico",
      electionType: "municipal",
      departmentId: "dep-1",
      provinceId: "prov-1",
      municipalityId: "mun-1",
      electoralSeatId: "seat-1",
      electoralLocationId: "location-1",
    };

    expect(buildGeneralResultsLink(publicScope)).toBe(
      "/resultados?electionId=evt-publico&electionType=municipal&department=dep-1&municipality=mun-1",
    );
  });

  it("[MX-13][PUB-MES-P0-002][UNITARIA] abre una mesa por código y conserva elección y tipo actuales", () => {
    const publicScope = {
      electionId: "evt-publico",
      electionType: "municipal",
      departmentId: "dep-1",
      provinceId: "prov-1",
      municipalityId: "mun-1",
      electoralSeatId: "seat-1",
      electoralLocationId: "location-1",
    };

    expect(buildResultsTableLink("MESA-12", publicScope)).toBe(
      "/resultados/mesa/MESA-12?electionId=evt-publico&electionType=municipal",
    );
  });

  it("[MX-13][PUB-ACT-P0-003][UNITARIA] muestra la imagen pública y enlaza su detalle con el contexto de la elección", () => {
    render(
      <ImagesSection
        images={[publicBallot]}
        electionId="evt-publico"
        electionType="municipal"
      />,
    );

    expect(screen.getByRole("img", { name: "Vista previa de hoja de trabajo electoral" })).toHaveAttribute(
      "src",
      "https://ipfs.io/ipfs/public-image",
    );
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Detalles" })).toHaveAttribute(
      "href",
      "/resultados/imagen/ballot-publico?electionId=evt-publico&electionType=municipal",
    );
  });

  it("[MX-13][PUB-CAS-P0-004][UNITARIA] diferencia la versión más apoyada y presenta apoyos de usuarios y jurados", () => {
    render(
      <ImagesSection
        images={[publicBallot]}
        mostSupportedBallot={{ ballotId: "ballot-publico", version: 2, supportCount: 8, totalAttestations: 10 }}
        attestationCases={[
          {
            ballotId: "ballot-publico",
            version: 2,
            location: publicBallot.location,
            supports: { users: 5, juries: 3 },
          },
        ]}
      />,
    );

    expect(screen.getByText("Mas apoyada")).toBeInTheDocument();
    expect(screen.getByText("Usuarios")).toBeInTheDocument();
    expect(screen.getByText("Jurados")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("[MX-13][PUB-FIL-P1-001][UNITARIA] preserva los filtros públicos recibidos sin inventar alcance administrativo", () => {
    const publicScope = {
      electionId: "evt-publico",
      electionType: "municipal",
      departmentId: "dep-1",
      municipalityId: "mun-1",
    };
    const publicResultsHref = buildGeneralResultsLink(publicScope);
    window.history.pushState({}, "", publicResultsHref);

    render(
      <>
        <TablesSection
          tables={[
            {
              _id: "table-1",
              tableNumber: "12",
              tableCode: "MESA-12",
              electoralLocationId: "location-1",
              active: true,
              createdAt: "2026-08-01T00:00:00.000Z",
              updatedAt: "2026-08-01T00:00:00.000Z",
              __v: 0,
            },
          ]}
        />
        <ImagesSection
          images={[publicBallot]}
          electionId={new URLSearchParams(window.location.search).get("electionId") ?? undefined}
          electionType={new URLSearchParams(window.location.search).get("electionType") ?? undefined}
        />
      </>,
    );

    const publicResultsUrl = new URL(publicResultsHref, window.location.origin);
    expect([...publicResultsUrl.searchParams.entries()]).toEqual([
      ["electionId", "evt-publico"],
      ["electionType", "municipal"],
      ["department", "dep-1"],
      ["municipality", "mun-1"],
    ]);

    const tableUrl = new URL(
      screen.getByRole("link", { name: /Mesa 12/i }).getAttribute("href") ?? "",
      window.location.origin,
    );
    expect([...tableUrl.searchParams.entries()]).toEqual([
      ["electionId", "evt-publico"],
      ["electionType", "municipal"],
    ]);

    const imageUrl = new URL(
      screen.getByRole("link", { name: "Detalles" }).getAttribute("href") ?? "",
      window.location.origin,
    );
    expect([...imageUrl.searchParams.entries()]).toEqual([
      ["electionId", "evt-publico"],
      ["electionType", "municipal"],
    ]);
  });

  it("[MX-13][PUB-UPD-P1-002][UNITARIA] actualiza cada cinco minutos dentro de la ventana y omite el tick con la pestaña oculta", () => {
    vi.useFakeTimers();
    const visibilityDescriptor = Object.getOwnPropertyDescriptor(document, "visibilityState");
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    const { result, unmount } = renderHook(() =>
      useAutoRefreshTick({ enabled: true, intervalMs: FIVE_MINUTES_MS, skipWhenUnfocused: true }),
    );

    expect(
      isElectionInAutoRefreshWindow(
        {
          votingStartDate: "2026-08-01T10:00:00.000Z",
          resultsStartDate: "2026-08-01T13:00:00.000Z",
        },
        new Date("2026-08-01T09:00:00.000Z").getTime(),
      ),
    ).toBe(true);
    act(() => vi.advanceTimersByTime(FIVE_MINUTES_MS));
    expect(result.current).toBe(1);

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    act(() => vi.advanceTimersByTime(FIVE_MINUTES_MS));
    expect(result.current).toBe(1);
    unmount();

    if (visibilityDescriptor) {
      Object.defineProperty(document, "visibilityState", visibilityDescriptor);
    }
  });

  it("[MX-13][PUB-CNS-P0-001][UNITARIA] presenta la papeleta actual para una elección finalizada sin resultados publicados", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(makePublicElectionResponse({ resultsAvailable: false, results: [] })),
      ),
    );
    render(<PublicElectionDetailPage />);

    expect(await screen.findByText("Votación Finalizada")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Papeleta Electoral" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frente A" })).toBeInTheDocument();
    expect(screen.queryByText("Distribución de Votos")).not.toBeInTheDocument();
  });

  it("[MX-13][PUB-CNS-P0-002][UNITARIA] conserva valores públicos de cero, empate y partido sin votos sin mezclar otra elección", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          makePublicElectionResponse({
            results: [
              { option: "Frente A", votes: 0 },
              { option: "Frente B", votes: 0 },
              { option: "BLANK", votes: 0 },
            ],
          }),
        ),
      ),
    );
    const repository = new PublicElectionRepositoryApi();
    const detail = await repository.getPublicElectionDetail("evt-sin-votos");

    expect(detail?.id).toBe("evt-publico");
    expect(detail?.results?.totalVotes).toBe(0);
    expect(detail?.results?.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ party: "Frente A", votes: 0, percent: 0 }),
        expect.objectContaining({ party: "Frente B", votes: 0, percent: 0 }),
      ]),
    );
    expect(detail?.winnerCandidateId).toBeNull();
  });

  it("[MX-13][PUB-SEC-P0-001][UNITARIA] muestra los enlaces técnicos actuales junto a la imagen pública", () => {
    render(<ImagesSection images={[publicBallot]} />);

    expect(screen.getByRole("img", { name: "Vista previa de hoja de trabajo electoral" })).toHaveAttribute(
      "src",
      "https://ipfs.io/ipfs/public-image",
    );
    expect(screen.getByRole("link", { name: "NFT" })).toHaveAttribute(
      "href",
      "record-publico",
    );
    expect(screen.getByRole("link", { name: "Metadata" })).toHaveAttribute(
      "href",
      "ipfs://public-metadata",
    );
  });

  it("[MX-13][PUB-SEC-P0-002][UNITARIA] muestra elección no encontrada ante un identificador público inexistente y no deja datos anteriores", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "not found" }, 404)));
    resultsHarness.params.electionId = "inexistente";
    render(<PublicElectionDetailPage />);

    expect(await screen.findByText("Elección no encontrada")).toBeInTheDocument();
    expect(screen.queryByText("Elección pública")).not.toBeInTheDocument();
  });
});
