import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import type {
  KnownTvdWalletLookupReasonCode,
  TvdWalletLookupReasonCode,
  TvdWalletLookupResponse,
} from "@/store/tvd";

const evmAddressPattern = /^0x[a-fA-F0-9]{40}$/;
const zeroAddressPattern = /^0x0{40}$/i;

export type WalletLookupFeedback = {
  title: string;
  description: string;
  tone: "success" | "warning" | "danger" | "neutral";
};

const reasonMessages: Partial<
  Record<KnownTvdWalletLookupReasonCode, WalletLookupFeedback>
> = {
  WALLET_AVAILABLE: {
    title: "Wallet registrada y disponible",
    description:
      "La wallet existe en Identity y no tiene asociaciones institucionales locales.",
    tone: "success",
  },
  WALLET_NOT_REGISTERED: {
    title: "Wallet no registrada",
    description: "La wallet no está registrada en la aplicación móvil.",
    tone: "warning",
  },
  WALLET_ASSOCIATED: {
    title: "Wallet registrada y asociada",
    description:
      "La wallet tiene una asociación institucional registrada en Results.",
    tone: "success",
  },
  WALLET_DISABLED: {
    title: "Wallet no disponible",
    description:
      "La asociación local existe, pero está deshabilitada o no operativa.",
    tone: "danger",
  },
  WALLET_INCOMPATIBLE: {
    title: "Wallet incompatible",
    description:
      "La asociación local no cumple las condiciones institucionales requeridas.",
    tone: "danger",
  },
  WALLET_INCONSISTENT: {
    title: "Wallet inconsistente",
    description:
      "La wallet aparece en más de una asociación local y requiere revisión.",
    tone: "danger",
  },
  IDENTITY_UNAVAILABLE: {
    title: "Identity no disponible",
    description: "No pudimos validar la wallet. Intenta nuevamente.",
    tone: "warning",
  },
  IDENTITY_INVALID_RESPONSE: {
    title: "Respuesta de Identity inválida",
    description: "No pudimos validar la wallet. Intenta nuevamente.",
    tone: "warning",
  },
};

export const validateWalletLookupAddress = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Ingresa una dirección de wallet.";
  }
  if (!evmAddressPattern.test(trimmed) || zeroAddressPattern.test(trimmed)) {
    return "La dirección de wallet no es válida.";
  }
  return null;
};

export const getWalletLookupFeedback = (
  response: TvdWalletLookupResponse,
): WalletLookupFeedback =>
  reasonMessages[response.reasonCode as KnownTvdWalletLookupReasonCode] ?? {
    title: "Estado no determinado",
    description: "No pudimos determinar el estado de la wallet.",
    tone: response.canUse ? "neutral" : "warning",
  };

export const getReasonCodeLabel = (reasonCode: TvdWalletLookupReasonCode) =>
  reasonMessages[reasonCode as KnownTvdWalletLookupReasonCode]?.title ??
  "Estado no determinado";

const isFetchBaseQueryError = (
  error: FetchBaseQueryError | SerializedError,
): error is FetchBaseQueryError => "status" in error;

export const getWalletLookupErrorMessage = (
  error: FetchBaseQueryError | SerializedError | undefined,
) => {
  if (!error) {
    return "No pudimos consultar la wallet. Intenta nuevamente.";
  }
  if (isFetchBaseQueryError(error)) {
    if (error.status === 401) {
      return "Tu sesión ha finalizado.";
    }
    if (error.status === 403) {
      return "No tienes permisos para consultar wallets globalmente.";
    }
    if (error.status === 400) {
      return "La dirección de wallet no es válida.";
    }
    if (error.status === 404) {
      return "La wallet no está registrada.";
    }
    if (error.status === 502 || error.status === 503) {
      return "No pudimos validar la wallet. Intenta nuevamente.";
    }
    if (typeof error.status === "number" && error.status >= 500) {
      return "El servicio no está disponible. Intenta nuevamente.";
    }
  }
  return "No pudimos consultar la wallet. Intenta nuevamente.";
};
