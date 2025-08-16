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
      AttestationType[],
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
    getAttestationCasesByTableCode: builder.query<
      AttestationCasesType[],
      string
    >({
      query: (tableCode) => `/attestations/cases/${tableCode}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, tableCode) => [
        { type: 'Attestations' as const, id: tableCode },
      ],
    }),
  }),
});

export const {
  useGetAttestationsQuery,
  useGetAttestationsByBallotIdQuery,
  useGetMostSupportedBallotByTableCodeQuery,
  useGetAttestationCasesByTableCodeQuery,
} = attestationsApiSlice;
