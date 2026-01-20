import { apiSlice } from "../apiSlice";

export type GroupBy = "delegate" | "location" | "table";

export interface MyActiveContractResponse {
  hasContract: boolean;
  contract?: {
    id: string;
    electionId: string; // ← IMPORTANTE
    role: "MAYOR" | "GOVERNOR";
    territory: {
      type: "municipality" | "department";
      departmentId?: string;
      departmentName?: string;
      municipalityId?: string;
      municipalityName?: string;
    };
    active: boolean;
  };
}

export interface MyContractResponse {
  hasContract: boolean;
  contract?: {
    id: string;
    role: "MAYOR" | "GOVERNOR";
    territory: {
      type: "municipality" | "department";
      departmentName?: string;
      municipalityName?: string;
    };
    period: { startDate: string; endDate?: string | null };
    active: boolean;
  };
  message?: string;
}

export interface ExecutiveSummaryResponse {
  contract: {
    id: string;
    clientRole: "MAYOR" | "GOVERNOR";
    territory: {
      departmentName?: string;
      municipalityName?: string;
    };
  };
  summary: {
    totalDelegatesAuthorized: number;
    activeDelegates: number;
    participationRate: string; // "12.34%"
    totalAttestations: number;
    uniqueTablesAttested: number;
    uniqueLocationsAttested: number;
    avgAttestationsPerDelegate: string; // "3.21"
  };
}

export interface DelegateActivityTableRow {
  tableCode: string;
  location?: string;
  delegatesCount: number;
  totalAttestations: number;
  support: number;
  against: number;
  firstAttestation?: string;
  lastAttestation?: string;

  ballotIds?: string[];
  ballotsCount?: number;
}

export interface DelegateActivityResponse {
  groupBy: GroupBy;

  // solo en groupBy=delegate (tu backend lo manda)
  totalDelegates?: number;
  activeDelegates?: number;

  // groupBy=table o location: tu backend manda data
  totalTables?: number;
  totalLocations?: number;

  data: any[];
}

export const clientReportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyContract: builder.query<MyContractResponse, { electionId: string }>({
      query: ({ electionId }) => ({
        url: `/client-reports/my-contract`,
        params: { electionId },
      }),
      providesTags: ["ClientReports"],
    }),

    getExecutiveSummary: builder.query<
      ExecutiveSummaryResponse,
      { electionId: string }
    >({
      query: ({ electionId }) => ({
        url: `/client-reports/executive-summary`,
        params: { electionId },
      }),
      providesTags: ["ClientReports"],
    }),
    
    getMyActiveContract: builder.query<MyActiveContractResponse, {}>({
      query: () => `/client-reports/my-active-contract`,
      providesTags: ["ClientReports"],
    }),

    getDelegateActivity: builder.query<
      DelegateActivityResponse,
      { electionId: string; groupBy?: GroupBy }
    >({
      query: ({ electionId, groupBy = "delegate" }) => ({
        url: `/client-reports/delegate-activity`,
        params: { electionId, groupBy },
      }),
      providesTags: ["ClientReports"],
    }),
  }),
});

export const {
  useGetMyContractQuery,
  useGetMyActiveContractQuery,
  useGetExecutiveSummaryQuery,
  useGetDelegateActivityQuery,
} = clientReportsApi;
