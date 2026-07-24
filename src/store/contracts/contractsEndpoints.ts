import { apiSlice } from "../apiSlice";
import type { HistoryContractsResponse } from "@/shared/tvd/superadminTvdTypes";
import { getRuntimeEnv } from "@/shared/system/runtimeEnv";

export interface ContractTerritory {
  type: "municipality" | "department";
  departmentId?: string;
  departmentName?: string;
  municipalityId?: string;
  municipalityName?: string;
}

export interface ContractInfo {
  contractId: string;
  active: boolean;
  clientRole: "MAYOR" | "GOVERNOR";
  territory: ContractTerritory;
}

export interface PublicContractInfo {
  contractId: string;
  clientRole: "MAYOR" | "GOVERNOR";
  election: {
    electionId: string;
    electionName: string;
    electionType?: "municipal" | "departamental" | "presidential";
    round?: number;
  };
  territory: ContractTerritory;
  active: boolean;
}

export interface MyElection {
  electionId: string;
  electionName: string;
  electionType: string;
  round: number;
  isActive: boolean;
  contracts: ContractInfo[];
}

export type MyElectionsResponse = MyElection[];
export interface PublicContractsResponse {
  data: PublicContractInfo[];
  total: number;
}

const getHistoryContractsUrl = () => {
  const baseUrl = String(
    getRuntimeEnv("VITE_BASE_API_URL", "NEXT_PUBLIC_BASE_API_URL") ?? "",
  ).trim();
  if (!baseUrl) return "/history/contracts";
  const rootUrl = baseUrl.replace(/\/api\/v1\/?$/i, "").replace(/\/$/, "");
  return `${rootUrl}/history/contracts`;
};

export const contractsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyElections: builder.query<MyElectionsResponse, void>({
      query: () => `/contracts/my-elections`,
      providesTags: ["Contracts"],
    }),
    getPublicActiveContracts: builder.query<
      PublicContractsResponse,
      { electionId?: string; electionType?: "municipal" | "departamental" | "presidential" } | void
    >({
      query: (params) => ({
        url: `/contracts/public-active`,
        params: params ?? undefined,
      }),
      providesTags: ["Contracts"],
    }),
    getHistoryContracts: builder.query<HistoryContractsResponse, void>({
      query: () => ({
        url: getHistoryContractsUrl(),
        method: "GET",
      }),
      providesTags: ["Contracts"],
    }),
  }),
});

export const {
  useGetMyElectionsQuery,
  useGetPublicActiveContractsQuery,
  useGetHistoryContractsQuery,
} = contractsApi;
