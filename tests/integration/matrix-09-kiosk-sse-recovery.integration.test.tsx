import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  kioskPageMocks,
  makeKioskState,
  renderKioskPage,
  resetKioskPageMocks,
} from "./helpers/matrix09KioskPageTestUtils";

const latestStream = () => {
  const stream = kioskPageMocks.sseCalls.at(-1);
  if (!stream) {
    throw new Error("No se conectó el stream controlado del punto presencial.");
  }
  return stream;
};

describe("MX-09 | SSE y recuperación del punto presencial", () => {
  beforeEach(() => {
    resetKioskPageMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("[MX-09][KIO-QR-P1-004][INTEGRACION] actualiza QR y estado con los cinco eventos SSE reales", async () => {
    const page = renderKioskPage();
    await screen.findByText("QR listo para escanear");
    await waitFor(() => expect(kioskPageMocks.sseCalls).toHaveLength(1));
    const stream = latestStream();

    await act(async () => {
      stream.onEvent({ event: "session.claimed", data: makeKioskState("CLAIMED") });
    });
    expect(screen.getAllByText("Votante en proceso")).not.toHaveLength(0);
    expect(screen.queryByTitle("Código QR")).not.toBeInTheDocument();

    await act(async () => {
      stream.onEvent({ event: "session.completed", data: makeKioskState("COMPLETED") });
    });
    expect(screen.getAllByText("Voto completado")).not.toHaveLength(0);

    await act(async () => {
      stream.onEvent({ event: "session.expired", data: makeKioskState("EXPIRED") });
    });
    expect(screen.getAllByText("QR expirado")).not.toHaveLength(0);

    await act(async () => {
      stream.onEvent({
        event: "session.rotated",
        data: {
          eventId: "eleccion-09",
          stationId: "kiosco-principal",
          previousSessionId: "sesion-expired",
          session: makeKioskState("READY").session,
        },
      });
    });
    expect(screen.getByTitle("Código QR")).toBeInTheDocument();

    await act(async () => {
      stream.onEvent({ event: "session.ready", data: makeKioskState("READY") });
    });
    expect(screen.getByText("QR listo para escanear")).toBeInTheDocument();
    expect(kioskPageMocks.sseCalls).toHaveLength(1);
    page.unmount();
    expect(stream.signal.aborted).toBe(true);
  });

  it("[MX-09][KIO-CON-P0-001][INTEGRACION] conserva la sesión vigente y su QR al consultar el estado actual", async () => {
    kioskPageMocks.currentState = makeKioskState("READY", {
      qrValue: "pqs.sesion-vigente.token-vigente",
    });
    const page = renderKioskPage();

    await screen.findByText("QR listo para escanear");
    expect(kioskPageMocks.fetchCurrent).toHaveBeenCalledTimes(1);
    expect(kioskPageMocks.createSession).not.toHaveBeenCalled();
    expect(screen.getByTitle("Código QR")).toBeInTheDocument();
    page.unmount();
  });

  it("[MX-09][KIO-CON-P0-002][INTEGRACION] oculta el QR expirado y muestra el nuevo QR READY con tiempo restante", async () => {
    kioskPageMocks.currentState = makeKioskState("EXPIRED");
    const page = renderKioskPage();

    expect(await screen.findAllByText("QR expirado")).not.toHaveLength(0);
    expect(screen.queryByTitle("Código QR")).not.toBeInTheDocument();
    const stream = await waitFor(() => {
      expect(kioskPageMocks.sseCalls).toHaveLength(1);
      return latestStream();
    });

    await act(async () => {
      stream.onEvent({ event: "session.ready", data: makeKioskState("READY") });
    });
    expect(screen.getByTitle("Código QR")).toBeInTheDocument();
    expect(screen.getByText(/Disponible por/)).toBeInTheDocument();
    page.unmount();
  });

  it("[MX-09][KIO-CON-P1-003][INTEGRACION] reintenta una conexión SSE caída y recupera el estado vigente", async () => {
    vi.useFakeTimers();
    kioskPageMocks.connectSse
      .mockImplementationOnce(() => Promise.reject(new Error("NetworkError")))
      .mockImplementation(() => new Promise<void>(() => undefined));
    const page = renderKioskPage();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(
      screen.getByText(
        "No se pudo conectar el punto presencial en este momento. Reintenta en unos segundos.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Intentar de nuevo" })).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(kioskPageMocks.fetchCurrent).toHaveBeenCalledTimes(2);
    expect(kioskPageMocks.connectSse).toHaveBeenCalledTimes(2);
    expect(kioskPageMocks.createSession).not.toHaveBeenCalled();
    expect(screen.getByTitle("Código QR")).toBeInTheDocument();
    page.unmount();
  });
});
