import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  renderStatusPage,
  resetStatusMocks,
  statusMocks,
} from "./helpers/electionStatusTestUtils";

describe("Election status redesign", () => {
  beforeEach(() => {
    resetStatusMocks();
  });

  it("renderiza header, estado contextual y copia el enlace publico", async () => {
    const user = userEvent.setup();
    renderStatusPage();

    expect(screen.getByRole("heading", { name: "Elección de Diputados" })).toBeInTheDocument();
    expect(screen.getAllByText("Resultados oficiales publicados").length).toBeGreaterThan(0);
    expect(screen.getByText(/La votacion finalizo/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Copiar enlace publico/i }));

    expect(screen.getByText("Enlace copiado.")).toBeInTheDocument();
  });

  it("renderiza tabs principales limpias y cambia entre Fechas, Resultados, Papeleta y Mas", async () => {
    const user = userEvent.setup();
    renderStatusPage();

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Fechas",
      "Resultados",
      "Papeleta",
      "Mas",
    ]);
    expect(screen.getByTestId("more-tab-indicator")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Fechas" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.queryByRole("tab", { name: /Padron/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Uso \$TVD/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Analiticas/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Noticias/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Otras votaciones")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Resultados" }));
    expect(screen.getByRole("heading", { name: "Resultados oficiales" })).toBeInTheDocument();
    expect(screen.getByText("Opcion ganadora")).toBeInTheDocument();
    expect(screen.getAllByText("Partido Verde").length).toBeGreaterThan(0);
    expect(screen.getByText("Total votos validos")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ver resultados/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Papeleta" }));
    expect(screen.getByRole("heading", { name: "Papeleta y opciones" })).toBeInTheDocument();
    expect(screen.getByText("Elige a tu candidato")).toBeInTheDocument();
    expect(screen.getAllByText("Partido Verde").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("tab", { name: "Mas" }));
    expect(screen.getByRole("dialog", { name: "Opciones adicionales" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Papeleta y opciones" })).toBeInTheDocument();
  });

  it("muestra las cards de Fechas con inicio, cierre y publicacion de resultados sin duplicar Estado", () => {
    renderStatusPage();

    expect(screen.getByRole("heading", { name: "Fechas y estado de la eleccion" })).toBeInTheDocument();
    const datesPanel = screen.getByRole("heading", { name: "Fechas y estado de la eleccion" }).closest("section");
    expect(datesPanel).not.toBeNull();
    expect(screen.getByText("Inicio de votacion")).toBeInTheDocument();
    expect(screen.getByText("Cierre de votacion")).toBeInTheDocument();
    expect(within(datesPanel as HTMLElement).queryByText("Estado")).not.toBeInTheDocument();
    expect(screen.getByText("Publicacion de resultados")).toBeInTheDocument();
    expect(screen.getAllByText(/29\/06\/2026/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/30\/06\/2026/i)).toBeInTheDocument();
  });

  it("muestra estado vacio si no hay resultados y no rompe si faltan opciones", async () => {
    const user = userEvent.setup();
    statusMocks.results = undefined;
    statusMocks.publicElection = {
      ...statusMocks.makePublicElection(),
      results: null,
      winnerCandidateId: null,
    };
    statusMocks.options = [];

    renderStatusPage();

    await user.click(screen.getByRole("tab", { name: "Resultados" }));
    expect(
      await screen.findByText("No hay resultados oficiales para mostrar."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Abrir resultados públicos" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Papeleta" }));
    const ballot = screen.getByRole("heading", { name: "Papeleta y opciones" }).closest("section");
    expect(ballot).not.toBeNull();
    expect(within(ballot as HTMLElement).getByText("No hay planchas configuradas")).toBeInTheDocument();
  });

  it("usa los resultados públicos de la misma elección cuando el endpoint admin no trae roles", async () => {
    const user = userEvent.setup();
    statusMocks.electionId = "6a4c4bd9bb73e30696062568";
    statusMocks.event = {
      ...statusMocks.makeEvent(),
      id: "6a4c4bd9bb73e30696062568",
      publicUrl: "/votacion/elecciones/6a4c4bd9bb73e30696062568/publica",
    };
    statusMocks.results = statusMocks.makeEmptyResults();
    statusMocks.publicElection = {
      ...statusMocks.makePublicElection(),
      id: "6a4c4bd9bb73e30696062568",
    };

    renderStatusPage();

    await user.click(screen.getByRole("tab", { name: "Resultados" }));

    expect(
      await screen.findByRole("heading", { name: "Resultados oficiales" }),
    ).toBeInTheDocument();
    expect(statusMocks.getPublicElectionDetail).toHaveBeenCalledWith(
      "6a4c4bd9bb73e30696062568",
    );
    expect(screen.getByText("Opcion ganadora")).toBeInTheDocument();
    expect(screen.getAllByText("Partido Verde").length).toBeGreaterThan(0);
    expect(screen.getByText(/72.28% de los votos - 73 votos/i)).toBeInTheDocument();
    expect(screen.getByText("Votos en blanco")).toBeInTheDocument();
    expect(
      screen.queryByText("No hay resultados oficiales para mostrar."),
    ).not.toBeInTheDocument();
  });
});
