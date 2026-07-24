import { apiSlice } from "../apiSlice";
import type {
  CreateTvdManualAssignmentArg,
  TvdAdminInstitutionListQuery,
  TvdAdminInstitutionListResponse,
  TvdAdminInstitutionWalletsResponse,
  TvdManualAssignmentResponse,
} from "./tvdManualAssignmentsTypes";

export const tvdManualAssignmentsEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listTvdAdminInstitutions: builder.query<
      TvdAdminInstitutionListResponse,
      TvdAdminInstitutionListQuery | void
    >({
      query: (query) => ({
        url: "/tvd/admin/institutions",
        method: "GET",
        params: query ?? undefined,
      }),
      providesTags: [{ type: "InstitutionalTenants", id: "TVD_ADMIN_LIST" }],
    }),
    listTvdAdminInstitutionWallets: builder.query<
      TvdAdminInstitutionWalletsResponse,
      string
    >({
      query: (tenantId) => ({
        url: `/tvd/admin/institutions/${tenantId}/wallets`,
        method: "GET",
      }),
      providesTags: (_result, _error, tenantId) => [
        { type: "InstitutionalTenants", id: `TVD_ADMIN_WALLETS:${tenantId}` },
      ],
    }),
    createTvdManualAssignment: builder.mutation<
      TvdManualAssignmentResponse,
      CreateTvdManualAssignmentArg
    >({
      query: ({ body, idempotencyKey }) => ({
        url: "/tvd/manual-assignments",
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "TvdAccreditations", id: "ADMIN_LIST" },
        {
          type: "InstitutionalTenants",
          id: `TVD_ADMIN_WALLETS:${arg.body.tenantId}`,
        },
      ],
    }),
    getTvdManualAssignment: builder.query<TvdManualAssignmentResponse, string>({
      query: (accreditationId) => ({
        url: `/tvd/manual-assignments/${accreditationId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, accreditationId) => [
        { type: "TvdAccreditations", id: accreditationId },
      ],
    }),
  }),
});

export const {
  useCreateTvdManualAssignmentMutation,
  useGetTvdManualAssignmentQuery,
  useListTvdAdminInstitutionWalletsQuery,
  useListTvdAdminInstitutionsQuery,
} = tvdManualAssignmentsEndpoints;
