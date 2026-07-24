export type TvdWalletStatus = "MISSING" | "VERIFIED";

export type TvdBalanceAmount = {
  smallestUnit: string;
  formatted: string;
  decimals?: number;
};

export type TvdMySummaryResponse = {
  tenantId: string;
  assignmentId: string;
  wallet: string;
  walletStatus: TvdWalletStatus;
  assignedBalance: TvdBalanceAmount;
  liquidBalance: TvdBalanceAmount;
  totalBalance: TvdBalanceAmount;
  tokenSymbol: string | null;
  chainId: number | null;
  contractAddress: string | null;
  lastAccreditation: unknown | null;
  pendingAccreditationsCount: number;
};

export type TvdMySummaryQueryArg = {
  tenantId?: string | null;
};

export type TvdWalletRegularizationRequest = {
  dni: string;
  accountAddress: string;
};

export type TvdWalletRegularizationResponse = {
  tenantId: string;
  assignmentId: string;
  userId: string;
  accountAddress: string;
  institutionalRole: string | null;
  status: string | null;
  active: boolean;
  hasWallet: boolean;
  requiresWalletUpdate: boolean;
  walletStatus: TvdWalletStatus;
  walletVerifiedAt: string | null;
  walletVerificationSource: string | null;
  updated: boolean;
};
