import {
  isBlockingGeminiObservation,
} from "@/features/electionConfig/data/padronGeminiClient";

describe("padron Gemini observations", () => {
  it("does not block informational header/noise observations", () => {
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

  it("keeps blocking actionable Gemini observations tied to a specific record", () => {
    expect(
      isBlockingGeminiObservation({
        code: "GEMINI_OBSERVATION",
        message: "No se pudo determinar el CI completo de la fila",
        rowIndex: 4,
        rawValue: "12?45A",
      }),
    ).toBe(true);
  });

  it("keeps backend validation errors as blocking", () => {
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
