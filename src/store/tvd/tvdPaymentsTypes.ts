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

export type PaymentStatus =
  | "CREATED"
  | "QR_REQUESTING"
  | "QR_ACTIVE"
  | "PAYMENT_CONFIRMED"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED"
  | "MISMATCH"
  | "MANUAL_REVIEW";

export type TokenAccreditationStatus =
  | "PENDING"
  | "SUBMITTING"
  | "SUBMITTED"
  | "CONFIRMED"
  | "FAILED"
  | "NEEDS_REVIEW";

export type TvdQuoteSnapshot = {
  fiatAmountMinor: string;
  fiatCurrency: TvdFiatCurrency;
  bobPerToken: string;
  exchangeRateVersion: number;
  tokenAmount: string;
  tokenAmountSmallestUnit?: string | null;
  quotedAt: string;
};

export type PublicQrPaymentResponse = {
  id: string;
  tenantId: string;
  requestedByUserId: string;
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
  tvdQuote?: TvdQuoteSnapshot | null;
  tokenAccreditation?: {
    id: string | null;
    status: TokenAccreditationStatus | string | null;
    tokenAmount: string | null;
  } | null;
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
  qrExpiresAt?: string | null;
  confirmationSource?: string | null;
  createdAt?: string;
  updatedAt?: string;
  confirmedAt?: string | null;
  tvdQuote?: TvdQuoteSnapshot | null;
  accreditationId: string | null;
  accreditationStatus: TokenAccreditationStatus | string | null;
  txHash: string | null;
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
