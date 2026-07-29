export type TvdWalletStatus = "MISSING" | "VERIFIED";

export type TvdBalanceAmount = {
  smallestUnit: string;
  formatted: string;
  decimals?: number;
};

export type TvdMySummaryResponse = {
  tenantId: string;
  assignmentId: string;
  wallet: string | null;
  walletStatus: TvdWalletStatus;
  assignedBalance: TvdBalanceAmount | null;
  liquidBalance: TvdBalanceAmount | null;
  totalBalance: TvdBalanceAmount | null;
  tokenSymbol: string | null;
  chainId: number | null;
  contractAddress: string | null;
  assignmentContractAddress?: string | null;
  lastAccreditation: unknown | null;
  pendingAccreditationsCount: number;
};

export type TvdMySummaryQueryArg = {
  tenantId?: string | null;
};

export type TvdWalletRegularizationRequest = {
  dni: string;
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
