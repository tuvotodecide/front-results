import { apiSlice } from '../apiSlice';

interface GetResultsParams {
  department?: string;
  province?: string;
  municipality?: string;
  electoralSeat?: string;
  electoralLocation?: string;
  tableCode?: string;
  electionType?: string;
  electionId?: string; 
}

export const resultadosApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getResultsByLocation: builder.query<any, GetResultsParams>({
      query: (params) => ({
        url: '/results/by-location',
        params,
      }),
      keepUnusedDataFor: 60,
    }),
    getStatistics: builder.query<any, void>({
      query: () => '/results/statistics',
      keepUnusedDataFor: 60,
    }),
    getRegistrationProgress: builder.query<any, GetResultsParams>({
      query: (params) => ({
        url: `/results/registration-progress`,
        params,
      }),
      keepUnusedDataFor: 60,
    }),
  }),
});

export const {
  useGetResultsByLocationQuery,
  useLazyGetResultsByLocationQuery,
  useGetStatisticsQuery,
  useLazyGetRegistrationProgressQuery,
} = resultadosApiSlice;
