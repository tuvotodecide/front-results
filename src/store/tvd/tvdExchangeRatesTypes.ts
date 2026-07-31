export type TvdExchangeRate = {
  id: string;
  fiatCurrency: "BOB";
  bobPerToken: string;
  active?: boolean;
  current?: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  reason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreateTvdExchangeRateRequest = {
  fiatCurrency: "BOB";
  bobPerToken: string;
  reason: string;
  validFrom?: string;
  validUntil?: string | null;
};

export type CreateTvdExchangeRateArg = {
  body: CreateTvdExchangeRateRequest;
  idempotencyKey: string;
};
