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
  confirmNewEmail: string;
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
    confirmNewEmail: "",
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
  const supervisorPhoneNumber = draft.supervisorPhoneNumber
    .trim()
    .replace(/\s+/g, " ");
  const newEmail = normalizeRecoveryEmail(draft.newEmail);
  const confirmNewEmail = normalizeRecoveryEmail(draft.confirmNewEmail);

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
    errors.phoneNumber = "Ingresa tu teléfono.";
  } else if (!phonePattern.test(phoneNumber)) {
    errors.phoneNumber = "El teléfono no es válido.";
  }

  if (!newEmail) {
    errors.newEmail = "Ingresa el nuevo correo.";
  } else if (!emailPattern.test(newEmail)) {
    errors.newEmail = "Ingresa un correo válido.";
  }

  if (!confirmNewEmail) {
    errors.confirmNewEmail = "Confirma el nuevo correo.";
  } else if (newEmail !== confirmNewEmail) {
    errors.confirmNewEmail = "Los correos no coinciden.";
  }

  if (!supervisorPhoneNumber) {
    errors.supervisorPhoneNumber = "Ingresa el teléfono de verificación.";
  } else if (!phonePattern.test(supervisorPhoneNumber)) {
    errors.supervisorPhoneNumber = "El teléfono de verificación no es válido.";
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

  if (error.status === 400) {
    return "Revisa los datos ingresados y vuelve a intentarlo.";
  }

  if (error.status === 409) {
    return "No pudimos registrar la solicitud con esos datos o ya existe una solicitud pendiente.";
  }

  if (typeof error.status === "number" && error.status >= 500) {
    return "No pudimos completar la operación. Intenta nuevamente.";
  }

  return "No pudimos registrar la solicitud. Intenta nuevamente.";
};
