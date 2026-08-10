import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { CreateInstitutionalRecoveryRequest } from "@/store/institutionalRecovery";

const objectIdPattern = /^[a-f\d]{24}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-\s()]{6,32}$/;

export type InstitutionalRecoveryPublicDraft = {
  institutionId: string;
  fullName: string;
  phoneNumber: string;
  newEmail: string;
  supervisorPhoneNumber: string;
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
    phoneNumber: "",
    newEmail: "",
    supervisorPhoneNumber: "",
  };

export const normalizeRecoveryEmail = (value: string) =>
  value.trim().toLowerCase();

export const validateInstitutionalRecoveryPublicDraft = (
  draft: InstitutionalRecoveryPublicDraft,
) => {
  const errors: InstitutionalRecoveryPublicErrors = {};
  const institutionId = draft.institutionId.trim();
  const fullName = draft.fullName.trim().replace(/\s+/g, " ");
  const phoneNumber = draft.phoneNumber.trim().replace(/\s+/g, " ");
  const newEmail = normalizeRecoveryEmail(draft.newEmail);
  const supervisorPhoneNumber = draft.supervisorPhoneNumber
    .trim()
    .replace(/\s+/g, " ");

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

  if (!phoneNumber) {
    errors.phoneNumber = "Ingresa tu número de teléfono.";
  } else if (!phonePattern.test(phoneNumber)) {
    errors.phoneNumber = "El teléfono no es válido.";
  }

  if (!newEmail) {
    errors.newEmail = "Ingresa el nuevo correo.";
  } else if (!emailPattern.test(newEmail)) {
    errors.newEmail = "Ingresa un correo válido.";
  }

  if (!supervisorPhoneNumber) {
    errors.supervisorPhoneNumber = "Ingresa el número de tu inmediato superior.";
  } else if (!phonePattern.test(supervisorPhoneNumber)) {
    errors.supervisorPhoneNumber = "El teléfono del inmediato superior no es válido.";
  }

  return {
    errors,
    payload: {
      institutionId,
      fullName,
      phoneNumber,
      newEmail,
      supervisorPhoneNumber,
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

  if (error.status === 400) {
    if (code === "RECOVERY_CANDIDATE_NOT_VALIDATED") {
      return "No pudimos validar los datos ingresados. Verifica que tu nombre completo coincida con el registrado para esta institución.";
    }
    if (code === "RECOVERY_CANDIDATE_AMBIGUOUS") {
      return "No pudimos validar los datos ingresados. Revisa la información e inténtalo nuevamente.";
    }
    return "Revisa los datos ingresados y vuelve a intentarlo.";
  }

  if (error.status === 409) {
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
