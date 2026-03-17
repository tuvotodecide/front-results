import { ResultsResponse, StatisticsResponse, RegistrationProgress, BallotType } from "../../types";
import { apiSlice } from "../apiSlice";

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

interface GetCountedBallotsParams {
  electionType: string;
  electionId?: string;
  department?: string;
  province?: string;
  municipality?: string;
  electoralLocation?: string;
  page?: number;
  limit?: number;
}

interface CountedBallotsResponse {
  data: BallotType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  mode: string;
}

export const resultadosApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getResultsByLocation: builder.query<ResultsResponse, GetResultsParams>({
      query: (params) => ({
        url: "/results/by-location",
        params,
      }),
      keepUnusedDataFor: 60,
    }),
    getLiveResultsByLocation: builder.query<ResultsResponse, GetResultsParams>({
      query: (params) => ({
        url: "/results/live/by-location",
        params,
      }),
      keepUnusedDataFor: 30,
    }),
    getStatistics: builder.query<StatisticsResponse, void>({
      query: () => "/results/statistics",
      keepUnusedDataFor: 60,
    }),
    getRegistrationProgress: builder.query<RegistrationProgress, GetResultsParams>({
      query: (params) => ({
        url: `/results/registration-progress`,
        params,
      }),
      keepUnusedDataFor: 60,
    }),
    // Obtener ballots que cuentan en resultados LIVE (preliminares)
    getLiveCountedBallots: builder.query<CountedBallotsResponse, GetCountedBallotsParams>({
      query: (params) => ({
        url: "/results/live/ballots",
        params,
      }),
      keepUnusedDataFor: 30,
    }),
    // Obtener ballots que cuentan en resultados FINALES
    getFinalCountedBallots: builder.query<CountedBallotsResponse, GetCountedBallotsParams>({
      query: (params) => ({
        url: "/results/final/ballots",
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
  useLazyGetLiveResultsByLocationQuery,
  // Nuevos hooks para ballots que cuentan
  useGetLiveCountedBallotsQuery,
  useLazyGetLiveCountedBallotsQuery,
  useGetFinalCountedBallotsQuery,
  useLazyGetFinalCountedBallotsQuery,
} = resultadosApiSlice;
