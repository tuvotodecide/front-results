import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import KioskQrSvg from "@/domains/votacion/components/KioskQrSvg";
import { buildPresentialKioskPath } from "@/domains/votacion/kiosk/constants";
import { normalizePresentialCurrentState } from "@/domains/votacion/kiosk/presentialSessionAdapters";
import {
  clearStoredKioskSession,
  loadStoredKioskSession,
  saveStoredKioskSession,
} from "@/domains/votacion/kiosk/storage";

describe("MX-09 | utilidades del punto presencial", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("[MX-09][KIO-HAB-P1-002][UNITARIA] construye el enlace del punto con elección, estación y nombre visible", () => {
    expect(
      buildPresentialKioskPath("eleccion-2026", {
        stationId: "mesa-norte",
        eventName: "Elección municipal",
      }),
    ).toBe(
      "/votacion/elecciones/eleccion-2026/kiosco?stationId=mesa-norte&eventName=Elecci%C3%B3n+municipal",
    );
  });

  it("[MX-09][KIO-QR-P1-003][UNITARIA] conserva y limpia kioskAccessToken por elección y estación", () => {
    saveStoredKioskSession(
      "eleccion-2026",
      "mesa-norte",
      "limited-kiosk-token",
      "Elección municipal",
    );

    expect(loadStoredKioskSession("eleccion-2026", "mesa-norte")).toMatchObject({
      eventId: "eleccion-2026",
      stationId: "mesa-norte",
      kioskToken: "limited-kiosk-token",
      eventName: "Elección municipal",
    });
    expect(loadStoredKioskSession("otra-eleccion", "mesa-norte")).toBeNull();

    clearStoredKioskSession("eleccion-2026", "mesa-norte");
    expect(loadStoredKioskSession("eleccion-2026", "mesa-norte")).toBeNull();
  });

  it("[MX-09][KIO-SEC-P0-001][UNITARIA] normaliza qrValue y lo entrega solamente al QR sin datos personales", () => {
    const state = normalizePresentialCurrentState({
      eventId: "eleccion-2026",
      stationId: "mesa-norte",
      kioskEnabled: true,
      isEventActive: true,
      session: {
        id: "sesion-1",
        eventId: "eleccion-2026",
        stationId: "mesa-norte",
        status: "READY",
        qrValue: 90210,
      },
    });

    render(<KioskQrSvg value={state.session?.qrValue ?? ""} />);

    expect(state.session?.qrValue).toBe("90210");
    expect(screen.getByTitle("Código QR")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("carnet");
    expect(document.body).not.toHaveTextContent("opción votada");
  });

  it("[MX-09][KIO-UX-P2-002][UNITARIA] conserva los cinco estados reales de sesión para su mapper visual", () => {
    const statuses = ["READY", "CLAIMED", "COMPLETED", "EXPIRED", "CANCELLED"];

    const mappedStatuses = statuses.map((status) =>
      normalizePresentialCurrentState({
        eventId: "eleccion-2026",
        stationId: "mesa-norte",
        kioskEnabled: true,
        isEventActive: true,
        session: {
          id: `sesion-${status.toLowerCase()}`,
          eventId: "eleccion-2026",
          stationId: "mesa-norte",
          status,
        },
      }).session?.status,
    );

    expect(mappedStatuses).toEqual(statuses);
  });
});
