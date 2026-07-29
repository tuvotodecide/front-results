export type TvdFiatCurrency = "BOB";

export type TvdQuoteRequest = {
  amount: string;
  currency: TvdFiatCurrency;
};

export type TvdQuoteResponse = {
  fiatAmount: string;
  fiatAmountMinor: string;
  fiatCurrency: TvdFiatCurrency;
  estimatedTvd: string;
  estimatedTvdSmallestUnit: string | null;
  bobPerToken: string;
  exchangeRateVersion: number;
  quotedAt: string;
  expiresAt?: string | null;
};

export type CreateQrPaymentRequest = {
  amount: string;
  currency: TvdFiatCurrency;
  description: string;
};

export type CreateQrPaymentArg = {
  body: CreateQrPaymentRequest;
  idempotencyKey: string;
};

export type RegenerateQrPaymentArg = {
  paymentId: string;
  idempotencyKey: string;
};

export type PaymentStatus =
  | "CREATED"
  | "QR_REQUESTING"
  | "QR_ACTIVE"
  | "PAYMENT_CONFIRMED"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED"
  | "MISMATCH"
  | "PROVIDER_STATUS_UNRESOLVED"
  | "PROVIDER_ERROR"
  | "RECONCILIATION_PENDING"
  | "BLOCKED_BY_INFRASTRUCTURE"
  | "MANUAL_REVIEW";

export type PaymentRegenerationStatus =
  | "REGENERABLE"
  | "NOT_REGENERABLE"
  | "RECONCILIATION_REQUIRED";

export type TokenAccreditationStatus =
  | "PENDING"
  | "SUBMITTING"
  | "SUBMITTED"
  | "CONFIRMED"
  | "FAILED"
  | "FAILED_TERMINAL"
  | "BLOCKED_CONFIGURATION"
  | "NEEDS_REVIEW";

export type TvdPaymentBlockchainStatus =
  | "BLOCKCHAIN_NOT_STARTED"
  | "ACCREDITATION_NOT_CREATED"
  | "ACCREDITATION_PENDING"
  | "ACCREDITATION_PROCESSING"
  | "ACCREDITATION_SUBMITTED"
  | "ACCREDITATION_CONFIRMED"
  | "ACCREDITATION_BLOCKED_CONFIGURATION"
  | "ACCREDITATION_RETRY_SCHEDULED"
  | "ACCREDITATION_FAILED_TERMINAL"
  | "ACCREDITATION_NEEDS_REVIEW";

export type TvdPaymentFlowStatus =
  | PaymentStatus
  | "ACCREDITATION_PENDING"
  | "ACCREDITATION_SUBMITTED"
  | "ACCREDITATION_CONFIRMED"
  | "ACCREDITATION_BLOCKED_CONFIGURATION"
  | "ACCREDITATION_FAILED_TERMINAL"
  | "ACCREDITATION_NEEDS_REVIEW";

export type TvdQuoteSnapshot = {
  fiatAmountMinor: string;
  fiatCurrency: TvdFiatCurrency;
  bobPerToken: string;
  exchangeRateVersion: number;
  tokenAmount: string;
  tokenAmountSmallestUnit?: string | null;
  quotedAt: string;
  expiresAt?: string | null;
};

export type PublicQrPaymentResponse = {
  id: string;
  tenantId: string;
  requestedByUserId: string;
  amount: string;
  amountMinor: string;
  currency: TvdFiatCurrency;
  status: PaymentStatus;
  paymentStatus?: PaymentStatus;
  provider: "RED_ENLACE";
  merchantReference: string;
  providerReference?: string | null;
  qrImage?: string | null;
  qrExpiresAt?: string | null;
  confirmationSource?: string | null;
  tvdQuote?: TvdQuoteSnapshot | null;
  tokenAccreditation?: {
    id: string | null;
    status: TokenAccreditationStatus | string | null;
    tokenAmount: string | null;
  } | null;
  previousPaymentId?: string | null;
  regeneratedToPaymentId?: string | null;
  regenerationStatus: PaymentRegenerationStatus;
  regenerationReason: string;
  createdAt?: string;
  updatedAt?: string;
  confirmedAt?: string | null;
};

export type MyTvdPaymentResponse = {
  paymentId: string;
  amount: string;
  amountMinor: string;
  currency: TvdFiatCurrency;
  status: PaymentStatus;
  provider: "RED_ENLACE";
  merchantReference: string;
  providerReference?: string | null;
  qrImage?: string | null;
  qrExpiresAt?: string | null;
  confirmationSource?: string | null;
  createdAt?: string;
  updatedAt?: string;
  confirmedAt?: string | null;
  tvdQuote?: TvdQuoteSnapshot | null;
  previousPaymentId?: string | null;
  regeneratedToPaymentId?: string | null;
  regenerationStatus?: PaymentRegenerationStatus;
  regenerationReason?: string;
  reconciliationStatus?: string | null;
  accreditationId: string | null;
  accreditationStatus: TokenAccreditationStatus | string | null;
  blockchainStatus?: TvdPaymentBlockchainStatus | string | null;
  flowStatus?: TvdPaymentFlowStatus | string | null;
  txHash: string | null;
  lastReconciliationErrorCode?: string | null;
  lastAccreditationErrorCode?: string | null;
};

export type MyTvdPaymentsListResponse = {
  items: MyTvdPaymentResponse[];
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
};

export type TvdPaymentsListQuery = {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
};
