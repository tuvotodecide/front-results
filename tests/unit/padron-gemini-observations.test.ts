import {
  isBlockingGeminiObservation,
} from "@/features/electionConfig/data/padronGeminiClient";

describe("MX-05 | Padrón, staging, elegibilidad y archivos | Frontend", () => {
  it("PAD-PRC-P0-001 | permite observaciones informativas de Gemini", () => {
    expect(
      isBlockingGeminiObservation({
        code: "GEMINI_OBSERVATION",
        message: "Encabezado de columna identificado y omitido",
        rowIndex: 1,
        rawValue: null,
      }),
    ).toBe(false);

    expect(
      isBlockingGeminiObservation({
        code: "GEMINI_OBSERVATION",
        message: "Ruido visual ignorado al inicio del documento",
        rowIndex: null,
        rawValue: null,
      }),
    ).toBe(false);
  });

  it("PAD-PRC-P0-001 / PAD-VAL-P0-001 | conserva observaciones accionables como bloqueantes", () => {
    expect(
      isBlockingGeminiObservation({
        code: "GEMINI_OBSERVATION",
        message: "No se pudo determinar el CI completo de la fila",
        rowIndex: 4,
        rawValue: "12?45A",
      }),
    ).toBe(true);
  });

  it("PAD-DUP-P0-001 / PAD-VAL-P0-001 | mantiene errores backend y duplicados como bloqueantes", () => {
    expect(
      isBlockingGeminiObservation({
        code: "DUPLICATE_ROW",
        message: "CI duplicado",
        rowIndex: 3,
        rawValue: "123456",
      }),
    ).toBe(true);
  });
});
