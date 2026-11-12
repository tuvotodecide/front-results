import { apiSlice } from "../apiSlice";
import type {
  InstitutionalWalletMigrationGateQueryArg,
  InstitutionalWalletMigrationGateResponse,
} from "./institutionalWalletMigrationTypes";

export const institutionalWalletMigrationEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInstitutionalWalletMigrationGate: builder.query<
      InstitutionalWalletMigrationGateResponse,
      InstitutionalWalletMigrationGateQueryArg
    >({
      query: ({ tenantId }) => ({
        url: "/institutional-wallet-migrations/status",
        method: "GET",
        params: { tenantId },
      }),
      providesTags: (_result, _error, arg) => [
        { type: "InstitutionalTenants", id: `WALLET_MIGRATION:${arg.tenantId}` },
      ],
    }),
  }),
});

export const { useGetInstitutionalWalletMigrationGateQuery } =
  institutionalWalletMigrationEndpoints;
