import { apiSlice } from "../apiSlice";
import type {
  CreateQrPaymentArg,
  MyTvdPaymentQuery,
  MyTvdPaymentResponse,
  MyTvdPaymentsListResponse,
  PublicQrPaymentResponse,
  RegenerateQrPaymentArg,
  TvdPaymentsListQuery,
  TvdQuoteRequest,
  TvdQuoteResponse,
} from "./tvdPaymentsTypes";

export const tvdPaymentsEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyTvdQuote: builder.query<TvdQuoteResponse, TvdQuoteRequest>({
      query: ({ amount, currency, tenantId }) => ({
        url: "/tvd/me/quote",
        method: "GET",
        params: { amount, currency, tenantId },
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
    regenerateQrPayment: builder.mutation<
      PublicQrPaymentResponse,
      RegenerateQrPaymentArg
    >({
      query: ({ paymentId, idempotencyKey }) => ({
        url: `/payments/${paymentId}/regenerate`,
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "TvdPayments", id: "LIST" },
        { type: "TvdPayment", id: arg.paymentId },
      ],
    }),
    getMyTvdPayment: builder.query<MyTvdPaymentResponse, MyTvdPaymentQuery>({
      query: ({ paymentId, tenantId }) => ({
        url: `/tvd/me/payments/${paymentId}`,
        method: "GET",
        params: { tenantId },
      }),
      providesTags: (_result, _error, { paymentId }) => [
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
  useRegenerateQrPaymentMutation,
} = tvdPaymentsEndpoints;
