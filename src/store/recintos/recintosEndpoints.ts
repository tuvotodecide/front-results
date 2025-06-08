import { apiSlice } from "../apiSlice";
import { RecintoElectoral } from "../../types";

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface GetRecintosParams {
  page?: number;
  limit?: number;
}

export const recintosApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRecintos: builder.query<
      PaginatedResponse<RecintoElectoral>,
      GetRecintosParams
    >({
      query: (params = {}) => ({
        url: "/admin/locations",
        params,
      }),
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
    getDepartments: builder.query<string[], void>({
      query: () => "/admin/locations/departments",
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: "Recintos" as const, id: "DEPARTMENTS" }],
    }),
    getProvinces: builder.query<string[], string>({
      query: (department) => ({
        url: "/admin/locations/provinces",
        params: { department },
      }),
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: "Recintos" as const, id: "PROVINCES" }],
    }),
    getMunicipalities: builder.query<
      string[],
      { department: string; province: string }
    >({
      query: ({ department, province }) => ({
        url: "/admin/locations/municipalities",
        params: { department, province },
      }),
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: "Recintos" as const, id: "MUNICIPALITIES" }],
    }),
  }),
});

export const {
  useGetRecintosQuery,
  useGetRecintoQuery,
  useCreateRecintoMutation,
  useUpdateRecintoMutation,
  useDeleteRecintoMutation,
  useGetDepartmentsQuery,
  useGetProvincesQuery,
  useLazyGetProvincesQuery,
  useGetMunicipalitiesQuery,
  useLazyGetMunicipalitiesQuery,
} = recintosApiSlice;
