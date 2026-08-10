import { describe, expect, it } from "vitest";
import {
  getPublicRecoveryErrorMessage,
  initialInstitutionalRecoveryPublicDraft,
  normalizeRecoveryEmail,
  validateInstitutionalRecoveryPublicDraft,
} from "@/domains/auth-votacion/utils/institutionalRecoveryPublicForm";
import {
  canApproveInstitutionalRecovery,
  getAdminRecoveryErrorMessage,
  maskRecoveryWallet,
  normalizeOptionalRecoveryReason,
  recoveryStatusLabels,
} from "@/domains/superadmin/utils/institutionalRecoveryAdminUi";
import {
  AUTH_VERSION_MISMATCH_CODE,
  consumeAuthSessionEndReason,
  getAuthSessionEndMessage,
  persistAuthSessionEndReason,
} from "@/store/auth/sessionInvalidation";
import type { InstitutionalRecoveryDetail } from "@/store/institutionalRecovery";

const validDraft = {
  institutionId: "64f1a7f4c5e8a8d0b9a12345",
  fullName: "Ana Gomez",
  newEmail: " Admin.Nuevo@Institucion.BO ",
};

const detail: InstitutionalRecoveryDetail = {
  requestId: "request-1",
  tenantId: "tenant-1",
  institutionName: "Tribunal Supremo Electoral",
  fullName: "Ana Gomez",
  phoneNumber: "70000000",
  newEmail: "ana.nueva@tse.bo",
  supervisorPhoneNumber: "71111111",
  status: "PENDING",
  requestedAt: "2026-07-22T12:00:00.000Z",
  resolvedAt: null,
  candidateUserId: "user-1",
  candidateAssignmentId: "assignment-1",
  currentEmail: "ana.actual@tse.bo",
  accountAddress: "0x1234567890abcdef1234567890abcdef12345678",
  institutionalRole: "TENANT_ADMIN",
  warnings: [],
  resolutionReason: null,
};

describe("MX-02 | Gestión de instituciones, administradores y wallets | Frontend Admin | Helpers de recuperación", () => {
  it("[MX-02][SOPORTE-RECOVERY][UNITARIO] normaliza el correo y construye el body público exacto", () => {
    const validation = validateInstitutionalRecoveryPublicDraft(validDraft);

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toEqual({});
    expect(validation.payload).toEqual({
      institutionId: "64f1a7f4c5e8a8d0b9a12345",
      fullName: "Ana Gomez",
      newEmail: "admin.nuevo@institucion.bo",
    });
    expect(normalizeRecoveryEmail("  Persona@Dominio.BO ")).toBe(
      "persona@dominio.bo",
    );
  });

  it("[MX-02][SOPORTE-RECOVERY][UNITARIO] rechaza campos públicos vacíos y correo inválido", () => {
    const emptyValidation = validateInstitutionalRecoveryPublicDraft(
      initialInstitutionalRecoveryPublicDraft,
    );
    expect(emptyValidation.isValid).toBe(false);
    expect(emptyValidation.errors.institutionId).toBe(
      "Selecciona una institución.",
    );
    expect(Object.keys(emptyValidation.errors)).toEqual([
      "institutionId",
      "fullName",
      "newEmail",
    ]);

    const invalidEmail = validateInstitutionalRecoveryPublicDraft({
      ...validDraft,
      newEmail: "correo-invalido",
    });
    expect(invalidEmail.errors.newEmail).toBe("Ingresa un correo válido.");
  });

  it("[MX-02][SOPORTE-RECOVERY][UNITARIO] mapea estados y errores sin exponer códigos técnicos", () => {
    expect(recoveryStatusLabels).toEqual({
      PENDING: "Pendiente",
      APPROVED: "Aprobada",
      REJECTED: "Rechazada",
    });
    expect(getPublicRecoveryErrorMessage({ status: 409 })).toBe(
      "No pudimos registrar la solicitud con esos datos.",
    );
    expect(getAdminRecoveryErrorMessage({ status: 409 })).toBe(
      "La solicitud ya fue resuelta o sus datos cambiaron. Actualiza el detalle.",
    );
    expect(getAdminRecoveryErrorMessage({ status: 500 })).not.toMatch(
      /Mongo|stack|token/i,
    );
  });

  it("[MX-02][SOPORTE-RECOVERY][UNITARIO] confirma la identidad requerida antes de aprobar una recuperación", () => {
    expect(canApproveInstitutionalRecovery(detail)).toBe(true);
    expect(canApproveInstitutionalRecovery({ ...detail, warnings: ["NO_CANDIDATE"] })).toBe(
      false,
    );
    expect(canApproveInstitutionalRecovery({ ...detail, candidateUserId: null })).toBe(
      false,
    );
    expect(canApproveInstitutionalRecovery({ ...detail, status: "APPROVED" })).toBe(
      false,
    );
    expect(maskRecoveryWallet(detail.accountAddress)).toBe("0x1234...345678");
    expect(normalizeOptionalRecoveryReason("  Identidad   validada  ")).toBe(
      "Identidad validada",
    );
    expect(normalizeOptionalRecoveryReason("   ")).toBeUndefined();
  });

  it("[MX-02][SOPORTE-SESION][UNITARIO] consume una sola vez el motivo seguro de cierre por authVersion", () => {
    persistAuthSessionEndReason(AUTH_VERSION_MISMATCH_CODE);

    const reason = consumeAuthSessionEndReason();
    expect(reason).toBe(AUTH_VERSION_MISMATCH_CODE);
    expect(getAuthSessionEndMessage(reason)).toContain(
      "se actualizó el acceso institucional",
    );
    expect(consumeAuthSessionEndReason()).toBeNull();
  });
});
