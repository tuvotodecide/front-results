import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  renderStatusPage,
  resetStatusMocks,
  statusMocks,
} from "./helpers/electionStatusTestUtils";

const openMoreOption = async (name: RegExp) => {
  const user = userEvent.setup();
  renderStatusPage();
  await user.click(screen.getByRole("tab", { name: "Mas" }));
  const button = screen
    .getAllByRole("button")
    .find((item) => name.test(item.textContent ?? ""));
  if (!button) {
    throw new Error("No se encontro la opcion " + String(name));
  }
  await user.click(button);
  return user;
};

describe("Election status padron and analytics", () => {
  beforeEach(() => {
    resetStatusMocks();
  });

  it("filtra padron en vivo por carnet, sin boton Consultar, y muestra participacion", async () => {
    const user = await openMoreOption(/Padron y consulta/i);

    expect(screen.getByRole("columnheader", { name: "Carnet" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Habilitado" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Estado" })).toBeInTheDocument();
    expect(screen.getByText("1234567")).toBeInTheDocument();
    expect(screen.getByText("7654321")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Consultar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Verificación manual" })).not.toBeInTheDocument();
    expect(screen.queryByText("Total")).not.toBeInTheDocument();
    expect(screen.queryByText("Observaciones")).not.toBeInTheDocument();
    expect(screen.getAllByText("Votó").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No votó").length).toBeGreaterThan(0);

    await user.type(screen.getByLabelText("Buscar por carnet"), "7654321");

    expect(screen.getByText("7654321")).toBeInTheDocument();
    expect(screen.queryByText("1234567")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Buscar por carnet"));
    await user.type(screen.getByLabelText("Buscar por carnet"), "0000000");

    expect(screen.getByText(/No hay coincidencias/i)).toBeInTheDocument();
  });

  it("mantiene descarga PDF del padron", async () => {
    const user = await openMoreOption(/Padron y consulta/i);

    await user.click(screen.getByRole("button", { name: "Descargar PDF" }));

    expect(statusMocks.downloadPadronPdf).toHaveBeenCalledWith({
      eventId: "evt-status",
      padronVersionId: "padron-1",
    });
  });

  it("muestra estadisticas reutilizando datos mockeados del hook", async () => {
    const user = await openMoreOption(/Analiticas/i);

    expect(screen.getByText("Habilitados")).toBeInTheDocument();
    expect(screen.getAllByText("Participaron").length).toBeGreaterThan(0);
    expect(screen.getByText("Ausentismo")).toBeInTheDocument();
    expect(screen.getByText("Participacion")).toBeInTheDocument();
    expect(screen.getAllByText("66.7%").length).toBeGreaterThan(0);
    expect(screen.getByText("Resultados publicados")).toBeInTheDocument();

    const analyticsPanel = screen.getByRole("heading", { name: "Estadisticas" }).closest("section");
    expect(analyticsPanel).not.toBeNull();
    const reportButton = screen.getByRole("button", { name: "Descargar reporte" });
    expect((analyticsPanel as HTMLElement).lastElementChild).toContainElement(reportButton);

    await user.click(screen.getByRole("button", { name: "Descargar reporte" }));

    expect(screen.getByRole("dialog")).toHaveTextContent(/Reporte de participaci.n/i);
  });
});
