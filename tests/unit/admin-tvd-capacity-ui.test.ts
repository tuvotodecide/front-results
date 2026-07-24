import {
  getCapacityRequestErrorMessage,
  getTvdCapacityReasonMessage,
  validateEstimatedParticipants,
} from "@/features/adminTvd/utils/tvdCapacityUi";

describe("admin TVD capacity UI helpers", () => {
  it("acepta participantes estimados como entero positivo normalizado", () => {
    expect(validateEstimatedParticipants(" 10 ")).toEqual({
      valid: true,
      value: "10",
    });
    expect(validateEstimatedParticipants("1")).toEqual({
      valid: true,
      value: "1",
    });
  });

  it("rechaza valores vacios, cero, negativos, decimales, texto y notacion cientifica", () => {
    for (const value of ["", "   ", "0", "-1", "1.5", "abc", "1e3"]) {
      expect(validateEstimatedParticipants(value)).toEqual({
        valid: false,
        message: "Ingresa una cantidad entera mayor que cero.",
      });
    }
  });

  it("mapea reason codes reales sin exponer codigos como mensaje principal", () => {
    expect(getTvdCapacityReasonMessage(null)).toBe(
      "La wallet tiene capacidad TVD para el cálculo actual.",
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

  it("traduce errores HTTP a mensajes seguros", () => {
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
      "No pudimos validar el saldo actual. Intenta nuevamente.",
    );
    expect(getCapacityRequestErrorMessage({ status: "FETCH_ERROR", data: {} })).toBe(
      "No pudimos validar la capacidad TVD. Intenta nuevamente.",
    );
  });
});
