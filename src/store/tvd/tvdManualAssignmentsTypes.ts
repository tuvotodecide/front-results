export type TvdManualAssignmentStatus =
  | "PENDING"
  | "SUBMITTING"
  | "SUBMITTED"
  | "CONFIRMED"
  | "FAILED"
  | "NEEDS_REVIEW";

export type TvdAdminInstitutionListQuery = {
  search?: string;
  page?: number;
  limit?: number;
};

export type TvdAdminInstitution = {
  tenantId: string;
  name: string;
  active: boolean;
  assignmentsCount: number;
  eligibleWalletsCount: number;
};

export type TvdAdminInstitutionListResponse = {
  items: TvdAdminInstitution[];
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
};

export type TvdAdminInstitutionWallet = {
  assignmentId: string;
  userId: string;
  institutionalRole: string | null;
  status: string;
  active: boolean;
  userActive: boolean;
  wallet: string | null;
  walletNormalized: string | null;
  walletStatus: string | null;
  walletVerifiedAt: string | null;
  walletVerificationSource: string | null;
  eligible: boolean;
};

export type TvdAdminInstitutionWalletsResponse = {
  tenantId: string;
  tenantName: string;
  tenantActive: boolean;
  wallets: TvdAdminInstitutionWallet[];
};

export type CreateTvdManualAssignmentRequest = {
  tenantId: string;
  assignmentId: string;
  tokenAmount: string;
  reason: string;
};

export type CreateTvdManualAssignmentArg = {
  body: CreateTvdManualAssignmentRequest;
  idempotencyKey: string;
};

export type TvdManualAssignmentResponse = {
  id: string;
  sourceType: "MANUAL_GRANT";
  tenantId: string;
  targetAssignmentId: string;
  targetWallet: string;
  tokenAmount: string;
  tokenAmountSmallestUnit: string | null;
  status: TvdManualAssignmentStatus;
  txHash: string | null;
  chainId: number | null;
  contractAddress: string | null;
  blockNumber: string | null;
  reason: string | null;
  attempts?: number;
  failureCategory?: "RETRYABLE" | "FINAL" | "AMBIGUOUS" | null;
  lastErrorCode: string | null;
  createdAt: string;
  updatedAt?: string;
  submittedAt: string | null;
  confirmedAt: string | null;
};
