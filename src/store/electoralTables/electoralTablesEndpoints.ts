import { apiSlice } from '../apiSlice';
import {
  PaginatedResponse,
  ElectoralTablesType,
  ElectoralTableType,
  // ElectoralTableByCodeType,
  CreateElectoralTableType,
  UpdateElectoralTableType,
  ElectoralTableTransformedType,
} from '../../types';

interface QueryElectoralTablesParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: Record<string, any>;
  search?: string;
  active?: boolean;
}

export const electoralTablesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getElectoralTables: builder.query<
      PaginatedResponse<ElectoralTablesType>,
      QueryElectoralTablesParams
    >({
      query: (params) => ({
        url: '/geographic/electoral-tables',
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: 'ElectoralTables' as const, id: 'LIST' }],
    }),
    getElectoralTablesByElectoralLocationId: builder.query<
      ElectoralTableType[],
      string
    >({
      query: (electoralLocationId) => ({
        url: '/geographic/electoral-tables/by-location/' + electoralLocationId,
      }),
      keepUnusedDataFor: 300,
      providesTags: (_result, _error, electoralLocationId) => [
        { type: 'ElectoralTables' as const, id: electoralLocationId },
      ],
    }),
    getElectoralTable: builder.query<ElectoralTablesType, string>({
      query: (id) => `/geographic/electoral-tables/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: 'ElectoralTables' as const, id },
      ],
    }),
    getElectoralTableByTableCode: builder.query<
      ElectoralTableTransformedType,
      string
    >({
      query: (tableCode) =>
        `/geographic/electoral-tables/table-code/${tableCode}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, tableCode) => [
        { type: 'ElectoralTables' as const, id: `code-${tableCode}` },
      ],
    }),
    createElectoralTable: builder.mutation<
      ElectoralTablesType,
      CreateElectoralTableType
    >({
      query: (body) => ({
        url: '/geographic/electoral-tables',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ElectoralTables', id: 'LIST' }],
    }),
    updateElectoralTable: builder.mutation<
      ElectoralTablesType,
      { id: string; item: UpdateElectoralTableType }
    >({
      query: ({ id, item }) => ({
        url: `/geographic/electoral-tables/${id}`,
        method: 'PATCH',
        body: item,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ElectoralTables', id: 'LIST' },
        { type: 'ElectoralTables', id },
      ],
    }),
    deleteElectoralTable: builder.mutation<void, string>({
      query: (id) => ({
        url: `/geographic/electoral-tables/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'ElectoralTables', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetElectoralTablesQuery,
  useLazyGetElectoralTablesQuery,
  useGetElectoralTablesByElectoralLocationIdQuery,
  useLazyGetElectoralTablesByElectoralLocationIdQuery,
  useGetElectoralTableQuery,
  useLazyGetElectoralTableQuery,
  useGetElectoralTableByTableCodeQuery,
  useLazyGetElectoralTableByTableCodeQuery,
  useCreateElectoralTableMutation,
  useUpdateElectoralTableMutation,
  useDeleteElectoralTableMutation,
} = electoralTablesApiSlice;
