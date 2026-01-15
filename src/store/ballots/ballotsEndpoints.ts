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
    // getBallot: builder.query<any, string>({
    //   async queryFn(id) {
    //     return {
    //       data: {
    //         _id: id,
    //         tableCode: "20340",
    //         image: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    //         recordId: "nft-id-xyz",
    //         votes: {
    //           parties: {
    //             partyVotes: [
    //               { partyId: "MAS", votes: 100 },
    //               { partyId: "CC", votes: 80 },
    //             ],
    //             validVotes: 180,
    //             nullVotes: 2,
    //             blankVotes: 1,
    //           },
    //         },
    //         location: {
    //           department: "La Paz",
    //           province: "Murillo",
    //           municipality: "La Paz",
    //           electoralLocationName: "Colegio Don Bosco",
    //           electoralSeat: "Zona Central",
    //         },
    //       },
    //     };
    //   },
    // }),
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
    // getBallotByTableCode: builder.query<any, any>({
    //   async queryFn({ tableCode }) {
    //     return {
    //       data: [
    //         {
    //           _id: "ballot-101",
    //           tableCode: tableCode,
    //           version: "Original Escaneada",
    //           image: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    //           recordId: "nft-mesa-" + tableCode,
    //           ipfsUri: "https://ipfs.io/ipfs/metadata-fake",
    //           votes: {
    //             parties: {
    //               partyVotes: [
    //                 { partyId: "MAS", votes: 120 },
    //                 { partyId: "CC", votes: 95 },
    //                 { partyId: "CREEMOS", votes: 10 },
    //               ],
    //               validVotes: 225,
    //               nullVotes: 5,
    //               blankVotes: 2,
    //             },
    //             deputies: {
    //               partyVotes: [
    //                 { partyId: "MAS", votes: 110 },
    //                 { partyId: "CC", votes: 105 },
    //               ],
    //             },
    //           },
    //           location: {
    //             department: "La Paz",
    //             province: "Murillo",
    //             municipality: "La Paz",
    //             electoralLocationName: "Colegio Don Bosco",
    //             electoralSeat: "Zona Central",
    //           },
    //         },
    //       ],
    //     };
    //   },
    // }),
  }),
});

export const {
  useGetBallotQuery,
  useGetBallotByTableCodeQuery,
  useLazyGetBallotByTableCodeQuery,
  useLazyGetBallotQuery,
} = ballotsApiSlice;
