import { apiSlice } from '../apiSlice';
import {
  AssignElectionPartiesType,
  ElectionPartyType,
  UpdateElectionPartyType,
} from '../../types';

// by-department devuelve provinceId poblado; aquí solo se usan id y nombre
export interface MunicipalityOptionType {
  _id: string;
  name: string;
}

export const electionPartiesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getElectionParties: builder.query<ElectionPartyType[], string>({
      query: (electionId) =>
        `/political/election-parties/by-election/${electionId}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, electionId) => [
        { type: 'ElectionParties' as const, id: electionId },
      ],
    }),
    assignElectionParties: builder.mutation<
      { assigned: number },
      AssignElectionPartiesType
    >({
      query: (body) => ({
        url: '/political/election-parties/assign-bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { electionId }) => [
        { type: 'ElectionParties' as const, id: electionId },
      ],
    }),
    // electionId solo se usa para invalidar la caché de esa elección
    updateElectionParty: builder.mutation<
      ElectionPartyType,
      { id: string; electionId: string; item: UpdateElectionPartyType }
    >({
      query: ({ id, item }) => ({
        url: `/political/election-parties/${id}`,
        method: 'PATCH',
        body: item,
      }),
      invalidatesTags: (_result, _error, { electionId }) => [
        { type: 'ElectionParties' as const, id: electionId },
      ],
    }),
    getMunicipalitiesByDepartmentId: builder.query<
      MunicipalityOptionType[],
      string
    >({
      query: (departmentId) =>
        `/geographic/municipalities/by-department/${departmentId}`,
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetElectionPartiesQuery,
  useAssignElectionPartiesMutation,
  useUpdateElectionPartyMutation,
  useGetMunicipalitiesByDepartmentIdQuery,
} = electionPartiesApiSlice;
