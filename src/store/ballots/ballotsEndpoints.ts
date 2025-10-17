// C:\apps\front-results\src\store\ballots\ballotsEndpoints.ts
import { apiSlice } from "../apiSlice";
import { BallotType } from "../../types";

export const ballotsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBallot: builder.query<BallotType, string>({
      query: (id) => `/ballots/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_r, _e, id) => [{ type: "Ballots" as const, id }],
    }),
    getBallotByTableCode: builder.query<
      BallotType[],
      { tableCode: string; electionId?: string }
    >({
      query: ({ tableCode, electionId }) => ({
        url: `/ballots/by-table/${tableCode}`,
        params: { electionId },
      }),
      keepUnusedDataFor: 60,
      providesTags: (_r, _e, { tableCode }) => [
        { type: "Ballots" as const, id: tableCode },
      ],
    }),
  }),
});

export const {
  useGetBallotQuery,
  useGetBallotByTableCodeQuery,
  useLazyGetBallotByTableCodeQuery,
  useLazyGetBallotQuery
} = ballotsApiSlice;
