import { apiSlice } from "../apiSlice";
import type { TvdWalletLookupResponse } from "./tvdAdminWalletLookupTypes";

export const tvdAdminWalletLookupApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    lookupTvdAdminWallet: builder.query<TvdWalletLookupResponse, string>({
      query: (accountAddress) => ({
        url: "/tvd/admin/wallet-lookup",
        method: "GET",
        params: { accountAddress },
      }),
    }),
  }),
});

export const { useLazyLookupTvdAdminWalletQuery } = tvdAdminWalletLookupApi;
