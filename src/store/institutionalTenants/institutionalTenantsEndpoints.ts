import { apiSlice } from "../apiSlice";
import type {
  CreateInstitutionalTenantDto,
  AssignTenantAdminDto,
  InstitutionalTenant,
  PublicInstitutionTenantListQuery,
  PublicInstitutionTenantListResponse,
  TenantAdminListResponse,
  TenantAdminAssignment,
  TransferTenantPrimaryDto,
  PrimaryTransferAuthorizationResponse,
  UpdateTenantAdminStatusDto,
} from "./types";

export const institutionalTenantsEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listPublicInstitutionalTenants: builder.query<
      PublicInstitutionTenantListResponse,
      PublicInstitutionTenantListQuery | void
    >({
      query: (params) => ({
        url: "/institutional-tenants/public",
        method: "GET",
        params: {
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.page ? { page: params.page } : {}),
          ...(params?.limit ? { limit: params.limit } : {}),
        },
      }),
      providesTags: ["InstitutionalTenants"],
    }),

    createInstitutionalTenant: builder.mutation<
      InstitutionalTenant,
      CreateInstitutionalTenantDto
    >({
      query: (body) => ({
        url: "/institutional-tenants",
        method: "POST",
        body,
      }),
      invalidatesTags: ["InstitutionalTenants"],
    }),

    assignTenantAdmin: builder.mutation<
      TenantAdminAssignment,
      { tenantId: string; data: AssignTenantAdminDto }
    >({
      query: ({ tenantId, data }) => ({
        url: "/institutional-tenants/" + tenantId + "/admins",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { tenantId }) => [
        { type: "InstitutionalTenants", id: tenantId },
      ],
    }),

    listTenantAdmins: builder.query<TenantAdminListResponse, string>({
      query: (tenantId) => ({
        url: "/institutional-tenants/" + tenantId + "/admins",
        method: "GET",
      }),
      providesTags: (_result, _error, tenantId) => [
        { type: "InstitutionalTenants", id: tenantId },
      ],
    }),

    updateTenantAdminStatus: builder.mutation<
      TenantAdminAssignment,
      { tenantId: string; assignmentId: string; data: UpdateTenantAdminStatusDto }
    >({
      query: ({ tenantId, assignmentId, data }) => ({
        url:
          "/institutional-tenants/" + tenantId + "/admins/" + assignmentId + "/status",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { tenantId }) => [
        { type: "InstitutionalTenants", id: tenantId },
      ],
    }),

    transferTenantPrimary: builder.mutation<
      PrimaryTransferAuthorizationResponse,
      { tenantId: string; data: TransferTenantPrimaryDto }
    >({
      query: ({ tenantId, data }) => ({
        url: "/institutional-tenants/" + tenantId + "/primary/transfer",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { tenantId }) => [
        { type: "InstitutionalTenants", id: tenantId },
      ],
    }),
  }),
});

export const {
  useListPublicInstitutionalTenantsQuery,
  useLazyListPublicInstitutionalTenantsQuery,
  useCreateInstitutionalTenantMutation,
  useAssignTenantAdminMutation,
  useListTenantAdminsQuery,
  useUpdateTenantAdminStatusMutation,
  useTransferTenantPrimaryMutation,
} = institutionalTenantsEndpoints;
