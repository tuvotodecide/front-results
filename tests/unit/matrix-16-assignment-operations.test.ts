import { describe, expect, it, vi } from "vitest";
import {
  buildTvdManualAssignmentPayloadFingerprint,
  createTvdManualAssignmentIdempotencyKey,
  getTvdManualAssignmentErrorMessage,
  isTvdManualAssignmentTerminalStatus,
  normalizeTvdTokenAmount,
  validateTvdManualAssignmentReason,
} from "@/domains/superadmin/utils/tvdManualAssignment";
import {
  tvdAdminOperationLabels,
  tvdAdminOperationStatusLabels,
} from "@/store/tvd";

describe("MX-16 | asignación y operaciones globales", () => {
  it("[MX-16][ADM-ASG-P0-001][UNITARIA] normaliza un monto decimal seguro y conserva la clave por el mismo payload", () => {
    const payload = { tenantId: "tenant-1", assignmentId: "assignment-1", tokenAmount: "25.5", reason: "Asignación operativa" };
    expect(normalizeTvdTokenAmount(" 25.5000 ")).toBe("25.5");
    expect(buildTvdManualAssignmentPayloadFingerprint(payload)).toBe(buildTvdManualAssignmentPayloadFingerprint({ ...payload }));
  });

  it("[MX-16][ADM-ASG-P0-002][UNITARIA] bloquea exponentes, cero y motivo con caracteres no admitidos", () => {
    expect(normalizeTvdTokenAmount("1e3")).toBeNull();
    expect(normalizeTvdTokenAmount("0")).toBeNull();
    expect(validateTvdManualAssignmentReason("<motivo inválido>")).toBe("Describe un motivo de entre 8 y 240 caracteres.");
  });

  it("[MX-16][ADM-CON-P0-001][UNITARIA] genera una idempotency key no vacía y conoce los estados terminales", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "mx16-idempotency-key" });
    expect(createTvdManualAssignmentIdempotencyKey()).toBe("mx16-idempotency-key");
    expect(isTvdManualAssignmentTerminalStatus("CONFIRMED")).toBe(true);
    expect(isTvdManualAssignmentTerminalStatus("FAILED")).toBe(true);
    expect(isTvdManualAssignmentTerminalStatus("SUBMITTED")).toBe(false);
    vi.unstubAllGlobals();
  });

  it("[MX-16][ADM-OPS-P1-001][UNITARIA] expone labels estables para filtros globales de tipo y estado", () => {
    expect(tvdAdminOperationLabels.MANUAL_ASSIGNMENT).toBe("Asignación manual");
    expect(tvdAdminOperationLabels.VOTE_CONSUMPTION).toBe("Consumo por voto");
    expect(tvdAdminOperationStatusLabels.CONFIRMED).toBe("Confirmada");
  });

  it("[MX-16][ADM-CON-P1-002][UNITARIA] traduce errores de monto, idempotencia y permisos sin filtrar detalles técnicos", () => {
    expect(getTvdManualAssignmentErrorMessage({ status: 409, data: { code: "TVD_IDEMPOTENCY_CONFLICT" } })).toBe("Los datos del intento cambiaron. Inicia una nueva asignación.");
    expect(getTvdManualAssignmentErrorMessage({ status: 403, data: { code: "TVD_ADMIN_REQUIRED" } })).toBe("No tienes permisos para asignar TVD manualmente.");
  });
});
