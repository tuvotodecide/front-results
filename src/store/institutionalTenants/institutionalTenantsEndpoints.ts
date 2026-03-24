import { apiSlice } from "../apiSlice";
import type {
  CreateInstitutionalTenantDto,
  AssignTenantAdminDto,
  InstitutionalTenant,
  TenantAdminAssignment,
} from "./types";

export const institutionalTenantsEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
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
  useCreateInstitutionalTenantMutation,
  useAssignTenantAdminMutation,
} = institutionalTenantsEndpoints;
