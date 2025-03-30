import { apiSlice } from "../apiSlice";

export const actasApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
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
} = actasApiSlice;
