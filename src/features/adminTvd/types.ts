export type WalletStatus = "VALIDATED" | "DISABLED";

export type WalletValidationStatus =
  | "idle"
  | "invalid"
  | "not_found"
  | "already_linked"
  | "available";

export interface InstitutionTvdBalance {
  amount: number;
  currency: "$TVD";
}

export interface TvdConsumptionEstimate {
  voters: number;
  consumptionPerValidVote: number;
  total: number;
}

export interface RechargePackage {
  id: string;
  label: string;
  tvdAmount: number;
  bsAmount: number;
  description: string;
}

export interface RechargeIntent {
  id: string;
  amountTvd: number;
  amountBs: number;
  reference: string;
  expiresInMinutes: number;
  qrPayload: string;
}

export interface InstitutionalWallet {
  id: string;
  alias: string;
  address: string;
  email: string;
  status: WalletStatus;
}

export interface WalletValidationResult {
  status: WalletValidationStatus;
  message: string;
  wallet?: Omit<InstitutionalWallet, "id" | "status">;
}
