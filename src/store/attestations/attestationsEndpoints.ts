import { apiSlice } from "../apiSlice";
import {
  AttestationType,
  QueryParamsListAttestations,
  MostSupportedBallotType,
  AttestationCasesType,
} from "../../types";

export const attestationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // /api/v1/attestations
    getAttestations: builder.query<
      {
        data: AttestationType[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      },
      QueryParamsListAttestations & { electionId?: string }
    >({
      query: (params) => ({
        url: "/attestations",
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: "Attestations" as const, id: "LIST" }],
    }),
    // /api/v1/attestations/ballot/{ballotId}
    getAttestationsByBallotId: builder.query<AttestationType[], string>({
      query: (ballotId) => ({
        url: "/attestations/ballot/" + ballotId,
      }),
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, ballotId) => [
        { type: "Attestations" as const, id: ballotId },
      ],
    }),
    // getAttestationsByBallotId: builder.query<any, string>({
    //   async queryFn() {
    //     return {
    //       data: [
    //         {
    //           _id: "att-1",
    //           userName: "Juan Perez",
    //           support: true,
    //           userRole: "JURADO",
    //           createdAt: "2025-10-18T19:00:00Z",
    //         },
    //         {
    //           _id: "att-2",
    //           support: true,
    //           userName: "Maria Delgado",
    //           userRole: "CIUDADANO",
    //           createdAt: "2025-10-18T19:05:00Z",
    //         },
    //         {
    //           _id: "att-3",
    //           support: false,
    //           userName: "Carlos Ruiz",
    //           userRole: "CIUDADANO",
    //           createdAt: "2025-10-18T19:10:00Z",
    //         },
    //         {
    //           _id: "att-4",
    //           support: true,
    //           userRole: "CIUDADANO",
    //           createdAt: "2025-10-18T19:15:00Z",
    //         },
    //       ],
    //     };
    //   },
    // }),
    // /api/v1/attestations/most-supported/{tableCode}
    getMostSupportedBallotByTableCode: builder.query<
      MostSupportedBallotType,
      { tableCode: string; electionId?: string }
    >({
      query: ({ tableCode, electionId }) => ({
        url: `/attestations/most-supported/${tableCode}`,
        params: { electionId },
      }),
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, { tableCode }) => [
        { type: "Attestations" as const, id: tableCode },
      ],
    }),

    // getMostSupportedBallotByTableCode: builder.query<any, any>({
    //   async queryFn() {
    //     return {
    //       data: {
    //         ballotId: "id-mesa-real",
    //         supportCount: 45,
    //         totalAttestations: 50,
    //       },
    //     };
    //   },
    // }),
    // /api/v1/attestations/cases/{tableCode}
    getAttestationCasesByTableCode: builder.query<
      AttestationCasesType,
      { tableCode: string; electionId?: string }
    >({
      query: ({ tableCode, electionId }) => ({
        url: `/attestations/cases/${tableCode}`,
        params: { electionId },
      }),
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, { tableCode }) => [
        { type: "Attestations" as const, id: tableCode },
      ],
    }),
    // /api/v1/attestations/by-department-id/{departmentId}
    getAttestationsByDepartmentId: builder.query<
      {
        data: AttestationType[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      },
      { departmentId: string } & QueryParamsListAttestations & {
          electionId?: string;
        }
    >({
      query: ({ departmentId, ...params }) => ({
        url: `/attestations/by-department-id/${departmentId}`,
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, { departmentId }) => [
        { type: "Attestations" as const, id: `dept-${departmentId}` },
      ],
    }),
    // /api/v1/attestations/by-province-id/{provinceId}
    getAttestationsByProvinceId: builder.query<
      {
        data: AttestationType[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      },
      { provinceId: string } & QueryParamsListAttestations & {
          electionId?: string;
        }
    >({
      query: ({ provinceId, ...params }) => ({
        url: `/attestations/by-province-id/${provinceId}`,
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, { provinceId }) => [
        { type: "Attestations" as const, id: `prov-${provinceId}` },
      ],
    }),
    // /api/v1/attestations/by-municipality-id/{municipalityId}
    getAttestationsByMunicipalityId: builder.query<
      {
        data: AttestationType[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      },
      { municipalityId: string } & QueryParamsListAttestations & {
          electionId?: string;
        }
    >({
      query: ({ municipalityId, ...params }) => ({
        url: `/attestations/by-municipality-id/${municipalityId}`,
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, { municipalityId }) => [
        { type: "Attestations" as const, id: `muni-${municipalityId}` },
      ],
    }),
  }),
});

export const {
  useGetAttestationsQuery,
  useGetAttestationsByBallotIdQuery,
  useGetMostSupportedBallotByTableCodeQuery,
  useGetAttestationCasesByTableCodeQuery,
  useGetAttestationsByDepartmentIdQuery,
  useGetAttestationsByProvinceIdQuery,
  useGetAttestationsByMunicipalityIdQuery,
} = attestationsApiSlice;
