export type InstitutionalWalletMigrationGateReason =
  | "NONE"
  | "PRIMARY_LOGIN_PENDING"
  | "WALLET_NOT_FOUND"
  | "IN_PROGRESS"
  | "NEEDS_REVIEW"
  | "SECONDARY_REAUTHORIZATION_REQUIRED";

export type InstitutionalWalletMigrationGateResponse = {
  tenantId: string;
  blocking: boolean;
  reason: InstitutionalWalletMigrationGateReason;
  status:
    | "AWAITING_WALLET"
    | "READY"
    | "RETRY_PENDING"
    | "CONFIRMED"
    | "NOT_REQUIRED"
    | "NEEDS_REVIEW"
    | null;
  institutionalRole: "PRIMARY" | "SECONDARY" | null;
  message: string | null;
};

export type InstitutionalWalletMigrationGateQueryArg = {
  tenantId: string;
};
