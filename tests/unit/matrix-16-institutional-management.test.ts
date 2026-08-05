import { describe, expect, it } from "vitest";
import {
  canApproveInstitutionalRecovery,
  getAdminRecoveryErrorMessage,
  maskRecoveryWallet,
  recoveryStatusLabels,
} from "@/domains/superadmin/utils/institutionalRecoveryAdminUi";
import type { InstitutionalRecoveryDetail } from "@/store/institutionalRecovery";

const pendingDetail: InstitutionalRecoveryDetail = {
  requestId: "recovery-1",
  tenantId: "tenant-1",
  institutionName: "Institución Global",
  fullName: "Ana Global",
  phoneNumber: null,
  newEmail: "ana@global.bo",
  supervisorPhoneNumber: null,
  status: "PENDING",
  requestedAt: "2026-07-22T10:00:00.000Z",
  resolvedAt: null,
  candidateUserId: "user-1",
  candidateAssignmentId: "assignment-1",
  currentEmail: "ana.anterior@global.bo",
  accountAddress: "0x1234567890abcdef1234567890abcdef12345678",
  institutionalRole: "TENANT_ADMIN",
  warnings: [],
  resolutionReason: null,
};

describe("MX-16 | gestión institucional global", () => {
  it("[MX-16][ADM-REG-P0-001][UNITARIA] conserva estados administrativos distinguibles para decisiones globales", () => {
    expect(recoveryStatusLabels.PENDING).toBe("Pendiente");
    expect(recoveryStatusLabels.APPROVED).toBe("Aprobada");
    expect(recoveryStatusLabels.REJECTED).toBe("Rechazada");
  });

  it("[MX-16][ADM-REC-P0-001][UNITARIA] muestra labels seguros y enmascara la wallet en detalle", () => {
    expect(recoveryStatusLabels.PENDING).toBe("Pendiente");
    expect(recoveryStatusLabels.APPROVED).toBe("Aprobada");
    expect(maskRecoveryWallet(pendingDetail.accountAddress)).toBe("0x1234...345678");
  });

  it("[MX-16][ADM-REC-P0-002][UNITARIA] habilita aprobación solo para detalle pendiente, coherente y sin warnings", () => {
    expect(canApproveInstitutionalRecovery(pendingDetail)).toBe(true);
    expect(canApproveInstitutionalRecovery({ ...pendingDetail, status: "APPROVED" })).toBe(false);
    expect(canApproveInstitutionalRecovery({ ...pendingDetail, warnings: ["WALLET_CHANGED"] })).toBe(false);
  });

  it("[MX-16][SOPORTE-REC-SEC][UNITARIA] traduce errores de recuperación sin reflejar datos sensibles", () => {
    const message = getAdminRecoveryErrorMessage({ status: 500, data: { passwordResetToken: "secret" } });
    expect(message).toBe("No pudimos completar la operación. Intenta nuevamente.");
    expect(message).not.toContain("secret");
  });
});
