import type {
  CreateTvdManualAssignmentRequest,
  TvdAdminInstitutionWallet,
  TvdManualAssignmentResponse,
  TvdManualAssignmentStatus,
} from "@/store/tvd";

const POSITIVE_DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const IDEMPOTENCY_BYTES = 16;

export const TVD_MANUAL_ASSIGNMENT_REASON_MIN_LENGTH = 8;
export const TVD_MANUAL_ASSIGNMENT_REASON_MAX_LENGTH = 240;

export const normalizeTvdTokenAmount = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/[eE]/.test(trimmed)) return null;
  if (!POSITIVE_DECIMAL.test(trimmed)) return null;
  if (/^0+(?:\.0+)?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  const cleanFraction = fraction.replace(/0+$/, "");
  return cleanFraction ? `${whole}.${cleanFraction}` : whole;
};

export const validateTvdManualAssignmentAmount = (value: string) => {
  return normalizeTvdTokenAmount(value)
    ? null
    : "Ingresa una cantidad TVD mayor a 0.";
};

export const validateTvdManualAssignmentReason = (value: string) => {
  const trimmed = value.trim();
  if (
    trimmed.length < TVD_MANUAL_ASSIGNMENT_REASON_MIN_LENGTH ||
    trimmed.length > TVD_MANUAL_ASSIGNMENT_REASON_MAX_LENGTH ||
    /[<>]/.test(trimmed)
  ) {
    return "Describe un motivo de entre 8 y 240 caracteres.";
  }
  return null;
};

export const buildTvdManualAssignmentPayloadFingerprint = (
  payload: CreateTvdManualAssignmentRequest,
) =>
  JSON.stringify({
    tenantId: payload.tenantId,
    assignmentId: payload.assignmentId,
    tokenAmount: payload.tokenAmount,
    reason: payload.reason,
  });

export const createTvdManualAssignmentIdempotencyKey = () => {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (typeof randomUUID === "function") {
    return randomUUID.call(globalThis.crypto);
  }

  if (typeof globalThis.crypto?.getRandomValues !== "function") {
    throw new Error("No se pudo generar una clave segura de idempotencia.");
  }

  const bytes = new Uint8Array(IDEMPOTENCY_BYTES);
  globalThis.crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `manual-tvd-${hex}`;
};

export const isTvdManualAssignmentTerminalStatus = (
  status: TvdManualAssignmentStatus | null | undefined,
) => status === "CONFIRMED" || status === "FAILED" || status === "NEEDS_REVIEW";

export const getTvdManualAssignmentStatusMessage = (
  status: TvdManualAssignmentStatus | null | undefined,
) => {
  switch (status) {
    case "PENDING":
      return "Asignación registrada. Esperando procesamiento.";
    case "SUBMITTING":
      return "Preparando la asignación TVD.";
    case "SUBMITTED":
      return "Transacción enviada. Esperando confirmación.";
    case "CONFIRMED":
      return "Asignación TVD confirmada.";
    case "NEEDS_REVIEW":
      return "La asignación requiere revisión manual.";
    case "FAILED":
      return "La asignación no pudo completarse.";
    default:
      return "Estado de asignación no determinado.";
  }
};

export const getTvdManualAssignmentErrorMessage = (error: unknown) => {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (typeof error.status === "number" || typeof error.status === "string")
      ? error.status
      : null;
  const data =
    typeof error === "object" && error !== null && "data" in error
      ? error.data
      : null;
  const code =
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    typeof data.code === "string"
      ? data.code
      : null;

  if (status === 401) return "Tu sesión expiró. Inicia sesión nuevamente.";
  if (status === 403 || code === "TVD_MANUAL_ASSIGNMENT_UNAUTHORIZED") {
    return "No tienes permisos para asignar TVD manualmente.";
  }
  if (status === 409 || code === "TVD_IDEMPOTENCY_CONFLICT") {
    return "Los datos del intento cambiaron. Inicia una nueva asignación.";
  }
  if (code === "TVD_IDEMPOTENCY_KEY_REQUIRED") {
    return "No se pudo preparar la operación. Intenta nuevamente.";
  }
  if (code === "TVD_INVALID_TOKEN_AMOUNT") {
    return "La cantidad TVD no es válida.";
  }
  if (code === "TVD_INVALID_REASON") {
    return "El motivo no es válido.";
  }
  if (code === "TVD_TENANT_NOT_FOUND") {
    return "No se encontró la institución seleccionada.";
  }
  if (code === "TVD_ASSIGNMENT_NOT_FOUND") {
    return "No se encontró el administrador institucional seleccionado.";
  }
  if (code === "TVD_ASSIGNMENT_TENANT_MISMATCH") {
    return "El administrador no pertenece a la institución seleccionada.";
  }
  if (
    code === "TVD_ASSIGNMENT_INACTIVE" ||
    code === "TVD_ASSIGNMENT_NOT_APPROVED"
  ) {
    return "El administrador institucional no está habilitado para recibir TVD.";
  }
  if (code === "TVD_WALLET_MISSING" || code === "TVD_WALLET_NOT_VERIFIED") {
    return "La wallet seleccionada no está verificada.";
  }
  if (code === "TVD_MANUAL_ASSIGNMENT_NEEDS_REVIEW") {
    return "La asignación requiere revisión manual.";
  }
  if (code === "TVD_MANUAL_ASSIGNMENT_FAILED") {
    return "La asignación TVD no pudo completarse.";
  }
  if (status === "FETCH_ERROR" || status === "TIMEOUT_ERROR" || status === 500) {
    return "No pudimos completar la operación. Intenta nuevamente.";
  }
  return "No pudimos completar la asignación TVD.";
};

export const extractTvdManualAssignmentFromError = (
  error: unknown,
): TvdManualAssignmentResponse | null => {
  const data =
    typeof error === "object" && error !== null && "data" in error
      ? error.data
      : null;
  if (
    typeof data === "object" &&
    data !== null &&
    "accreditation" in data &&
    typeof data.accreditation === "object" &&
    data.accreditation !== null &&
    "id" in data.accreditation
  ) {
    return data.accreditation as TvdManualAssignmentResponse;
  }
  return null;
};

export const getTvdManualAssignmentWalletLabel = (
  wallet: TvdAdminInstitutionWallet,
) => wallet.institutionalRole || `Usuario ${wallet.userId}`;
