import { apiSlice } from "../apiSlice";
import {
  ConfigurationStatusType,
  // PaginatedResponse,
  ConfigurationType,
  CreateConfigurationType,
  UpdateConfigurationType,
} from "../../types";

export const configurationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getConfigurations: builder.query<Array<ConfigurationType>, void>({
      query: () => ({
        url: "/elections/config",
      }),
      keepUnusedDataFor: 300,
      providesTags: () => [{ type: "Configurations" as const, id: "LIST" }],
    }),
    getConfiguration: builder.query<ConfigurationType, string>({
      query: (id) => `/elections/config/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: "Configurations" as const, id },
      ],
    }),
    getActiveConfiguration: builder.query<ConfigurationType, void>({
      query: () => `/elections/config/active`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error) => [{ type: "Configurations" as const }],
    }),
    getConfigurationStatus: builder.query<ConfigurationStatusType, void>({
      query: () => `/elections/config/status`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error) => [{ type: 'Configurations' as const }],
    }),
    // getConfigurationStatus: builder.query<any, void>({
    //   async queryFn() {
    //     return {
    //       data: {
    //         hasActiveConfig: true,
    //         isVotingPeriod: true, // true = Resultados Preliminares (TREP)
    //         isResultsPeriod: false, // true = Resultados Oficiales (Cómputo)
    //         config: {
    //           id: "eleccion-bolivia-2025",
    //           name: "Elecciones Generales 2025",
    //           resultsStartDateBolivia: "2025-10-18T18:00:00.000Z", // Fecha futura para probar el reloj
    //           status: "active",
    //         },
    //       },
    //     };
    //   },
    // }),
    createConfiguration: builder.mutation<
      ConfigurationType,
      CreateConfigurationType
    >({
      query: (item) => ({
        url: "/elections/config",
        method: "POST",
        body: item,
      }),
      invalidatesTags: [{ type: "Configurations", id: "LIST" }],
    }),
    updateConfiguration: builder.mutation<
      ConfigurationType,
      { id: string; item: UpdateConfigurationType }
    >({
      query: ({ id, item }) => ({
        url: `/elections/config/${id}`,
        method: "PATCH",
        body: item,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Configurations", id: "LIST" },
        { type: "Configurations", id },
      ],
    }),
    deleteConfiguration: builder.mutation<void, string>({
      query: (id) => ({
        url: `/elections/config/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Configurations", id: "LIST" },
        { type: "Configurations", id },
      ],
    }),
  }),
});

export const {
  useGetConfigurationsQuery,
  useLazyGetConfigurationsQuery,
  useGetConfigurationQuery,
  useGetActiveConfigurationQuery,
  useGetConfigurationStatusQuery,
  useLazyGetConfigurationQuery,
  useCreateConfigurationMutation,
  useUpdateConfigurationMutation,
  useDeleteConfigurationMutation,
} = configurationsApiSlice;
