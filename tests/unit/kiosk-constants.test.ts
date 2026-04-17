import {
  DEFAULT_KIOSK_STATION_ID,
  buildPresentialKioskPath,
  getKioskDisplayName,
  normalizeKioskStationId,
} from "@/domains/votacion/kiosk/constants";

describe("kiosk station helpers", () => {
  it("normalizes empty and legacy station ids to the principal kiosk", () => {
    expect(normalizeKioskStationId()).toBe(DEFAULT_KIOSK_STATION_ID);
    expect(normalizeKioskStationId("")).toBe(DEFAULT_KIOSK_STATION_ID);
    expect(normalizeKioskStationId("default")).toBe(DEFAULT_KIOSK_STATION_ID);
  });

  it("does not expose the legacy default station id in display names or generated links", () => {
    expect(getKioskDisplayName("default")).toBe("Página del QR");
    expect(buildPresentialKioskPath("event-1", { stationId: "default" })).toBe(
      "/votacion/elecciones/event-1/kiosco",
    );
  });

  it("keeps custom station ids compatible for future multiple kiosks", () => {
    expect(normalizeKioskStationId("mesa-norte")).toBe("mesa-norte");
    expect(
      buildPresentialKioskPath("event-1", {
        stationId: "mesa-norte",
        kioskToken: "abc",
        eventName: "Elección",
      }),
    ).toBe(
      "/votacion/elecciones/event-1/kiosco?stationId=mesa-norte&kioskToken=abc&eventName=Elecci%C3%B3n",
    );
  });
});
