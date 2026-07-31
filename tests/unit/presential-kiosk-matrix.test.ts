import { afterEach, describe, expect, it, vi } from "vitest";

import {
  normalizeCreatePresentialSessionResult,
  normalizePresentialCurrentState,
  normalizePresentialSessionRotatedEvent,
} from "@/domains/votacion/kiosk/presentialSessionAdapters";
import {
  clearStoredKioskSession,
  loadStoredKioskSession,
  saveStoredKioskSession,
} from "@/domains/votacion/kiosk/storage";
import {
  buildPresentialApiUrl,
  connectPresentialSse,
  extractApiErrorMessage,
} from "@/domains/votacion/kiosk/presentialSessionSse";

const encoder = new TextEncoder();

const buildSseResponse = (chunks: string[]) =>
  new Response(
    new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    }),
    { status: 200 },
  );

describe("MX-09 presential kiosk controlled coverage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("KIO-HAB-P0-001 KIO-QR-P0-002 KIO-UX-P1-003 | normaliza estados visuales del kiosco sin exponer datos de voto", () => {
    const ready = normalizeCreatePresentialSessionResult({
      eventId: "evt-1",
      stationId: "default",
      kioskEnabled: true,
      kioskAccessToken: "pkc_controlled-token",
      kioskBootstrap: {
        authHeader: "x-kiosk-token",
        currentPath: "/api/v1/voting/events/evt-1/presential-sessions/current",
        streamPath: "/api/v1/voting/events/evt-1/presential-sessions/stream",
      },
      currentSession: {
        id: "session-ready",
        eventId: "evt-1",
        stationId: "default",
        status: "READY",
        rotationNumber: 1,
        expiresAt: "2026-07-31T12:00:00.000Z",
        qrToken: "pqs.ready-token",
        qrValue: "pqs.ready-token",
      },
      readyTtlSeconds: 300,
      claimTtlSeconds: 600,
    });

    expect(ready.kioskEnabled).toBe(true);
    expect(ready.stationId).toBe("kiosco-principal");
    expect(ready.currentSession?.status).toBe("READY");
    expect(ready.currentSession?.qrValue).toBe("pqs.ready-token");
    expect(JSON.stringify(ready)).not.toContain("candidato");
    expect(JSON.stringify(ready)).not.toContain("proof");
    expect(JSON.stringify(ready)).not.toContain("nullifier");

    const claimed = normalizePresentialCurrentState({
      eventId: "evt-1",
      stationId: "kiosco-principal",
      kioskEnabled: true,
      eventState: "OFFICIALLY_PUBLISHED",
      isEventActive: true,
      session: {
        id: "session-claimed",
        eventId: "evt-1",
        stationId: "kiosco-principal",
        status: "CLAIMED",
        claimedAt: "2026-07-31T12:01:00.000Z",
        qrToken: null,
        qrValue: null,
      },
    });

    expect(claimed.session?.status).toBe("CLAIMED");
    expect(claimed.session?.qrToken).toBeNull();
    expect(claimed.session?.qrValue).toBeNull();
  });

  it("KIO-QR-P1-003 KIO-SEC-P0-002 KIO-SEC-P0-003 | guarda y limpia el token solo por evento y estacion", () => {
    saveStoredKioskSession(
      "evt-1",
      "default",
      "pkc_full-token-for-api-only",
      "Eleccion municipal",
    );

    const stored = loadStoredKioskSession("evt-1", "kiosco-principal");
    expect(stored).toMatchObject({
      eventId: "evt-1",
      stationId: "kiosco-principal",
      kioskToken: "pkc_full-token-for-api-only",
      eventName: "Eleccion municipal",
    });

    expect(loadStoredKioskSession("evt-2", "kiosco-principal")).toBeNull();
    clearStoredKioskSession("evt-1", "default");
    expect(loadStoredKioskSession("evt-1", "kiosco-principal")).toBeNull();
  });

  it("KIO-QR-P0-005 KIO-CON-P0-002 KIO-CON-P1-003 | procesa rotacion, expiracion y eventos SSE controlados sin duplicar estado", async () => {
    const rotated = normalizePresentialSessionRotatedEvent({
      eventId: "evt-1",
      stationId: "default",
      previousSessionId: "old-session",
      session: {
        id: "new-session",
        eventId: "evt-1",
        stationId: "default",
        status: "READY",
        rotationNumber: 2,
        qrToken: "pqs.new-token",
        qrValue: "pqs.new-token",
      },
    });

    expect(rotated.previousSessionId).toBe("old-session");
    expect(rotated.stationId).toBe("kiosco-principal");
    expect(rotated.session?.status).toBe("READY");

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        buildSseResponse([
          'event: session.expired\ndata: {"sessionId":"old-session","status":"EXPIRED"}\n\n',
          'event: session.ready\ndata: {"sessionId":"new-session","status":"READY"}\n\n',
        ]),
      );
    const events: Array<{ event: string; data: unknown }> = [];

    await connectPresentialSse({
      url: buildPresentialApiUrl("/api/v1/voting/events/evt-1/presential-sessions/stream"),
      kioskToken: "pkc_controlled-token",
      signal: new AbortController().signal,
      onEvent: (event) => events.push(event),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(events.map((event) => event.event)).toEqual([
      "session.expired",
      "session.ready",
    ]);
    expect(JSON.stringify(events)).not.toContain("pqs.new-token");
  });

  it("KIO-CON-P0-001 KIO-CON-P0-002 KIO-SEC-P0-003 | mantiene errores controlados y seguros para reintentos", async () => {
    const error = await extractApiErrorMessage(
      new Response(JSON.stringify({ error: "KIOSK_ACCESS_DENIED" }), {
        status: 401,
      }),
    );

    expect(error).toBe("KIOSK_ACCESS_DENIED");
    expect(error).not.toContain("pkc_");
    expect(error).not.toContain("pqs.");
    expect(error).not.toContain("carnet");
  });
});
