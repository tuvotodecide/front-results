import type {
  CreatePresentialSessionResult,
  PresentialCurrentState,
  PresentialSession,
  PresentialSessionRotatedEvent,
} from "@/store/votingEvents/types";
import { normalizeKioskStationId } from "@/domains/votacion/kiosk/constants";

const unwrapApiData = (raw: unknown) => {
  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const source = raw as Record<string, unknown>;
  return source.data ?? source;
};

export const normalizePresentialSession = (raw: unknown): PresentialSession | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const source = unwrapApiData(raw) as Record<string, unknown>;

  return {
    id: String(source.id ?? source._id ?? ""),
    eventId: String(source.eventId ?? ""),
    stationId: normalizeKioskStationId(String(source.stationId ?? "")),
    status: String(source.status ?? "READY") as PresentialSession["status"],
    rotationNumber: Number(source.rotationNumber ?? 0),
    expiresAt: source.expiresAt ? String(source.expiresAt) : null,
    claimedAt: source.claimedAt ? String(source.claimedAt) : null,
    completedAt: source.completedAt ? String(source.completedAt) : null,
    qrToken: source.qrToken ? String(source.qrToken) : null,
    qrValue: source.qrValue ? String(source.qrValue) : null,
  };
};

export const normalizePresentialCurrentState = (raw: unknown): PresentialCurrentState => {
  const source = unwrapApiData(raw) as Record<string, unknown>;

  return {
    eventId: String(source?.eventId ?? ""),
    stationId: normalizeKioskStationId(String(source?.stationId ?? "")),
    kioskEnabled: Boolean(source?.kioskEnabled),
    eventState: String(source?.eventState ?? ""),
    isEventActive: Boolean(source?.isEventActive),
    session: normalizePresentialSession(source?.session),
  };
};

export const normalizeCreatePresentialSessionResult = (
  raw: unknown,
): CreatePresentialSessionResult => {
  const source = unwrapApiData(raw) as Record<string, unknown>;
  const kioskBootstrap =
    source?.kioskBootstrap && typeof source.kioskBootstrap === "object"
      ? (source.kioskBootstrap as Record<string, unknown>)
      : {};

  return {
    eventId: String(source?.eventId ?? ""),
    stationId: normalizeKioskStationId(String(source?.stationId ?? "")),
    kioskEnabled: Boolean(source?.kioskEnabled),
    kioskAccessToken: source?.kioskAccessToken
      ? String(source.kioskAccessToken)
      : null,
    kioskBootstrap: {
      authHeader: String(kioskBootstrap.authHeader ?? "x-kiosk-token"),
      currentPath: String(kioskBootstrap.currentPath ?? ""),
      streamPath: String(kioskBootstrap.streamPath ?? ""),
    },
    currentSession: normalizePresentialSession(source?.currentSession),
    claimTtlSeconds: Number(source?.claimTtlSeconds ?? 0),
    readyTtlSeconds: Number(source?.readyTtlSeconds ?? 0),
  };
};

export const normalizePresentialSessionRotatedEvent = (
  raw: unknown,
): PresentialSessionRotatedEvent => {
  const source = unwrapApiData(raw) as Record<string, unknown>;

  return {
    eventId: String(source?.eventId ?? ""),
    stationId: normalizeKioskStationId(String(source?.stationId ?? "")),
    previousSessionId: String(source?.previousSessionId ?? ""),
    session: normalizePresentialSession(source?.session),
  };
};
