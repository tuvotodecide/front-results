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

export interface MyElection {
  electionId: string;
  electionName: string;
  electionType: string;
  round: number;
  isActive: boolean;
  contracts: ContractInfo[];
}

export type MyElectionsResponse = MyElection[];

export const contractsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyElections: builder.query<MyElectionsResponse, void>({
      query: () => `/contracts/my-elections`,
      providesTags: ["Contracts"],
    }),
  }),
});

export const { useGetMyElectionsQuery } = contractsApi;
