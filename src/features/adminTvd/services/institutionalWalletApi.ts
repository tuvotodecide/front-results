import {
  initialInstitutionalWallets,
  walletValidationFixtures,
} from "../data/adminTvd.mock";
import type {
  InstitutionalWallet,
  WalletValidationResult,
} from "../types";

const normalizeAddress = (value: string) => value.trim().toLowerCase();

export const getInstitutionalWallets = async (): Promise<InstitutionalWallet[]> => {
  return initialInstitutionalWallets;
};

export const validateInstitutionalWallet = async (
  address: string,
  currentWallets: InstitutionalWallet[] = initialInstitutionalWallets,
): Promise<WalletValidationResult> => {
  const trimmed = address.trim();
  const normalized = normalizeAddress(trimmed);

  if (!/^0x[a-zA-Z0-9]{8,}$/.test(trimmed)) {
    return {
      status: "invalid",
      message: "Ingresa una dirección válida.",
    };
  }

  if (
    currentWallets.some((wallet) => normalizeAddress(wallet.address) === normalized) ||
    normalizeAddress(walletValidationFixtures.alreadyLinked) === normalized
  ) {
    return {
      status: "already_linked",
      message: "Esta cuenta ya está vinculada a la institución.",
    };
  }

  if (normalizeAddress(walletValidationFixtures.notFound) === normalized) {
    return {
      status: "not_found",
      message: "No encontramos una cuenta registrada con esa dirección.",
    };
  }

  if (normalizeAddress(walletValidationFixtures.available.address) === normalized) {
    return {
      status: "available",
      message: "Cuenta encontrada. Puedes agregarla a tu institución.",
      wallet: {
        alias: "Cuenta nueva",
        address: walletValidationFixtures.available.address,
        email: walletValidationFixtures.available.email,
      },
    };
  }

  return {
    status: "not_found",
    message: "No encontramos una cuenta registrada con esa dirección.",
  };
};

export const addInstitutionalWallet = async (
  wallet: Omit<InstitutionalWallet, "id" | "status">,
): Promise<InstitutionalWallet> => {
  return {
    id: `wallet-${Date.now()}`,
    ...wallet,
    status: "VALIDATED",
  };
};

export const disableInstitutionalWallet = async (
  wallet: InstitutionalWallet,
): Promise<InstitutionalWallet> => {
  return {
    ...wallet,
    status: "DISABLED",
  };
};
