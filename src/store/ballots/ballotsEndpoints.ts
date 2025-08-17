import { apiSlice } from '../apiSlice';
import { BallotType } from '../../types';

export const ballotsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBallot: builder.query<BallotType, string>({
      query: (id) => `/ballots/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [{ type: 'Ballots' as const, id }],
    }),
    getBallotByTableCode: builder.query<BallotType[], string>({
      query: (tableCode) => `/ballots/by-table/${tableCode}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, tableCode) => [
        { type: 'Ballots' as const, id: tableCode },
      ],
    }),
  }),
});

export const {
  useGetBallotQuery,
  useGetBallotByTableCodeQuery,
  useLazyGetBallotByTableCodeQuery,
} = ballotsApiSlice;
