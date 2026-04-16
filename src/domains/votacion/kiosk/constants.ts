export const DEFAULT_KIOSK_STATION_ID = "kiosco-principal";
export const LEGACY_KIOSK_STATION_ID = "default";

export const normalizeKioskStationId = (stationId?: string | null) => {
  const normalized = String(stationId ?? "").trim();

  if (!normalized || normalized === LEGACY_KIOSK_STATION_ID) {
    return DEFAULT_KIOSK_STATION_ID;
  }

  return normalized;
};

export const getKioskDisplayName = (stationId?: string | null) => {
  const normalized = normalizeKioskStationId(stationId);
  if (normalized === DEFAULT_KIOSK_STATION_ID) {
    return "Kiosco principal";
  }

  return normalized;
};

export const buildPresentialKioskPath = (
  eventId: string,
  options?: {
    stationId?: string;
    kioskToken?: string | null;
    eventName?: string | null;
  },
) => {
  const params = new URLSearchParams();
  const normalizedStationId = normalizeKioskStationId(options?.stationId);

  if (normalizedStationId && normalizedStationId !== DEFAULT_KIOSK_STATION_ID) {
    params.set("stationId", normalizedStationId);
  }

  if (options?.kioskToken) {
    params.set("kioskToken", options.kioskToken);
  }

  if (options?.eventName) {
    params.set("eventName", options.eventName);
  }

  const query = params.toString();
  return `/votacion/elecciones/${eventId}/kiosco${query ? `?${query}` : ""}`;
};
