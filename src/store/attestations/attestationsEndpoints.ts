import { apiSlice } from '../apiSlice';
import {
  AttestationType,
  QueryParamsListAttestations,
  MostSupportedBallotType,
  AttestationCasesType,
} from '../../types';

export const attestationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // /api/v1/attestations
    getAttestations: builder.query<
      { data: AttestationType[]; total: number; page: number; limit: number; totalPages: number },
      QueryParamsListAttestations
    >({
      query: (params) => ({
        url: '/attestations',
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: 'Attestations' as const, id: 'LIST' }],
    }),
    // /api/v1/attestations/ballot/{ballotId}
    getAttestationsByBallotId: builder.query<AttestationType[], string>({
      query: (ballotId) => ({
        url: '/attestations/ballot/' + ballotId,
      }),
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, ballotId) => [
        { type: 'Attestations' as const, id: ballotId },
      ],
    }),
    // /api/v1/attestations/most-supported/{tableCode}
    getMostSupportedBallotByTableCode: builder.query<
      MostSupportedBallotType,
      string
    >({
      query: (tableCode) => `/attestations/most-supported/${tableCode}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, tableCode) => [
        { type: 'Attestations' as const, id: tableCode },
      ],
    }),
    // /api/v1/attestations/cases/{tableCode}
    getAttestationCasesByTableCode: builder.query<AttestationCasesType, string>(
      {
        query: (tableCode) => `/attestations/cases/${tableCode}`,
        keepUnusedDataFor: 60,
        providesTags: (_result, _error, tableCode) => [
          { type: 'Attestations' as const, id: tableCode },
        ],
      }
    ),
    // /api/v1/attestations/by-department-id/{departmentId}
    getAttestationsByDepartmentId: builder.query<
      { data: AttestationType[]; total: number; page: number; limit: number; totalPages: number },
      { departmentId: string } & QueryParamsListAttestations
    >({
      query: ({ departmentId, ...params }) => ({
        url: `/attestations/by-department-id/${departmentId}`,
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, { departmentId }) => [
        { type: 'Attestations' as const, id: `dept-${departmentId}` },
      ],
    }),
    // /api/v1/attestations/by-province-id/{provinceId}
    getAttestationsByProvinceId: builder.query<
      { data: AttestationType[]; total: number; page: number; limit: number; totalPages: number },
      { provinceId: string } & QueryParamsListAttestations
    >({
      query: ({ provinceId, ...params }) => ({
        url: `/attestations/by-province-id/${provinceId}`,
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, { provinceId }) => [
        { type: 'Attestations' as const, id: `prov-${provinceId}` },
      ],
    }),
    // /api/v1/attestations/by-municipality-id/{municipalityId}
    getAttestationsByMunicipalityId: builder.query<
      { data: AttestationType[]; total: number; page: number; limit: number; totalPages: number },
      { municipalityId: string } & QueryParamsListAttestations
    >({
      query: ({ municipalityId, ...params }) => ({
        url: `/attestations/by-municipality-id/${municipalityId}`,
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, { municipalityId }) => [
        { type: 'Attestations' as const, id: `muni-${municipalityId}` },
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
