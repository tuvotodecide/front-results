import { describe, expect, it, vi, afterEach } from "vitest";
import {
  buildTvdManualAssignmentPayloadFingerprint,
  createTvdManualAssignmentIdempotencyKey,
  getTvdManualAssignmentErrorMessage,
  getTvdManualAssignmentStatusMessage,
  isTvdManualAssignmentTerminalStatus,
  normalizeTvdTokenAmount,
  validateTvdManualAssignmentAmount,
  validateTvdManualAssignmentReason,
} from "@/domains/superadmin/utils/tvdManualAssignment";

describe("superadmin TVD manual assignment helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["", null],
    ["   ", null],
    ["0", null],
    ["0.0", null],
    ["-1", null],
    ["abc", null],
    ["1e3", null],
    ["Infinity", null],
    ["100.5000", "100.5"],
    ["  25.2500  ", "25.25"],
    ["10", "10"],
  ])("normaliza cantidad %s", (input, expected) => {
    expect(normalizeTvdTokenAmount(input)).toBe(expected);
  });

  it("valida cantidad y motivo requeridos por el DTO backend", () => {
    expect(validateTvdManualAssignmentAmount("0")).toBe(
      "Ingresa una cantidad TVD mayor a 0.",
    );
    expect(validateTvdManualAssignmentAmount("12.5")).toBeNull();
    expect(validateTvdManualAssignmentReason("corto")).toBe(
      "Describe un motivo de entre 8 y 240 caracteres.",
    );
    expect(validateTvdManualAssignmentReason("Asignación operativa piloto")).toBeNull();
  });

  it("mantiene fingerprint estable y distinto por cambio de payload", () => {
    const base = {
      tenantId: "tenant-1",
      assignmentId: "assignment-1",
      tokenAmount: "10",
      reason: "Asignación operativa",
    };
    expect(buildTvdManualAssignmentPayloadFingerprint(base)).toBe(
      buildTvdManualAssignmentPayloadFingerprint({ ...base }),
    );
    expect(buildTvdManualAssignmentPayloadFingerprint(base)).not.toBe(
      buildTvdManualAssignmentPayloadFingerprint({
        ...base,
        tokenAmount: "11",
      }),
    );
  });

  it("genera Idempotency-Key con crypto y no usa un valor vacío", () => {
    vi.stubGlobal("crypto", {
      randomUUID: () => "manual-idem-1",
      getRandomValues: (bytes: Uint8Array) => bytes,
    });
    expect(createTvdManualAssignmentIdempotencyKey()).toBe("manual-idem-1");
  });

  it("mapea estados terminales y mensajes seguros", () => {
    expect(isTvdManualAssignmentTerminalStatus("CONFIRMED")).toBe(true);
    expect(isTvdManualAssignmentTerminalStatus("NEEDS_REVIEW")).toBe(true);
    expect(isTvdManualAssignmentTerminalStatus("SUBMITTED")).toBe(false);
    expect(getTvdManualAssignmentStatusMessage("SUBMITTED")).toBe(
      "Transacción enviada. Esperando confirmación.",
    );
    expect(getTvdManualAssignmentStatusMessage("NEEDS_REVIEW")).toBe(
      "La asignación requiere revisión manual.",
    );
  });

  it("mapea errores backend sin exponer detalles técnicos", () => {
    expect(
      getTvdManualAssignmentErrorMessage({
        status: 409,
        data: { code: "TVD_IDEMPOTENCY_CONFLICT" },
      }),
    ).toBe("Los datos del intento cambiaron. Inicia una nueva asignación.");
    expect(
      getTvdManualAssignmentErrorMessage({
        status: 400,
        data: { code: "TVD_WALLET_NOT_VERIFIED" },
      }),
    ).toBe("La wallet seleccionada no está verificada.");
    expect(
      getTvdManualAssignmentErrorMessage({
        status: 403,
        data: { code: "TVD_ADMIN_REQUIRED" },
      }),
    ).toBe("No tienes permisos para asignar TVD manualmente.");
  });
});
