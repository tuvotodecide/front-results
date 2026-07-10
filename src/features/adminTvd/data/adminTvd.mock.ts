import type {
  InstitutionTvdBalance,
  InstitutionalWallet,
  RechargePackage,
} from "../types";

export const mockInstitutionTvdBalance: InstitutionTvdBalance = {
  amount: 0,
  currency: "$TVD",
};

export const consumptionPerValidVote = 1;

export const tvdToBolivianosRate = 0.5;

export const rechargePackages: RechargePackage[] = [
  {
    id: "basic",
    label: "Básico",
    tvdAmount: 500,
    bsAmount: 250,
    description: "500 $TVD · Para votaciones pequeñas",
  },
  {
    id: "standard",
    label: "Estándar",
    tvdAmount: 1200,
    bsAmount: 580,
    description: "1.200 $TVD · Para instituciones medianas",
  },
];

export const initialInstitutionalWallets: InstitutionalWallet[] = [
  {
    id: "wallet-main",
    alias: "Cuenta administrativa",
    address: "0xWal112AB7890AB",
    email: "admin@tse.gob.bo",
    status: "VALIDATED",
  },
  {
    id: "wallet-ops",
    alias: "Cuenta operativa",
    address: "0xWal112B3C7890BC",
    email: "ops@tse.gob.bo",
    status: "VALIDATED",
  },
  {
    id: "wallet-aux",
    alias: "Cuenta auxiliar",
    address: "0xWal114D5E90DEFG",
    email: "aux@tse.gob.bo",
    status: "DISABLED",
  },
];

export const walletValidationFixtures = {
  available: {
    address: "0xAdd111Available0001",
    email: "nueva.cuenta@tse.gob.bo",
  },
  notFound: "0xNotFound000000000",
  alreadyLinked: initialInstitutionalWallets[0].address,
};

export const explorerBaseUrl = "https://basescan.org/address";
