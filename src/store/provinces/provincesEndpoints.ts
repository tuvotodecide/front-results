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
  useGetProvinceQuery,
} = provincesApiSlice;
