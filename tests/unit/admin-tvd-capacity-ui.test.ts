import {
  getCapacityRequestErrorMessage,
  getTvdCapacityReasonMessage,
  isTvdCapacityRechargeable,
  validateEstimatedParticipants,
} from "@/features/adminTvd/utils/tvdCapacityUi";

describe("admin TVD capacity UI helpers", () => {
  it("TVD-PUB-P0-003 TVD-PUB-P0-004 | acepta participantes estimados como entero positivo normalizado", () => {
    expect(validateEstimatedParticipants(" 10 ")).toEqual({
      valid: true,
      value: "10",
    });
    expect(validateEstimatedParticipants("1")).toEqual({
      valid: true,
      value: "1",
    });
  });

  it("TVD-PUB-P0-002 | rechaza valores vacios, cero, negativos, decimales, texto y notacion cientifica", () => {
    for (const value of ["", "   ", "0", "-1", "1.5", "abc", "1e3"]) {
      expect(validateEstimatedParticipants(value)).toEqual({
        valid: false,
        message: "Ingresa una cantidad entera mayor que cero.",
      });
    }
  });

  it("TVD-PUB-P0-001 TVD-PUB-P0-005 | mapea reason codes reales sin exponer codigos como mensaje principal", () => {
    expect(getTvdCapacityReasonMessage(null)).toBe(
      "Hay saldo suficiente para el cálculo actual.",
    );
    expect(getTvdCapacityReasonMessage("INSUFFICIENT_TVD_BALANCE")).toBe(
      "Faltan TVD para cubrir esta elección.",
    );
    expect(getTvdCapacityReasonMessage("PADRON_PROCESSING")).toBe(
      "El padrón todavía está procesándose.",
    );
    expect(getTvdCapacityReasonMessage("PADRON_EMPTY")).toBe(
      "No hay participantes habilitados en el padrón vigente.",
    );
  });

  it("TVD-PUB-P0-006 TVD-UI-P1-002 | traduce errores HTTP a mensajes seguros", () => {
    expect(getCapacityRequestErrorMessage({ status: 401, data: {} })).toBe(
      "Tu sesión expiró. Inicia sesión nuevamente.",
    );
    expect(getCapacityRequestErrorMessage({ status: 403, data: {} })).toBe(
      "No tienes permisos para validar la capacidad de esta elección.",
    );
    expect(getCapacityRequestErrorMessage({ status: 404, data: {} })).toBe(
      "No pudimos encontrar la elección o el padrón vigente.",
    );
    expect(getCapacityRequestErrorMessage({ status: 503, data: {} })).toBe(
      "No se pudo validar la disponibilidad de TVD. Intenta nuevamente.",
    );
    expect(
      getCapacityRequestErrorMessage({
        status: 503,
        data: { code: "OFFICIAL_PUBLICATION_VOTE_MANAGER_NOT_OPERATOR" },
      }),
    ).toBe(
      "La publicación no está disponible en este momento. Intenta nuevamente más tarde.",
    );
    expect(getCapacityRequestErrorMessage({ status: "FETCH_ERROR", data: {} })).toBe(
      "No se pudo validar la disponibilidad de TVD. Intenta nuevamente.",
    );
  });

  it("TVD-PUB-P0-003 | ofrece QR solo cuando el bloqueo real es saldo insuficiente", () => {
    expect(isTvdCapacityRechargeable("INSUFFICIENT_TVD_BALANCE")).toBe(true);
    expect(isTvdCapacityRechargeable("PADRON_PROCESSING")).toBe(false);
    expect(isTvdCapacityRechargeable(null)).toBe(false);
  });
});
