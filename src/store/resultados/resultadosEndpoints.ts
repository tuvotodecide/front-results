import { apiSlice } from "../apiSlice";

interface GetResultsParams {
  department?: string;
  province?: string;
  municipality?: string;
}

export const resultadosApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getResults: builder.query<any, GetResultsParams>({
      query: (params) => ({
        url: "/public/results",
        params,
      }),
      keepUnusedDataFor: 60,
    }),
    getStatistics: builder.query<any, void>({
      query: () => "/public/results/statistics",
      keepUnusedDataFor: 60,
    }),
    getResultsByTableNumber: builder.query<any, string>({
      query: (tableNumber) => `/public/results/tables/${tableNumber}`,
      keepUnusedDataFor: 60,
    }),
  }),
});

export const {
  useGetResultsQuery, // Hook to get results
  useGetStatisticsQuery, // Hook to get statistics
  useLazyGetResultsByTableNumberQuery, // Lazy query to get results by table number
} = resultadosApiSlice;

/**
 * const { data } = useGetResultsQuery();
   const { data: statistics } = useGetStatisticsQuery();
   console.log("statistics", statistics);
 */
