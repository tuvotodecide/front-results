import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { TvdCapacityReasonCode } from "@/store/tvd";

export type EstimatedParticipantsValidation =
  | { valid: true; value: string }
  | { valid: false; message: string };

export const validateEstimatedParticipants = (
  rawValue: string,
): EstimatedParticipantsValidation => {
  const value = rawValue.trim();

  if (!value) {
    return {
      valid: false,
      message: "Ingresa una cantidad entera mayor que cero.",
    };
  }

  if (!/^[1-9]\d*$/.test(value)) {
    return {
      valid: false,
      message: "Ingresa una cantidad entera mayor que cero.",
    };
  }

  return { valid: true, value };
};

export const getTvdCapacityReasonMessage = (
  reasonCode: TvdCapacityReasonCode,
) => {
  switch (reasonCode) {
    case "INSUFFICIENT_TVD_BALANCE":
      return "Faltan TVD para cubrir esta elección.";
    case "PADRON_NOT_FOUND":
      return "Aún no se cargó un padrón vigente.";
    case "PADRON_NOT_READY":
      return "El padrón todavía no está listo.";
    case "PADRON_PROCESSING":
      return "El padrón todavía está procesándose.";
    case "PADRON_INVALID":
      return "El padrón debe corregirse antes de continuar.";
    case "PADRON_EMPTY":
      return "No hay participantes habilitados en el padrón vigente.";
    case null:
      return "La wallet tiene capacidad TVD para el cálculo actual.";
    default:
      return "No pudimos determinar el estado de capacidad TVD.";
  }
};

export const getCapacityRequestErrorMessage = (error: unknown) => {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? (error as FetchBaseQueryError).status
      : undefined;

  if (status === 401) {
    return "Tu sesión expiró. Inicia sesión nuevamente.";
  }

  if (status === 403) {
    return "No tienes permisos para validar la capacidad de esta elección.";
  }

  if (status === 404) {
    return "No pudimos encontrar la elección o el padrón vigente.";
  }

  if (status === 400) {
    return "La solicitud de capacidad no es válida.";
  }

  if (typeof status === "number" && status >= 500) {
    return "No se pudo validar la disponibilidad de TVD. Intenta nuevamente.";
  }

  return "No se pudo validar la disponibilidad de TVD. Intenta nuevamente.";
};

export const formatTvdCapacityAmount = (value: string) => `${value} TVD`;
