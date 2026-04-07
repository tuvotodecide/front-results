import { apiSlice } from "../apiSlice";
import type { BallotType } from "../../types";

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

export type BallotResultItem = BallotType;

export interface ResultsSummary {
  validVotes?: number;
  nullVotes?: number;
  blankVotes?: number;
  tablesProcessed?: number;
  totalTables?: number;
  totalVoters?: number;
  registrationProgress?: number;
}

export interface ResultsByLocationResponse {
  results: Array<{
    partyId: string;
    totalVotes: number;
  }>;
  summary?: ResultsSummary;
}

interface CountedBallotsResponse {
  data: BallotResultItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  mode: string;
}

type StatisticsResponse = Record<string, unknown>;
type RegistrationProgressResponse = Record<string, unknown>;

export const resultadosApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getResultsByLocation: builder.query<ResultsByLocationResponse, GetResultsParams>({
      query: (params) => ({
        url: "/results/by-location",
        params,
      }),
      keepUnusedDataFor: 60,
    }),
    // getResultsByLocation: builder.query<any, any>({
    //   async queryFn(params) {
    //     // Simulamos que los resultados varían según el departamento seleccionado
    //     const isLaPaz =
    //       params.department === "La Paz" || params.departmentId === "1";

    //     return {
    //       data: {
    //         results: [
    //           { partyId: "MAS", totalVotes: isLaPaz ? 250000 : 180000 },
    //           { partyId: "CC", totalVotes: isLaPaz ? 150000 : 200000 },
    //           { partyId: "CREEMOS", totalVotes: isLaPaz ? 30000 : 150000 },
    //           { partyId: "UCS", totalVotes: 15000 },
    //           { partyId: "OTROS", totalVotes: 5000 },
    //         ],
    //         summary: {
    //           validVotes: isLaPaz ? 450000 : 545000,
    //           nullVotes: 12000,
    //           blankVotes: 8000,
    //           tablesProcessed: isLaPaz ? 4500 : 3800,
    //           totalTables: 5000,
    //           totalVoters: 600000,
    //           registrationProgress: 92.5,
    //         },
    //       },
    //     };
    //   },
    // }),
    getLiveResultsByLocation: builder.query<ResultsByLocationResponse, GetResultsParams>({
      query: (params) => ({
        url: "/results/live/by-location",
        params,
      }),
      keepUnusedDataFor: 30,
    }),
    // getLiveResultsByLocation: builder.query<any, GetResultsParams>({
    //   async queryFn(params) {
    //     console.log("Mocking LIVE results", params);
    //     return {
    //       data: {
    //         results: [
    //           { partyId: "MAS", totalVotes: 5500 },
    //           { partyId: "CC", totalVotes: 4800 },
    //           { partyId: "CREEMOS", totalVotes: 1200 },
    //           { partyId: "UCS", totalVotes: 600 },
    //         ],
    //         summary: {
    //           validVotes: 12100,
    //           nullVotes: 300,
    //           blankVotes: 150,
    //           tablesProcessed: 45,
    //           totalTables: 1000,
    //         },
    //       },
    //     };
    //   },
    // }),
    getStatistics: builder.query<StatisticsResponse, void>({
      query: () => "/results/statistics",
      keepUnusedDataFor: 60,
    }),
    getRegistrationProgress: builder.query<RegistrationProgressResponse, GetResultsParams>({
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
      query: (queryParams) => {
        const params = { ...queryParams };
        delete params.page;
        delete params.limit;

        return ({
        url: "/results/final/ballots",
        params,
        });
      },
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
