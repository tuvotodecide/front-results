import { apiSlice } from "../apiSlice";

export type GroupBy = "delegate" | "location" | "table";

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

export interface DelegateActivityResponse {
  groupBy: GroupBy;
  // si groupBy=delegate:
  totalDelegates?: number;
  activeDelegates?: number;
  data: any[]; // lo tipas luego si quieres, por ahora no te frena
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
  useGetExecutiveSummaryQuery,
  useGetDelegateActivityQuery,
} = clientReportsApi;
