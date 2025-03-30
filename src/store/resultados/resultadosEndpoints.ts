import { apiSlice } from "../apiSlice";

export const resultadosApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getResults: builder.query<any, void>({
      query: () => "/public/results",
      keepUnusedDataFor: 60,
    }),
    getStatistics: builder.query<any, void>({
      query: () => "/public/results/statistics",
      keepUnusedDataFor: 60,
    }),
  }),
});

export const {
  useGetResultsQuery, // Hook to get results
  useGetStatisticsQuery, // Hook to get statistics
} = resultadosApiSlice;

/**
 * const { data } = useGetResultsQuery();
   const { data: statistics } = useGetStatisticsQuery();
   console.log("statistics", statistics);
 */
