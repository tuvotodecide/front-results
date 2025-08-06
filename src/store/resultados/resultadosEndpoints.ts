import { apiSlice } from '../apiSlice';

interface GetResultsParams {
  department?: string;
  province?: string;
  municipality?: string;
  electoralSeat?: string;
  electoralLocation?: string;
  tableNumber?: string;
  electionType?: string;
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
  useGetResultsByLocationQuery, // Hook to get results
  useLazyGetResultsByLocationQuery, // Lazy query to get results by location
  useGetStatisticsQuery, // Hook to get statistics
  useLazyGetRegistrationProgressQuery, // Lazy query to get registration progress
} = resultadosApiSlice;

/**
 * const { data } = useGetResultsQuery();
   const { data: statistics } = useGetStatisticsQuery();
   console.log("statistics", statistics);
 */
