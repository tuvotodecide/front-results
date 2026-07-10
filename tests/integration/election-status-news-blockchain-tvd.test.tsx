import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  renderStatusPage,
  resetStatusMocks,
  statusMocks,
} from "./helpers/electionStatusTestUtils";

const openMoreOption = async (label: string) => {
  const user = userEvent.setup();
  renderStatusPage();
  await user.click(screen.getByRole("tab", { name: "Mas" }));
  const button = screen
    .getAllByRole("button")
    .find((item) => item.textContent?.includes(label));
  if (!button) {
    throw new Error("No se encontro la opcion " + label);
  }
  await user.click(button);
  return user;
};

describe("Election status news, blockchain and TVD usage", () => {
  beforeEach(() => {
    resetStatusMocks();
  });

  it("muestra y copia enlace publico con fallback relativo", async () => {
    const user = await openMoreOption("Enlace publico");

    expect(screen.queryByDisplayValue("http://localhost:3000/votacion/elecciones/evt-status/publica")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copiar enlace" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Abrir votaci.n p.blica/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copiar enlace" }));
    expect(screen.getByText("Enlace copiado.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Abrir votaci.n p.blica/i }));
    expect(statusMocks.open).toHaveBeenCalledWith(
      "http://localhost:3000/votacion/elecciones/evt-status/publica",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("muestra verificacion blockchain y permite copiar ID", async () => {
    const user = await openMoreOption("Verificacion blockchain");

    expect(screen.getByRole("heading", { name: "Integridad verificable" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contrato inteligente publico" })).toBeInTheDocument();
    expect(screen.getByText(/Manual rapido en BaseScan/i)).toBeInTheDocument();
    expect(screen.getByText(/Contract > Read Contract/i)).toBeInTheDocument();
    expect(screen.getByText("getVoteInfo").tagName).toBe("STRONG");
    expect(screen.getByText("getVoteResults").tagName).toBe("STRONG");
    expect(screen.getByRole("link", { name: "Ver contrato inteligente" })).toHaveAttribute(
      "href",
      "https://basescan.org/address/0xcontract",
    );

    await user.click(screen.getByRole("button", { name: "Copiar ID" }));
    expect(screen.getByText("ID copiado.")).toBeInTheDocument();
  });

  it("renderiza formulario embebido de noticias y llama la mutation mock", async () => {
    const user = await openMoreOption("Noticias");

    await user.type(screen.getByLabelText("Título"), "Comunicado oficial");
    await user.type(screen.getByLabelText("Descripción"), "Los resultados ya estan disponibles.");
    await user.type(screen.getByLabelText("Enlace opcional"), "https://example.com/resultados");
    await user.type(screen.getByLabelText("URL de imagen (opcional)"), "https://example.com/imagen.png");
    await user.click(screen.getByRole("button", { name: "Publicar noticia" }));

    expect(statusMocks.createEventNews).toHaveBeenCalledWith({
      eventId: "evt-status",
      data: {
        title: "Comunicado oficial",
        body: "Los resultados ya estan disponibles.",
        link: "https://example.com/resultados",
        imageUrl: "https://example.com/imagen.png",
      },
    });
    expect(screen.getByText(/Noticia publicada correctamente/i)).toBeInTheDocument();
  });

  it("muestra Uso $TVD mock, valores en Bs, expande operaciones, copia txHash y expone explorer", async () => {
    const user = await openMoreOption("Uso $TVD");

    expect(screen.getByText("500 $TVD")).toBeInTheDocument();
    expect(screen.getByText("500 Bs")).toBeInTheDocument();
    expect(screen.getByText("320 $TVD")).toBeInTheDocument();
    expect(screen.getByText("320 Bs")).toBeInTheDocument();
    expect(screen.getByText("180 $TVD")).toBeInTheDocument();
    expect(screen.getByText("180 Bs")).toBeInTheDocument();
    expect(screen.getByText("Liquidada")).toBeInTheDocument();

    const operationsButton = screen.getByRole("button", { name: /Operaciones asociadas/i });
    expect(operationsButton).not.toHaveTextContent("+");
    expect(operationsButton).not.toHaveTextContent(">");
    expect(operationsButton.querySelector("svg")).not.toBeNull();
    await user.click(operationsButton);

    expect(screen.getByText("Reserva")).toBeInTheDocument();
    expect(screen.getByText("Consumo por voto")).toBeInTheDocument();
    expect(screen.getByText("Liquidacion")).toBeInTheDocument();
    expect(screen.getAllByText("Confirmada").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "C" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "E" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copiar txHash Reserva/i })).toHaveTextContent("Copiar");
    expect(screen.getByRole("link", { name: /Abrir explorer Reserva/i })).toHaveTextContent("Explorer");

    await user.click(screen.getByRole("button", { name: /Copiar txHash Reserva/i }));
    expect(screen.getByText("txHash copiado.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir explorer Reserva/i })).toHaveAttribute(
      "href",
      "https://basescan.org/tx/0xreserve1234567890abcdef",
    );
  });
});
