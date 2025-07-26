import { apiSlice } from "../apiSlice";
import { ElectoralLocationsType } from "../../types";

export const electoralLocationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getElectoralLocationsByElectoralSeatId: builder.query<
      ElectoralLocationsType[],
      string
    >({
      query: (electoralSeatId) => ({
        url:
          "/geographic/electoral-locations/by-electoral-seat/" +
          electoralSeatId,
      }),
      keepUnusedDataFor: 300,
      providesTags: (_result, _error, electoralSeatId) => [
        { type: "ElectoralLocations" as const, id: electoralSeatId },
      ],
    }),
    getElectoralLocation: builder.query<ElectoralLocationsType, string>({
      query: (id) => `/geographic/electoral-locations/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: "ElectoralLocations" as const, id },
      ],
    }),
  }),
});

export const {
  useGetElectoralLocationsByElectoralSeatIdQuery,
  useLazyGetElectoralLocationsByElectoralSeatIdQuery,
  useLazyGetElectoralLocationQuery,
} = electoralLocationsApiSlice;
