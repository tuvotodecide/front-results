import { apiSlice } from "../apiSlice";
import type {
  CreateQrPaymentArg,
  MyTvdPaymentResponse,
  MyTvdPaymentsListResponse,
  PublicQrPaymentResponse,
  TvdPaymentsListQuery,
  TvdQuoteRequest,
  TvdQuoteResponse,
} from "./tvdPaymentsTypes";

export const tvdPaymentsEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyTvdQuote: builder.query<TvdQuoteResponse, TvdQuoteRequest>({
      query: ({ amount, currency }) => ({
        url: "/tvd/me/quote",
        method: "GET",
        params: { amount, currency },
      }),
    }),
    createQrPayment: builder.mutation<PublicQrPaymentResponse, CreateQrPaymentArg>({
      query: ({ body, idempotencyKey }) => ({
        url: "/payments/qr",
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
        body,
      }),
      invalidatesTags: [{ type: "TvdPayments", id: "LIST" }],
    }),
    getMyTvdPayment: builder.query<MyTvdPaymentResponse, string>({
      query: (paymentId) => ({
        url: `/tvd/me/payments/${paymentId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, paymentId) => [
        { type: "TvdPayment", id: paymentId },
      ],
    }),
    listMyTvdPayments: builder.query<
      MyTvdPaymentsListResponse,
      TvdPaymentsListQuery | void
    >({
      query: (query) => ({
        url: "/tvd/me/payments",
        method: "GET",
        params: query ?? undefined,
      }),
      providesTags: (result) => [
        { type: "TvdPayments", id: "LIST" },
        ...(result?.items.map((payment) => ({
          type: "TvdPayment" as const,
          id: payment.paymentId,
        })) ?? []),
      ],
    }),
  }),
});

export const {
  useCreateQrPaymentMutation,
  useGetMyTvdPaymentQuery,
  useGetMyTvdQuoteQuery,
  useListMyTvdPaymentsQuery,
} = tvdPaymentsEndpoints;
