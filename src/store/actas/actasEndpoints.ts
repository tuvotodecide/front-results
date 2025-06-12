import { Ballot } from "../../types";
import { apiSlice } from "../apiSlice";

interface BallotResponse {
  ballots: Ballot[];
  total: number;
}

export const actasApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBallots: builder.query<BallotResponse, void>({
      query: () => "/public/ballots",
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: "Ballots" as const, id: "LIST" }],
    }),
    getBallot: builder.query<Ballot, string>({
      query: (id) => `/public/ballots/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [{ type: "Ballots" as const, id }],
    }),
    submitBallot: builder.mutation({
      query: (ballot) => ({
        url: "/public/ballots",
        method: "POST",
        body: ballot,
      }),
    }),
  }),
});

export const {
  useSubmitBallotMutation, // Hook to submit a ballot
  useGetBallotsQuery, // Hook to get all ballots
  useGetBallotQuery, // Hook to get a specific ballot by ID
  useLazyGetBallotQuery, // Lazy query to get a specific ballot by ID
} = actasApiSlice;
