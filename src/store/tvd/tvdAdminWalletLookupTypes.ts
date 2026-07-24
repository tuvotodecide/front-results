export type TvdWalletIdentityStatus =
  | "REGISTERED"
  | "NOT_REGISTERED"
  | "IDENTITY_UNAVAILABLE"
  | "IDENTITY_INVALID_RESPONSE";

export type TvdWalletAssociationStatus =
  | "ASSOCIATED"
  | "UNASSOCIATED"
  | "DISABLED"
  | "INCOMPATIBLE"
  | "INCONSISTENT";

export type KnownTvdWalletLookupReasonCode =
  | "WALLET_AVAILABLE"
  | "WALLET_NOT_REGISTERED"
  | "WALLET_ASSOCIATED"
  | "WALLET_DISABLED"
  | "WALLET_INCOMPATIBLE"
  | "WALLET_INCONSISTENT"
  | "IDENTITY_UNAVAILABLE"
  | "IDENTITY_INVALID_RESPONSE";

export type TvdWalletLookupReasonCode =
  | KnownTvdWalletLookupReasonCode
  | (string & {});

export type TvdWalletLookupInstitutionSummary = {
  tenantId: string;
  tenantName: string;
  tenantActive: boolean;
  assignmentId: string;
  userId: string;
  institutionalRole: string | null;
  assignmentStatus: string | null;
  assignmentActive: boolean;
  userActive: boolean | null;
  walletStatus: "MISSING" | "VERIFIED";
  walletVerifiedAt: string | null;
  walletVerificationSource: string | null;
};

export type TvdWalletLookupResponse = {
  accountAddress: string;
  registeredInIdentity: boolean;
  identityStatus: TvdWalletIdentityStatus;
  associationStatus: TvdWalletAssociationStatus;
  canUse: boolean;
  reasonCode: TvdWalletLookupReasonCode;
  associations: TvdWalletLookupInstitutionSummary[];
};
