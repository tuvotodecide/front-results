import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  renderStatusPage,
  resetStatusMocks,
  statusMocks,
} from "./helpers/electionStatusTestUtils";

const openKioskPanel = async (user: ReturnType<typeof userEvent.setup>) => {
  const page = renderStatusPage();
  await user.click(screen.getByRole("tab", { name: "Mas" }));
  const kioskOption = screen
    .getAllByRole("button")
    .find((button) => button.textContent?.includes("Punto presencial QR"));
  if (!kioskOption) {
    throw new Error("No se encontró la opción del punto presencial.");
  }
  await user.click(kioskOption);
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
    statusMocks.event = statusMocks.makeEvent();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("[MX-09][KIO-HAB-P1-002][INTEGRACION] abre el punto autorizado y copia su enlace limitado", async () => {
    const { user, clipboardWriteText } = setupClipboardInteraction();
    const page = await openKioskPanel(user);

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
      ...statusMocks.makeEvent(),
      presentialKioskEnabled: false,
    };
    const disabledPage = renderStatusPage();
    await user.click(screen.getByRole("tab", { name: "Mas" }));

    expect(
      screen.queryByRole("button", { name: "Punto presencial QR" }),
    ).not.toBeInTheDocument();
    expect(statusMocks.open).not.toHaveBeenCalled();
    expect(statusMocks.createPresentialSession).not.toHaveBeenCalled();
    disabledPage.unmount();
  });

  it("[MX-09][KIO-QR-P0-005][INTEGRACION] muestra el enlace rotado y conserva el error cuando la sesión está reclamada", async () => {
    const { user, clipboardWriteText } = setupClipboardInteraction();
    await openKioskPanel(user);

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
});
