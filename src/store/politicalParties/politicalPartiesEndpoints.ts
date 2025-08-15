import { apiSlice } from '../apiSlice';
import {
  CreatePoliticalPartyType,
  PoliticalPartiesType,
  UpdatePoliticalPartyType,
} from '../../types';

export const politicalPartiesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPoliticalParties: builder.query<PoliticalPartiesType[], void>({
      query: () => '/political-parties',
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: 'PoliticalParties' as const, id: 'LIST' }],
    }),
    getPoliticalParty: builder.query<PoliticalPartiesType, string>({
      query: (id) => `/political-parties/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: 'PoliticalParties' as const, id },
      ],
    }),
    createPoliticalParty: builder.mutation<
      PoliticalPartiesType,
      CreatePoliticalPartyType
    >({
      query: (recinto) => ({
        url: '/political-parties',
        method: 'POST',
        body: recinto,
      }),
      invalidatesTags: [{ type: 'PoliticalParties' as const, id: 'LIST' }],
    }),
    updatePoliticalParty: builder.mutation<
      PoliticalPartiesType,
      { id: string; item: UpdatePoliticalPartyType }
    >({
      query: ({ id, item }) => ({
        url: `/political-parties/${id}`,
        method: 'PATCH',
        body: item,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'PoliticalParties' as const, id: 'LIST' },
        { type: 'PoliticalParties' as const, id },
      ],
    }),
    deletePoliticalParty: builder.mutation<void, string>({
      query: (id) => ({
        url: `/political-parties/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'PoliticalParties' as const, id: 'LIST' },
        { type: 'PoliticalParties' as const, id },
      ],
    }),
  }),
});

export const {
  useGetPoliticalPartiesQuery,
  useGetPoliticalPartyQuery,
  useCreatePoliticalPartyMutation,
  useUpdatePoliticalPartyMutation,
  useDeletePoliticalPartyMutation,
} = politicalPartiesApiSlice;
