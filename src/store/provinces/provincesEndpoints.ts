import { apiSlice } from '../apiSlice';
import {
  PaginatedResponse,
  ProvincesType,
  CreateProvinceType,
  UpdateProvinceType,
} from '../../types';

interface QueryProvincesParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: Record<string, any>;
  search?: string;
  active?: boolean;
}

export const provincesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProvinces: builder.query<
      PaginatedResponse<ProvincesType>,
      QueryProvincesParams
    >({
      query: (params) => ({
        url: '/geographic/provinces',
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: 'Provinces' as const, id: 'LIST' }],
    }),
    getProvincesByDepartmentId: builder.query<ProvincesType[], string>({
      query: (departmentId) => ({
        url: '/geographic/provinces/by-department/' + departmentId,
      }),
      keepUnusedDataFor: 300,
      providesTags: (_result, _error, departmentId) => [
        { type: 'Provinces' as const, id: departmentId },
      ],
    }),
    getProvince: builder.query<ProvincesType, string>({
      query: (id) => `/geographic/provinces/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: 'Provinces' as const, id },
      ],
    }),
    createProvince: builder.mutation<ProvincesType, CreateProvinceType>({
      query: (body) => ({
        url: '/geographic/provinces',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Provinces', id: 'LIST' }],
    }),
    updateProvince: builder.mutation<
      ProvincesType,
      { id: string; item: UpdateProvinceType }
    >({
      query: ({ id, item }) => ({
        url: `/geographic/provinces/${id}`,
        method: 'PATCH',
        body: item,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Provinces', id: 'LIST' },
        { type: 'Provinces', id },
      ],
    }),
    deleteProvince: builder.mutation<void, string>({
      query: (id) => ({
        url: `/geographic/provinces/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Provinces', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetProvincesQuery,
  useLazyGetProvincesQuery,
  useGetProvincesByDepartmentIdQuery,
  useLazyGetProvincesByDepartmentIdQuery,
  useGetProvinceQuery,
  useLazyGetProvinceQuery,
  useCreateProvinceMutation,
  useUpdateProvinceMutation,
  useDeleteProvinceMutation,
} = provincesApiSlice;
