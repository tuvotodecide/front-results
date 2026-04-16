import {
  readStorage,
  removeStorage,
  writeStorage,
} from "@/shared/system/browserStorage";
import { normalizeKioskStationId } from "@/domains/votacion/kiosk/constants";

type StoredKioskSession = {
  eventId: string;
  stationId: string;
  kioskToken: string;
  eventName?: string | null;
  savedAt: string;
};

const storageKey = (eventId: string, stationId: string) =>
  `votacion:kiosk:${eventId}:${normalizeKioskStationId(stationId)}`;

export const loadStoredKioskSession = (
  eventId: string,
  stationId: string,
): StoredKioskSession | null => {
  const normalizedStationId = normalizeKioskStationId(stationId);
  const raw = readStorage(storageKey(eventId, normalizedStationId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredKioskSession>;
    if (!parsed.kioskToken) return null;

    return {
      eventId,
      stationId: normalizedStationId,
      kioskToken: String(parsed.kioskToken),
      eventName: parsed.eventName ? String(parsed.eventName) : null,
      savedAt: String(parsed.savedAt ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
};

export const saveStoredKioskSession = (
  eventId: string,
  stationId: string,
  kioskToken: string,
  eventName?: string | null,
) => {
  const normalizedStationId = normalizeKioskStationId(stationId);
  writeStorage(
    storageKey(eventId, normalizedStationId),
    JSON.stringify({
      eventId,
      stationId: normalizedStationId,
      kioskToken,
      eventName: eventName ?? null,
      savedAt: new Date().toISOString(),
    } satisfies StoredKioskSession),
  );
};

export const clearStoredKioskSession = (eventId: string, stationId: string) => {
  removeStorage(storageKey(eventId, normalizeKioskStationId(stationId)));
};
