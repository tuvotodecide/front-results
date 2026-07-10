import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  renderStatusPage,
  resetStatusMocks,
} from "./helpers/electionStatusTestUtils";

const openMore = async () => {
  const user = userEvent.setup();
  renderStatusPage();
  await user.click(screen.getByRole("tab", { name: "Mas" }));
  return user;
};

const clickMoreOption = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const button = screen
    .getAllByRole("button")
    .find((item) => item.textContent?.includes(label));

  if (!button) {
    throw new Error("No se encontro la opcion " + label);
  }

  await user.click(button);
};

describe("Election status more menu", () => {
  beforeEach(() => {
    resetStatusMocks();
  });

  it("muestra opciones adicionales en menu Mas y permite cerrar con X y overlay", async () => {
    const user = await openMore();

    expect(screen.getByRole("dialog", { name: "Opciones adicionales" })).toBeInTheDocument();
    expect(screen.getByText("Padron y consulta")).toBeInTheDocument();
    expect(screen.getByText("Uso $TVD")).toBeInTheDocument();
    expect(screen.getByText("Analiticas")).toBeInTheDocument();
    expect(screen.getByText("Enlace publico")).toBeInTheDocument();
    expect(screen.getByText("Verificacion blockchain")).toBeInTheDocument();
    expect(screen.getByText("Punto presencial QR")).toBeInTheDocument();
    expect(screen.getByText("Noticias")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog", { name: "Opciones adicionales" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fechas y estado de la eleccion" })).toBeInTheDocument();
    expect(screen.queryByText("Otras votaciones")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Mas" }));
    await user.click(screen.getByRole("button", { name: "Cerrar opciones adicionales" }));
    expect(screen.queryByRole("dialog", { name: "Opciones adicionales" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fechas y estado de la eleccion" })).toBeInTheDocument();
    expect(screen.queryByText("Otras votaciones")).not.toBeInTheDocument();
  });

  it("selecciona Padron y consulta", async () => {
    const user = await openMore();

    await clickMoreOption(user, "Padron y consulta");

    expect(screen.getByRole("heading", { name: "Padron y participacion" })).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar por carnet")).toBeInTheDocument();
  });

  it("selecciona Uso $TVD", async () => {
    const user = await openMore();

    await clickMoreOption(user, "Uso $TVD");

    expect(screen.getByRole("heading", { name: "Uso $TVD" })).toBeInTheDocument();
    expect(screen.getByText("Reservado")).toBeInTheDocument();
  });

  it("selecciona Analiticas", async () => {
    const user = await openMore();

    await clickMoreOption(user, "Analiticas");

    expect(screen.getByRole("heading", { name: "Estadisticas" })).toBeInTheDocument();
    expect(screen.getByText("Participacion")).toBeInTheDocument();
  });

  it("selecciona Enlace publico, Punto presencial QR, Blockchain y Noticias", async () => {
    let user = await openMore();

    await clickMoreOption(user, "Enlace publico");
    expect(screen.getByRole("heading", { name: /Enlace p.blico/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Enlace p.blico/i }).closest("section")?.querySelector(".max-w-md"),
    ).not.toBeNull();
    expect(screen.getByRole("button", { name: "Copiar enlace" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Abrir votaci.n p.blica/i })).toBeInTheDocument();

    user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Mas" }));
    await clickMoreOption(user, "Punto presencial QR");
    expect(screen.getByRole("heading", { name: "Punto presencial QR" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Punto presencial QR" }).closest("section")?.querySelector(".max-w-xl"),
    ).not.toBeNull();
    expect(screen.getByRole("button", { name: "Abrir punto QR" })).toBeInTheDocument();

    user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Mas" }));
    await clickMoreOption(user, "Verificacion blockchain");
    expect(screen.getByRole("heading", { name: "Integridad verificable" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contrato inteligente publico" })).toBeInTheDocument();

    user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Mas" }));
    await clickMoreOption(user, "Noticias");
    expect(screen.getByRole("heading", { name: "Noticias" })).toBeInTheDocument();
    expect(screen.getByText(/Crea una noticia o comunicado/i)).toBeInTheDocument();
  });
});
