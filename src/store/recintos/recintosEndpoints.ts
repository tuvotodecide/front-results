import { apiSlice } from "../apiSlice";
import { RecintoElectoral } from "../../types";

export const recintosApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRecintos: builder.query<RecintoElectoral[], void>({
      query: () => "/admin/locations",
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: "Recintos" as const, id: "LIST" }],
    }),
    getRecinto: builder.query<RecintoElectoral, string>({
      query: (id) => `/admin/locations/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: "Recintos" as const, id },
      ],
    }),
    createRecinto: builder.mutation<
      RecintoElectoral,
      Omit<RecintoElectoral, "_id">
    >({
      query: (recinto) => ({
        url: "/admin/locations",
        method: "POST",
        body: recinto,
      }),
      invalidatesTags: ["Recintos"],
    }),
    updateRecinto: builder.mutation<
      RecintoElectoral,
      { id: string; recinto: Partial<RecintoElectoral> }
    >({
      query: ({ id, recinto }) => ({
        url: `/admin/locations/${id}`,
        method: "PUT",
        body: recinto,
      }),
      invalidatesTags: ["Recintos"],
    }),
    deleteRecinto: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/locations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Recintos"],
    }),
  }),
});

export const {
  useGetRecintosQuery,
  useGetRecintoQuery,
  useCreateRecintoMutation,
  useUpdateRecintoMutation,
  useDeleteRecintoMutation,
} = recintosApiSlice;
