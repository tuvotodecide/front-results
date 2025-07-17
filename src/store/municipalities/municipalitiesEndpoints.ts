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
  }),
});

export const {
  useGetMunicipalitiesByProvinceIdQuery,
  useLazyGetMunicipalitiesByProvinceIdQuery,
} = municipalitiesApiSlice;
