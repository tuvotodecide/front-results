import { apiSlice } from "../apiSlice";
import type {
  ResolveInstitutionalWalletByDniRequest,
  ResolveInstitutionalWalletByDniResponse,
} from "./institutionalWalletTypes";

export const institutionalWalletEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    resolveInstitutionalWalletByDni: builder.mutation<
      ResolveInstitutionalWalletByDniResponse,
      ResolveInstitutionalWalletByDniRequest
    >({
      query: (body) => ({
        url: "/institutional-wallets/resolve-by-dni",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useResolveInstitutionalWalletByDniMutation } =
  institutionalWalletEndpoints;
