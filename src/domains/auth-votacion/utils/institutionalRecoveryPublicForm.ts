import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { CreateInstitutionalRecoveryRequest } from "@/store/institutionalRecovery";

const objectIdPattern = /^[a-f\d]{24}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InstitutionalRecoveryPublicDraft = {
  institutionId: string;
  fullName: string;
  newEmail: string;
};

export type InstitutionalRecoveryPublicField =
  keyof InstitutionalRecoveryPublicDraft;

export type InstitutionalRecoveryPublicErrors = Partial<
  Record<InstitutionalRecoveryPublicField, string>
>;

export const initialInstitutionalRecoveryPublicDraft: InstitutionalRecoveryPublicDraft =
  {
    institutionId: "",
    fullName: "",
    newEmail: "",
  };

export const normalizeRecoveryEmail = (value: string) =>
  value.trim().toLowerCase();

export const validateInstitutionalRecoveryPublicDraft = (
  draft: InstitutionalRecoveryPublicDraft,
) => {
  const errors: InstitutionalRecoveryPublicErrors = {};
  const institutionId = draft.institutionId.trim();
  const fullName = draft.fullName.trim().replace(/\s+/g, " ");
  const newEmail = normalizeRecoveryEmail(draft.newEmail);

  if (!institutionId) {
    errors.institutionId = "Selecciona una institución.";
  } else if (!objectIdPattern.test(institutionId)) {
    errors.institutionId = "La institución seleccionada no es válida.";
  }

  if (!fullName) {
    errors.fullName = "Ingresa tu nombre completo.";
  } else if (fullName.length < 3) {
    errors.fullName = "El nombre debe tener al menos 3 caracteres.";
  }

  if (!newEmail) {
    errors.newEmail = "Ingresa el nuevo correo.";
  } else if (!emailPattern.test(newEmail)) {
    errors.newEmail = "Ingresa un correo válido.";
  }

  return {
    errors,
    payload: {
      institutionId,
      fullName,
      newEmail,
    } satisfies CreateInstitutionalRecoveryRequest,
    isValid: Object.keys(errors).length === 0,
  };
};

const isFetchBaseQueryError = (error: unknown): error is FetchBaseQueryError =>
  typeof error === "object" && error !== null && "status" in error;

export const getPublicRecoveryErrorMessage = (error: unknown) => {
  if (!isFetchBaseQueryError(error)) {
    return "No pudimos registrar la solicitud. Intenta nuevamente.";
  }

  if (error.status === 429) {
    return "Se realizaron demasiados intentos. Espera unos minutos antes de reintentar.";
  }

  if (error.status === 400) {
    return "Revisa los datos ingresados y vuelve a intentarlo.";
  }

  if (error.status === 409) {
    const data =
      typeof error.data === "object" && error.data !== null ? error.data : null;
    const code =
      data && "code" in data && typeof data.code === "string"
        ? data.code
        : null;
    const message =
      data && "message" in data && typeof data.message === "string"
        ? data.message
        : "";
    if (code === "EMAIL_ALREADY_IN_USE" || message === "EMAIL_ALREADY_IN_USE") {
      return "El correo ingresado ya está en uso.";
    }
    if (code === "EMAIL_SAME_AS_CURRENT") {
      return "El nuevo correo debe ser distinto del correo actual.";
    }
    if (code === "RECOVERY_REQUEST_ALREADY_PENDING") {
      return "Ya existe una solicitud pendiente para esos datos.";
    }
    return "No pudimos registrar la solicitud con esos datos.";
  }

  if (typeof error.status === "number" && error.status >= 500) {
    return "No pudimos completar la operación. Intenta nuevamente.";
  }

  return "No pudimos registrar la solicitud. Intenta nuevamente.";
};
