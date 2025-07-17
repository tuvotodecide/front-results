import { apiSlice } from '../apiSlice';
import { PaginatedResponse, ProvincesType } from '../../types';

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
  }),
});

export const {
  useGetProvincesQuery,
  useLazyGetProvincesQuery,
  useGetProvincesByDepartmentIdQuery,
  useLazyGetProvincesByDepartmentIdQuery,
  useGetProvinceQuery,
} = provincesApiSlice;
