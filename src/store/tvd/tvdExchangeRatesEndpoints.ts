import { apiSlice } from "../apiSlice";
import type {
  CreateTvdExchangeRateArg,
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
      invalidatesTags: [{ type: "TvdExchangeRates" as const, id: "CURRENT" }],
    }),
  }),
});

export const {
  useCreateTvdExchangeRateMutation,
  useGetCurrentTvdExchangeRateQuery,
} = tvdExchangeRatesEndpoints;
