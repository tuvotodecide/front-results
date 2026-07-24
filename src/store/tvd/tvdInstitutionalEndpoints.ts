import { apiSlice } from "../apiSlice";
import type {
  TvdMySummaryQueryArg,
  TvdMySummaryResponse,
  TvdWalletRegularizationRequest,
  TvdWalletRegularizationResponse,
} from "./tvdInstitutionalTypes";

export const tvdInstitutionalEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyTvdSummary: builder.query<
      TvdMySummaryResponse,
      TvdMySummaryQueryArg | void
    >({
      query: () => ({
        url: "/tvd/me/summary",
        method: "GET",
      }),
      providesTags: (_result, _error, arg) => [
        {
          type: "InstitutionalTenants",
          id: `TVD_ME_SUMMARY:${arg?.tenantId ?? "active"}`,
        },
      ],
    }),
    regularizeMyInstitutionalWallet: builder.mutation<
      TvdWalletRegularizationResponse,
      {
        tenantId: string;
        body: TvdWalletRegularizationRequest;
      }
    >({
      query: ({ tenantId, body }) => ({
        url: `/institutional-tenants/${tenantId}/admins/me/wallet-regularization`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        {
          type: "InstitutionalTenants",
          id: `TVD_ME_SUMMARY:${arg.tenantId}`,
        },
      ],
    }),
  }),
});

export const {
  useGetMyTvdSummaryQuery,
  useRegularizeMyInstitutionalWalletMutation,
} = tvdInstitutionalEndpoints;
