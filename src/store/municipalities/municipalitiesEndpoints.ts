import { apiSlice } from '../apiSlice';
import { MunicipalitiesType } from '../../types';

export const municipalitiesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMunicipalitiesByProvinceId: builder.query<MunicipalitiesType[], string>({
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
  }),
});

export const {
  useGetMunicipalitiesByProvinceIdQuery,
  useLazyGetMunicipalitiesByProvinceIdQuery,
  useLazyGetMunicipalityQuery,
} = municipalitiesApiSlice;
