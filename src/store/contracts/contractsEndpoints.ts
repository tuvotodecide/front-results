import { apiSlice } from "../apiSlice";

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
  }),
});

export const { useGetMyElectionsQuery, useGetPublicActiveContractsQuery } = contractsApi;
