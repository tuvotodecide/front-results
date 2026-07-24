import { apiSlice } from "../apiSlice";
import type {
  CreateInstitutionalTenantDto,
  AssignTenantAdminDto,
  InstitutionalTenant,
  PublicInstitutionTenantListQuery,
  PublicInstitutionTenantListResponse,
  TenantAdminAssignment,
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

    // Crear tenant institucional
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

    // Asignar admin a tenant
    assignTenantAdmin: builder.mutation<
      TenantAdminAssignment,
      { tenantId: string; data: AssignTenantAdminDto }
    >({
      query: ({ tenantId, data }) => ({
        url: `/institutional-tenants/${tenantId}/admins`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { tenantId }) => [
        { type: "InstitutionalTenants", id: tenantId },
      ],
    }),
  }),
});

// Exportar hooks generados automáticamente
export const {
  useListPublicInstitutionalTenantsQuery,
  useLazyListPublicInstitutionalTenantsQuery,
  useCreateInstitutionalTenantMutation,
  useAssignTenantAdminMutation,
} = institutionalTenantsEndpoints;
