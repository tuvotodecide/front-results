import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  renderStatusPage,
  resetStatusMocks,
  statusMocks,
} from "./helpers/electionStatusTestUtils";

// useClientNow está fijado en 2026-07-01T12:00Z: esta ventana deja la votación ACTIVE.
const makeActiveEvent = () => ({
  ...statusMocks.makeEvent(),
  votingStart: "2026-07-01T08:00:00.000Z",
  votingEnd: "2026-07-01T17:00:00.000Z",
  resultsPublishAt: "2026-07-02T12:00:00.000Z",
  state: "OFFICIALLY_PUBLISHED",
  status: "OFFICIALLY_PUBLISHED",
});

const renderKioskCard = () => {
  const page = renderStatusPage();
  expect(
    screen.getByRole("heading", { name: "Punto presencial QR" }),
  ).toBeInTheDocument();
  return page;
};

const setupClipboardInteraction = () => {
  const user = userEvent.setup();
  const clipboardWriteText = vi
    .spyOn(window.navigator.clipboard, "writeText")
    .mockResolvedValue(undefined);

  return { user, clipboardWriteText };
};

describe("MX-09 | enlace del punto presencial", () => {
  beforeEach(() => {
    resetStatusMocks();
    statusMocks.event = makeActiveEvent();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("[MX-09][KIO-HAB-P1-002][INTEGRACION] abre el punto autorizado y copia su enlace limitado", async () => {
    const { user, clipboardWriteText } = setupClipboardInteraction();
    const page = renderKioskCard();

    await user.click(screen.getByRole("button", { name: "Abrir punto QR" }));
    expect(statusMocks.open).toHaveBeenCalledWith(
      "/votacion/elecciones/evt-status/kiosco?eventName=Elecci%C3%B3n+de+Diputados",
      "_blank",
      "noopener,noreferrer",
    );

    await user.click(screen.getByRole("button", { name: "Copiar enlace QR" }));
    await waitFor(() => {
      expect(statusMocks.createPresentialSession).toHaveBeenCalledWith({
        eventId: "evt-status",
        data: {
          stationId: "kiosco-principal",
          regenerateKioskAccessToken: true,
        },
      });
    });
    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledTimes(1);
    });
    const copied = String(clipboardWriteText.mock.calls[0]?.[0]);
    const url = new URL(copied);
    expect(url.origin).toBe(window.location.origin);
    expect(url.pathname).toBe("/votacion/elecciones/evt-status/kiosco");
    expect(url.searchParams.get("stationId")).toBe("mesa-1");
    expect(url.searchParams.get("kioskToken")).toBe("qr-token");
    expect(url.searchParams.get("eventName")).toBe("Elección de Diputados");
    expect(
      screen.getByText("Enlace del punto presencial copiado."),
    ).toBeInTheDocument();

    page.unmount();
    resetStatusMocks();
    statusMocks.event = {
      ...makeActiveEvent(),
      presentialKioskEnabled: false,
    };
    const disabledPage = renderStatusPage();

    expect(
      screen.queryByRole("heading", { name: "Punto presencial QR" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Abrir punto QR" }),
    ).not.toBeInTheDocument();
    expect(statusMocks.open).not.toHaveBeenCalled();
    expect(statusMocks.createPresentialSession).not.toHaveBeenCalled();
    disabledPage.unmount();
  });

  it("[MX-09][KIO-QR-P0-005][INTEGRACION] muestra el enlace rotado y conserva el error cuando la sesión está reclamada", async () => {
    const { user, clipboardWriteText } = setupClipboardInteraction();
    renderKioskCard();

    await user.click(screen.getByRole("button", { name: "Copiar enlace QR" }));
    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledTimes(1);
    });

    statusMocks.createPresentialSession.mockReturnValueOnce({
      unwrap: vi.fn().mockResolvedValue({
          stationId: "mesa-2",
          kioskAccessToken: "token-rotado",
        }),
    });
    clipboardWriteText.mockClear();
    await user.click(screen.getByRole("button", { name: "Copiar enlace QR" }));
    await waitFor(() => {
      expect(statusMocks.createPresentialSession).toHaveBeenCalledTimes(2);
      expect(clipboardWriteText).toHaveBeenCalledTimes(1);
    });
    const rotatedCopied = String(clipboardWriteText.mock.calls[0]?.[0]);
    const rotatedUrl = new URL(rotatedCopied);
    expect(rotatedUrl.origin).toBe(window.location.origin);
    expect(rotatedUrl.pathname).toBe("/votacion/elecciones/evt-status/kiosco");
    expect(rotatedUrl.searchParams.get("stationId")).toBe("mesa-2");
    expect(rotatedUrl.searchParams.get("kioskToken")).toBe("token-rotado");
    expect(rotatedUrl.searchParams.get("eventName")).toBe("Elección de Diputados");
    expect(rotatedUrl.searchParams.get("kioskToken")).not.toBe("qr-token");

    statusMocks.createPresentialSession.mockReturnValueOnce({
      unwrap: vi.fn().mockRejectedValue({ data: { message: "Hay un votante usando el código" } }),
    });
    await user.click(screen.getByRole("button", { name: "Copiar enlace QR" }));

    expect(
      await screen.findByText("Hay un votante usando el código"),
    ).toBeInTheDocument();
    expect(clipboardWriteText).toHaveBeenCalledTimes(1);
  });

  it("[MX-09][KIO-HAB-P1-002][INTEGRACION] oculta el punto presencial cuando la votación no está activa", async () => {
    // Evento por defecto: votación finalizada con resultados publicados.
    statusMocks.event = statusMocks.makeEvent();
    renderStatusPage();

    expect(
      screen.queryByRole("heading", { name: "Punto presencial QR" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Abrir punto QR" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copiar enlace QR" }),
    ).not.toBeInTheDocument();
  });
});
