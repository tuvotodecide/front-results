import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  kioskPageMocks,
  makeKioskState,
  renderKioskPage,
  resetKioskPageMocks,
} from "./helpers/matrix09KioskPageTestUtils";

describe("MX-09 | seguridad y estados del punto presencial", () => {
  beforeEach(() => {
    resetKioskPageMocks();
  });

  it("[MX-09][KIO-SEC-P0-002][INTEGRACION] usa el token limitado al consultar y abrir el stream del enlace", async () => {
    kioskPageMocks.searchParams = new URLSearchParams(
      "stationId=mesa-sur&kioskToken=limited-kiosk-token",
    );
    const page = renderKioskPage();

    await screen.findByText("QR listo para escanear");
    await waitFor(() => {
      expect(kioskPageMocks.fetchCurrent).toHaveBeenCalledWith({
        eventId: "eleccion-09",
        stationId: "mesa-sur",
        kioskToken: "limited-kiosk-token",
      });
      expect(kioskPageMocks.sseCalls).toHaveLength(1);
    });
    expect(kioskPageMocks.sseCalls[0]?.kioskToken).toBe("limited-kiosk-token");
    page.unmount();
  });

  it("[MX-09][KIO-SEC-P0-003][INTEGRACION] muestra una autorización segura sin revelar el token rechazado", async () => {
    kioskPageMocks.authToken = null;
    kioskPageMocks.searchParams = new URLSearchParams(
      "kioskToken=secret-token-that-must-not-appear",
    );
    kioskPageMocks.fetchCurrent.mockImplementation(() => ({
      unwrap: () => Promise.reject(new Error("Unauthorized secret-token-that-must-not-appear")),
    }));
    const page = renderKioskPage();

    expect(
      await screen.findByText(
        "Este enlace del punto presencial ya no es válido o no tiene autorización para continuar.",
      ),
    ).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("secret-token-that-must-not-appear");
    expect(screen.queryByTitle("Código QR")).not.toBeInTheDocument();
    page.unmount();
  });

  it("[MX-09][KIO-UX-P2-002][INTEGRACION] comunica los cinco estados reales y oculta el QR fuera de READY", async () => {
    const statusLabels = [
      ["READY", "Lista"],
      ["CLAIMED", "En proceso"],
      ["COMPLETED", "Completada"],
      ["EXPIRED", "Expirada"],
      ["CANCELLED", "Cancelada"],
    ] as const;

    for (const [status, label] of statusLabels) {
      resetKioskPageMocks();
      kioskPageMocks.currentState = makeKioskState(status);
      const page = renderKioskPage();

      expect(await screen.findByText(label)).toBeInTheDocument();
      if (status === "READY") {
        expect(screen.getByTitle("Código QR")).toBeInTheDocument();
      } else {
        expect(screen.queryByTitle("Código QR")).not.toBeInTheDocument();
      }
      page.unmount();
    }
  });
});
