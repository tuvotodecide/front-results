import { apiSlice } from "../apiSlice";
import { Partido } from "../../types";

export const partidosApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPartidos: builder.query<Partido[], void>({
      query: () => "/admin/parties",
      keepUnusedDataFor: 60,
    }),
    getPartido: builder.query<Partido, string>({
      query: (id) => `/admin/parties/${id}`,
      keepUnusedDataFor: 60,
    }),
    createPartido: builder.mutation<Partido, Omit<Partido, "_id">>({
      query: (recinto) => ({
        url: "/admin/parties",
        method: "POST",
        body: recinto,
      }),
    }),
    updatePartido: builder.mutation<
      Partido,
      { id: string; partido: Partial<Partido> }
    >({
      query: ({ id, partido }) => ({
        url: `/admin/parties/${id}`,
        method: "PUT",
        body: partido,
      }),
    }),
    deletePartido: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/parties/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetPartidosQuery,
  useGetPartidoQuery,
  useCreatePartidoMutation,
  useUpdatePartidoMutation,
  useDeletePartidoMutation,
} = partidosApiSlice;
