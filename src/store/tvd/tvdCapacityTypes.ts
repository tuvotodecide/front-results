export type TvdCapacityReasonCode =
  | "INSUFFICIENT_TVD_BALANCE"
  | "PADRON_NOT_FOUND"
  | "PADRON_NOT_READY"
  | "PADRON_PROCESSING"
  | "PADRON_INVALID"
  | "PADRON_EMPTY"
  | null;

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
  usableBalanceField: "totalBalanceSmallestUnit";
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
  balanceSource: "BLOCKCHAIN";
  usableBalanceField: "totalBalanceSmallestUnit";
  walletAddress: string;
};
