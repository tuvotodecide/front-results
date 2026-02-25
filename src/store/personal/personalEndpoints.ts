import { ParticipacionResponse, AuditoriaResponse, PersonalFilters } from "../../types";
import { apiSlice } from "../apiSlice";

export const personalApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getParticipacionPersonal: builder.query<ParticipacionResponse, void>({
      query: () => "/personal/participacion",
    }),
    getAuditoriaTSE: builder.query<AuditoriaResponse, PersonalFilters>({
      query: (params) => ({
        url: "/personal/auditoria",
        params,
      }),
    }),
  }),
});

export const { useGetParticipacionPersonalQuery, useGetAuditoriaTSEQuery } = personalApiSlice;
