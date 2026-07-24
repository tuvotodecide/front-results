import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type {
  InstitutionalRecoveryDetail,
  InstitutionalRecoveryStatus,
} from "@/store/institutionalRecovery";

export const recoveryStatusLabels: Record<InstitutionalRecoveryStatus, string> =
  {
    PENDING: "Pendiente",
    APPROVED: "Aprobada",
    REJECTED: "Rechazada",
  };

export const recoveryStatusStyles: Record<InstitutionalRecoveryStatus, string> =
  {
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    APPROVED: "border-green-200 bg-green-50 text-[#287c36]",
    REJECTED: "border-red-200 bg-red-50 text-red-600",
  };

export const recoveryStatusOptions: Array<
  { label: string; value: InstitutionalRecoveryStatus | "ALL" }
> = [
  { label: "Todos los estados", value: "ALL" },
  { label: "Pendiente", value: "PENDING" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Rechazada", value: "REJECTED" },
];

export const formatRecoveryDate = (value: string | null) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const maskRecoveryWallet = (value: string | null) => {
  if (!value) return "No informada";
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
};

export const normalizeOptionalRecoveryReason = (value: string) => {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized : undefined;
};

export const canApproveInstitutionalRecovery = (
  detail: InstitutionalRecoveryDetail | null,
) =>
  Boolean(
    detail &&
      detail.status === "PENDING" &&
      detail.candidateUserId &&
      detail.candidateAssignmentId &&
      detail.warnings.length === 0,
  );

const isFetchBaseQueryError = (error: unknown): error is FetchBaseQueryError =>
  typeof error === "object" && error !== null && "status" in error;

export const getAdminRecoveryErrorMessage = (error: unknown) => {
  if (!isFetchBaseQueryError(error)) {
    return "No pudimos completar la operación. Intenta nuevamente.";
  }

  if (error.status === 401) {
    return "Tu sesión expiró. Inicia sesión nuevamente.";
  }

  if (error.status === 403) {
    return "No tienes permisos para revisar estas solicitudes.";
  }

  if (error.status === 404) {
    return "No se encontró la solicitud.";
  }

  if (error.status === 409) {
    return "La solicitud ya fue resuelta o sus datos cambiaron. Actualiza el detalle.";
  }

  if (typeof error.status === "number" && error.status >= 500) {
    return "No pudimos completar la operación. Intenta nuevamente.";
  }

  return "No pudimos completar la operación. Intenta nuevamente.";
};
