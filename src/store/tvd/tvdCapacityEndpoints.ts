import { apiSlice } from "../apiSlice";
import type {
  TvdEstimatedCapacityRequest,
  TvdEstimatedCapacityResponse,
  TvdEventCapacityResponse,
} from "./tvdCapacityTypes";

export const tvdCapacityEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    estimateMyTvdCapacity: builder.mutation<
      TvdEstimatedCapacityResponse,
      TvdEstimatedCapacityRequest
    >({
      query: (body) => ({
        url: "/tvd/me/estimated-capacity",
        method: "POST",
        body,
      }),
    }),
    getVotingEventTvdCapacity: builder.query<
      TvdEventCapacityResponse,
      { eventId: string }
    >({
      query: ({ eventId }) => ({
        url: `/voting/events/${eventId}/tvd-capacity`,
        method: "GET",
      }),
      providesTags: (_result, _error, arg) => [
        { type: "TvdEventCapacity", id: arg.eventId },
      ],
    }),
  }),
});

export const {
  useEstimateMyTvdCapacityMutation,
  useGetVotingEventTvdCapacityQuery,
} = tvdCapacityEndpoints;
