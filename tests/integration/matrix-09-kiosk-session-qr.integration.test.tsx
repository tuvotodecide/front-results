import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  kioskPageMocks,
  makeKioskState,
  renderKioskPage,
  resetKioskPageMocks,
} from "./helpers/matrix09KioskPageTestUtils";

describe("MX-09 | sesión y QR del punto presencial", () => {
  beforeEach(() => {
    resetKioskPageMocks();
  });

  it("[MX-09][KIO-QR-P0-001][INTEGRACION] solicita la sesión con estación normalizada y muestra qrValue READY", async () => {
    kioskPageMocks.searchParams = new URLSearchParams(
      "stationId=default&kioskToken=limited-link-token",
    );
    kioskPageMocks.currentState = makeKioskState("READY");
    const page = renderKioskPage();

    expect(await screen.findByText("QR listo para escanear")).toBeInTheDocument();
    expect(screen.getByTitle("Código QR")).toBeInTheDocument();
    await waitFor(() => {
      expect(kioskPageMocks.fetchCurrent).toHaveBeenCalledWith({
        eventId: "eleccion-09",
        stationId: "kiosco-principal",
        kioskToken: "limited-link-token",
      });
    });
    expect(document.body).not.toHaveTextContent("limited-link-token");
    page.unmount();
  });

  it("[MX-09][KIO-QR-P1-003][INTEGRACION] recupera un enlace almacenado y limpia el token rechazado", async () => {
    kioskPageMocks.searchParams = new URLSearchParams(
      "stationId=mesa-norte&kioskToken=stored-limited-token&eventName=Mesa%20Norte",
    );
    const firstPage = renderKioskPage();
    await screen.findByText("QR listo para escanear");
    firstPage.unmount();

    kioskPageMocks.searchParams = new URLSearchParams("stationId=mesa-norte");
    const recoveredPage = renderKioskPage();
    await waitFor(() => {
      expect(kioskPageMocks.fetchCurrent).toHaveBeenCalledWith({
        eventId: "eleccion-09",
        stationId: "mesa-norte",
        kioskToken: "stored-limited-token",
      });
    });
    recoveredPage.unmount();

    resetKioskPageMocks();
    kioskPageMocks.authToken = null;
    kioskPageMocks.searchParams = new URLSearchParams(
      "stationId=mesa-norte&kioskToken=rejected-limited-token",
    );
    kioskPageMocks.fetchCurrent.mockImplementation(() => ({
      unwrap: () => Promise.reject(new Error("Unauthorized")),
    }));
    const rejectedPage = renderKioskPage();

    expect(
      await screen.findByText(
        "Este enlace del punto presencial ya no es válido o no tiene autorización para continuar.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTitle("Código QR")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("votacion:kiosk:eleccion-09:mesa-norte")).toBeNull();
    rejectedPage.unmount();
  });

  it("[MX-09][KIO-HAB-P1-002][INTEGRACION] bloquea la pantalla administrativa cuando el modo presencial está desactivado", async () => {
    kioskPageMocks.event = {
      ...kioskPageMocks.event,
      presentialKioskEnabled: false,
    };
    const page = renderKioskPage();

    expect(
      await screen.findByText(
        "El voto presencial con QR no está activado para esta elección.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTitle("Código QR")).not.toBeInTheDocument();
    expect(kioskPageMocks.createSession).not.toHaveBeenCalled();
    page.unmount();
  });
});
