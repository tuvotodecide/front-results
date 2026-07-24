import { apiSlice } from "../apiSlice";
import type {
  TvdAdminOperationsFilters,
  TvdAdminOperationsResponse,
} from "./tvdAdminOperationsTypes";

const buildOperationParams = (filters?: TvdAdminOperationsFilters) => {
  if (!filters) return undefined;

  const params: Record<string, string | number> = {};
  if (filters.tenantId) params.tenantId = filters.tenantId;
  if (filters.status) params.status = filters.status;
  if (filters.operationType) params.operationType = filters.operationType;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  return Object.keys(params).length > 0 ? params : undefined;
};

export const tvdAdminOperationsEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listTvdAdminOperations: builder.query<
      TvdAdminOperationsResponse,
      TvdAdminOperationsFilters | void
    >({
      query: (filters) => ({
        url: "/tvd/admin/operations",
        method: "GET",
        params: buildOperationParams(filters ?? undefined),
      }),
      providesTags: [{ type: "TvdAccreditations", id: "ADMIN_OPERATIONS" }],
    }),
  }),
});

export const { useListTvdAdminOperationsQuery } =
  tvdAdminOperationsEndpoints;
