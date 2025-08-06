import { apiSlice } from '../apiSlice';
import {
  PaginatedResponse,
  MunicipalitiesType,
  MunicipalityByProvinceType,
  CreateMunicipalityType,
  UpdateMunicipalityType,
} from '../../types';

interface QueryMunicipalitiesParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: Record<string, any>;
  search?: string;
  active?: boolean;
}

export const municipalitiesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMunicipalities: builder.query<
      PaginatedResponse<MunicipalitiesType>,
      QueryMunicipalitiesParams
    >({
      query: (params) => ({
        url: '/geographic/municipalities',
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: 'Municipalities' as const, id: 'LIST' }],
    }),
    getMunicipalitiesByProvinceId: builder.query<
      MunicipalityByProvinceType[],
      string
    >({
      query: (provinceId) => ({
        url: '/geographic/municipalities/by-province/' + provinceId,
      }),
      keepUnusedDataFor: 300,
      providesTags: (_result, _error, provinceId) => [
        { type: 'Municipalities' as const, id: provinceId },
      ],
    }),
    getMunicipality: builder.query<MunicipalitiesType, string>({
      query: (id) => `/geographic/municipalities/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: 'Municipalities' as const, id },
      ],
    }),
    createMunicipality: builder.mutation<
      MunicipalitiesType,
      CreateMunicipalityType
    >({
      query: (body) => ({
        url: '/geographic/municipalities',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Municipalities', id: 'LIST' }],
    }),
    updateMunicipality: builder.mutation<
      MunicipalitiesType,
      { id: string; item: UpdateMunicipalityType }
    >({
      query: ({ id, item }) => ({
        url: `/geographic/municipalities/${id}`,
        method: 'PATCH',
        body: item,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Municipalities', id: 'LIST' },
        { type: 'Municipalities', id },
      ],
    }),
    deleteMunicipality: builder.mutation<void, string>({
      query: (id) => ({
        url: `/geographic/municipalities/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Municipalities', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetMunicipalitiesQuery,
  useLazyGetMunicipalitiesQuery,
  useGetMunicipalitiesByProvinceIdQuery,
  useLazyGetMunicipalitiesByProvinceIdQuery,
  useGetMunicipalityQuery,
  useLazyGetMunicipalityQuery,
  useCreateMunicipalityMutation,
  useUpdateMunicipalityMutation,
  useDeleteMunicipalityMutation,
} = municipalitiesApiSlice;
