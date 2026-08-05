import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicElectionDetailPage from "@/domains/votacion/screens/PublicElectionDetailPage";
import { jsonResponse, makePublicElectionResponse } from "../fixtures/matrix-13-public";

const acceptance = vi.hoisted(() => ({
  navigate: vi.fn(),
  params: { electionId: "evt-publico" },
}));

vi.mock("@/domains/votacion/navigation/compat", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => acceptance.navigate,
  useParams: () => acceptance.params,
}));

describe("MX-13 | aceptación de resultados públicos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    acceptance.params.electionId = "evt-publico";
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("[MX-13][PUB-CNS-P0-001][ACEPTACION] abre una elección finalizada sin resultados publicados y vuelve al listado público", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(makePublicElectionResponse({ phase: "RESULTS", resultsAvailable: false, results: [] }))),
    );

    render(<PublicElectionDetailPage />);

    expect(await screen.findByText("Votación Finalizada")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Papeleta Electoral" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Distribución de Votos" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver" }));
    expect(acceptance.navigate).toHaveBeenCalledWith("/votacion");
  });

  it("[MX-13][PUB-CNS-P0-002][ACEPTACION] abre una elección publicada, muestra resultados recibidos y conserva el regreso público", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(makePublicElectionResponse({
        resultsAvailable: true,
        results: [
          { option: "Frente A", votes: 7 },
          { option: "Frente B", votes: 7 },
          { option: "BLANK", votes: 0 },
        ],
      }))),
    );

    render(<PublicElectionDetailPage />);

    const distribution = (await screen.findByRole("heading", { name: "Distribución de Votos" })).parentElement;
    if (!distribution) throw new Error("No se encontró el contenedor de distribución pública.");
    // El bloque de distribución contiene una fila por cada candidatura empatada.
    expect(within(distribution).getAllByText("7 votos")).toHaveLength(2);
    expect(screen.getByText("Votos en Blanco")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver" }));
    expect(acceptance.navigate).toHaveBeenCalledWith("/votacion");
  });
});
