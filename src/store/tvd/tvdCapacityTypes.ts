export type TvdCapacityReasonCode =
  | "INSUFFICIENT_TVD_BALANCE"
  | "PADRON_NOT_FOUND"
  | "PADRON_NOT_READY"
  | "PADRON_PROCESSING"
  | "PADRON_INVALID"
  | "PADRON_EMPTY"
  | null;

export type TvdPublicationReadiness =
  | "PUBLICATION_BALANCE_INSUFFICIENT"
  | "PUBLICATION_MAX_EXCEEDED"
  | "PUBLICATION_CONTRACT_ROLE_MISSING"
  | "PUBLICATION_PADRON_BLOCKED"
  | "PUBLICATION_READY"
  | "PUBLICATION_PROCESSING"
  | "PUBLICATION_CONFIRMED";

export type TvdEstimatedCapacityRequest = {
  estimatedParticipants: string;
};

export type TvdEstimatedCapacityResponse = {
  estimatedParticipants: string;
  tokensPerParticipant: string;
  estimatedRequiredTokens: string;
  estimatedRequiredSmallestUnit: string;
  availableTokens: string;
  availableSmallestUnit: string;
  estimatedMissingTokens: string;
  estimatedMissingSmallestUnit: string;
  hasEstimatedCapacity: boolean;
  reasonCode: TvdCapacityReasonCode;
  balanceSource: "BLOCKCHAIN";
  usableBalanceField: "liquidBalanceSmallestUnit";
  walletAddress: string;
};

export type TvdEventCapacityResponse = {
  eventId: string;
  participantCount: number;
  padronVersionId: string | null;
  tokensPerParticipant: string;
  requiredTokens: string;
  requiredSmallestUnit: string;
  availableTokens: string;
  availableSmallestUnit: string;
  missingTokens: string;
  missingSmallestUnit: string;
  canPublish: boolean;
  reasonCode: TvdCapacityReasonCode;
  publicationReadiness?: TvdPublicationReadiness;
  balanceSource: "BLOCKCHAIN";
  usableBalanceField: "liquidBalanceSmallestUnit";
  walletAddress: string;
};
