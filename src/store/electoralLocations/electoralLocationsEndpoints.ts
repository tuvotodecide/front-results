import { apiSlice } from "../apiSlice";
import {
  PaginatedResponse,
  ElectoralLocationsType,
  ElectoralLocationByElectoralSeatType,
  CreateElectoralLocationType,
  UpdateElectoralLocationType,
} from "../../types";

interface QueryElectoralLocationsParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: Record<string, any>;
  search?: string;
  active?: boolean;
}

export const electoralLocationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getElectoralLocations: builder.query<
      PaginatedResponse<ElectoralLocationsType>,
      QueryElectoralLocationsParams
    >({
      query: (params) => ({
        url: "/geographic/electoral-locations",
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: "ElectoralLocations" as const, id: "LIST" }],
    }),
    getElectoralLocationsByElectoralSeatId: builder.query<
      ElectoralLocationByElectoralSeatType[],
      string
    >({
      query: (electoralSeatId) => ({
        url:
          '/geographic/electoral-locations/by-electoral-seat/' +
          electoralSeatId,
      }),
      keepUnusedDataFor: 300,
      providesTags: (_result, _error, electoralSeatId) => [
        { type: 'ElectoralLocations' as const, id: electoralSeatId },
      ],
    }),
    // getElectoralLocationsByElectoralSeatId: builder.query<any, string>({
    //   async queryFn(electoralSeatId) {
    //     const locations =
    //       electoralSeatId === "seat-1"
    //         ? [
    //             {
    //               _id: "loc-1",
    //               name: "Colegio Don Bosco",
    //               address: "Av. 16 de Julio",
    //             },
    //             {
    //               _id: "loc-2",
    //               name: "Escuela México",
    //               address: "Calle México",
    //             },
    //           ]
    //         : [
    //             {
    //               _id: "loc-other",
    //               name: "Recinto de prueba",
    //               address: "Dirección conocida",
    //             },
    //           ];
    //     return { data: locations };
    //   },
    // }),
    getElectoralLocation: builder.query<ElectoralLocationsType, string>({
      query: (id) => `/geographic/electoral-locations/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: "ElectoralLocations" as const, id },
      ],
    }),
    // getElectoralLocation: builder.query<any, string>({
    //   async queryFn(id) {
    //     return {
    //       data: {
    //         _id: id,
    //         name: "Colegio Don Bosco",
    //         address: "Av. 16 de Julio",
    //       },
    //     };
    //   },
    // }),
    createElectoralLocation: builder.mutation<
      ElectoralLocationsType,
      CreateElectoralLocationType
    >({
      query: (body) => ({
        url: "/geographic/electoral-locations",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ElectoralLocations", id: "LIST" }],
    }),
    updateElectoralLocation: builder.mutation<
      ElectoralLocationsType,
      { id: string; item: UpdateElectoralLocationType }
    >({
      query: ({ id, item }) => ({
        url: `/geographic/electoral-locations/${id}`,
        method: "PATCH",
        body: item,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ElectoralLocations", id: "LIST" },
        { type: "ElectoralLocations", id },
      ],
    }),
    deleteElectoralLocation: builder.mutation<void, string>({
      query: (id) => ({
        url: `/geographic/electoral-locations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ElectoralLocations", id: "LIST" }],
    }),
  }),
});

export const {
  useGetElectoralLocationsQuery,
  useLazyGetElectoralLocationsQuery,
  useGetElectoralLocationsByElectoralSeatIdQuery,
  useLazyGetElectoralLocationsByElectoralSeatIdQuery,
  useGetElectoralLocationQuery,
  useLazyGetElectoralLocationQuery,
  useCreateElectoralLocationMutation,
  useUpdateElectoralLocationMutation,
  useDeleteElectoralLocationMutation,
} = electoralLocationsApiSlice;
