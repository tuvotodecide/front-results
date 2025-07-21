import { apiSlice } from '../apiSlice';
import { ElectoralSeatsType } from '../../types';

export const electoralSeatsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getElectoralSeatsByMunicipalityId: builder.query<
      ElectoralSeatsType[],
      string
    >({
      query: (municipalityId) => ({
        url: '/geographic/electoral-seats/by-municipality/' + municipalityId,
      }),
      keepUnusedDataFor: 300,
      providesTags: (_result, _error, municipalityId) => [
        { type: 'ElectoralSeats' as const, id: municipalityId },
      ],
    }),
    getElectoralSeat: builder.query<ElectoralSeatsType, string>({
      query: (id) => `/geographic/electoral-seats/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: 'ElectoralSeats' as const, id },
      ],
    }),
  }),
});

export const {
  useGetElectoralSeatsByMunicipalityIdQuery,
  useLazyGetElectoralSeatsByMunicipalityIdQuery,
  useLazyGetElectoralSeatQuery,
} = electoralSeatsApiSlice;
