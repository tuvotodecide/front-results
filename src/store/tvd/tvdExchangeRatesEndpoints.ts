import { apiSlice } from "../apiSlice";
import type {
  CreateTvdExchangeRateArg,
  TvdActiveExchangeRate,
  TvdExchangeRate,
} from "./tvdExchangeRatesTypes";

export const tvdExchangeRatesEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentTvdExchangeRate: builder.query<TvdExchangeRate, void>({
      query: () => ({
        url: "/tvd/exchange-rates/current",
        method: "GET",
      }),
      providesTags: [{ type: "TvdExchangeRates" as const, id: "CURRENT" }],
    }),
    getActiveTvdExchangeRate: builder.query<TvdActiveExchangeRate, void>({
      query: () => ({
        url: "/tvd/exchange-rates/active-rate",
        method: "GET",
      }),
      providesTags: [{ type: "TvdExchangeRates" as const, id: "ACTIVE" }],
    }),
    createTvdExchangeRate: builder.mutation<
      TvdExchangeRate,
      CreateTvdExchangeRateArg
    >({
      query: ({ body, idempotencyKey }) => ({
        url: "/tvd/exchange-rates",
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
        body,
      }),
      invalidatesTags: [
        { type: "TvdExchangeRates" as const, id: "CURRENT" },
        { type: "TvdExchangeRates" as const, id: "ACTIVE" },
      ],
    }),
  }),
});

export const {
  useCreateTvdExchangeRateMutation,
  useGetActiveTvdExchangeRateQuery,
  useGetCurrentTvdExchangeRateQuery,
} = tvdExchangeRatesEndpoints;
