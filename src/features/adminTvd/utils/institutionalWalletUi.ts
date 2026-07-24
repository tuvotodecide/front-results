import { getAddress, isAddress, zeroAddress } from "viem";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export type WalletAddressValidation =
  | { valid: true; normalized: string }
  | { valid: false; message: string };

export const validateInstitutionalWalletAddress = (
  value: string,
): WalletAddressValidation => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, message: "La dirección de wallet es obligatoria." };
  }
  if (!isAddress(trimmed)) {
    return { valid: false, message: "La dirección no es válida." };
  }
  const normalized = getAddress(trimmed);
  if (normalized === zeroAddress) {
    return { valid: false, message: "La dirección no es válida." };
  }
  return { valid: true, normalized };
};

export const shortWalletAddress = (address: string) =>
  address.length > 16
    ? `${address.slice(0, 8)}...${address.slice(-6)}`
    : address;

export const formatTvdDisplay = (value: string | null | undefined) => {
  const normalized = String(value ?? "0");
  const [integerPart, decimalPart = ""] = normalized.split(".");
  const trimmedDecimals = decimalPart.replace(/0+$/, "").slice(0, 6);
  return trimmedDecimals ? `${integerPart}.${trimmedDecimals}` : integerPart;
};

const getErrorStatus = (error: unknown) => {
  if (typeof error === "object" && error && "status" in error) {
    return (error as FetchBaseQueryError).status;
  }
  return null;
};

const getErrorDataCode = (error: unknown) => {
  if (typeof error !== "object" || !error || !("data" in error)) return null;
  const data = (error as FetchBaseQueryError).data;
  if (typeof data !== "object" || !data || !("code" in data)) return null;
  const code = (data as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
};

export const isWalletUpdateRequiredError = (error: unknown) =>
  getErrorStatus(error) === 400 &&
  getErrorDataCode(error) === "TVD_WALLET_NOT_VERIFIED";

export const getSummaryErrorMessage = (error: unknown) => {
  const status = getErrorStatus(error);
  if (isWalletUpdateRequiredError(error)) {
    return "Debes vincular tu wallet institucional.";
  }
  if (status === 401) return "Tu sesión expiró. Inicia sesión nuevamente.";
  if (status === 403) return "No existe un contexto institucional activo.";
  if (status === 404) return "No encontramos tu institución activa.";
  if (status === 503) return "No pudimos consultar el resumen TVD.";
  return "No pudimos cargar la cuenta institucional.";
};

export const getRegularizationErrorMessage = (error: unknown) => {
  const status = getErrorStatus(error);
  if (status === 400) return "La dirección de wallet no es válida.";
  if (status === 401) return "Tu sesión expiró. Inicia sesión nuevamente.";
  if (status === 403) return "No cuentas con autorización para esta institución.";
  if (status === 404) return "No encontramos tu institución activa.";
  if (status === 409) return "La wallet no está disponible para esta cuenta.";
  if (status === 503) return "No pudimos validar la wallet. Intenta nuevamente.";
  return "No pudimos regularizar la wallet.";
};
