import { apiSlice } from "../apiSlice";
import {
  PaginatedResponse,
  ElectoralSeatsType,
  ElectoralSeatByMunicipalityType,
  CreateElectoralSeatType,
  UpdateElectoralSeatType,
} from "../../types";

interface QueryElectoralSeatsParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: Record<string, any>;
  search?: string;
  active?: boolean;
}

export const electoralSeatsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getElectoralSeats: builder.query<
      PaginatedResponse<ElectoralSeatsType>,
      QueryElectoralSeatsParams
    >({
      query: (params) => ({
        url: "/geographic/electoral-seats",
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: "ElectoralSeats" as const, id: "LIST" }],
    }),
    getElectoralSeatsByMunicipalityId: builder.query<
      ElectoralSeatByMunicipalityType[],
      string
    >({
      query: (municipalityId) => ({
        url: '/geographic/electoral-seats/by-municipality/' + municipalityId,
      }),
      keepUnusedDataFor: 300,
      providesTags: (_result, _error, municipalityId) => [
        { type: 'ElectoralSeats' as const, id: municipalityId },
      ],
    }),
    // getElectoralSeatsByMunicipalityId: builder.query<any, string>({
    //   async queryFn(municipalityId) {
    //     const seats =
    //       municipalityId === "muni-1"
    //         ? [
    //             { _id: "seat-1", name: "Zona Central" },
    //             { _id: "seat-2", name: "Sopocachi" },
    //           ]
    //         : [{ _id: "seat-other", name: "Asiento de prueba" }];
    //     return { data: seats };
    //   },
    // }),
    getElectoralSeat: builder.query<ElectoralSeatsType, string>({
      query: (id) => `/geographic/electoral-seats/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: "ElectoralSeats" as const, id },
      ],
    }),
    // getElectoralSeat: builder.query<any, string>({
    //   async queryFn(id) {
    //     return { data: { _id: id, name: "Zona Central" } };
    //   },
    // }),
    createElectoralSeat: builder.mutation<
      ElectoralSeatsType,
      CreateElectoralSeatType
    >({
      query: (body) => ({
        url: "/geographic/electoral-seats",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ElectoralSeats", id: "LIST" }],
    }),
    updateElectoralSeat: builder.mutation<
      ElectoralSeatsType,
      { id: string; item: UpdateElectoralSeatType }
    >({
      query: ({ id, item }) => ({
        url: `/geographic/electoral-seats/${id}`,
        method: "PATCH",
        body: item,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ElectoralSeats", id: "LIST" },
        { type: "ElectoralSeats", id },
      ],
    }),
    deleteElectoralSeat: builder.mutation<void, string>({
      query: (id) => ({
        url: `/geographic/electoral-seats/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ElectoralSeats", id: "LIST" }],
    }),
  }),
});

export const {
  useGetElectoralSeatsQuery,
  useLazyGetElectoralSeatsQuery,
  useGetElectoralSeatsByMunicipalityIdQuery,
  useLazyGetElectoralSeatsByMunicipalityIdQuery,
  useGetElectoralSeatQuery,
  useLazyGetElectoralSeatQuery,
  useCreateElectoralSeatMutation,
  useUpdateElectoralSeatMutation,
  useDeleteElectoralSeatMutation,
} = electoralSeatsApiSlice;
