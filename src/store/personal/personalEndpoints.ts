import { apiSlice } from "../apiSlice";

export interface AuditMatchDetail {
  _id: string;
  ballotId: string | null;
  recinto: string;
  mesa: string;
  tableCode: string;
  version?: number | null;
  testigo: string;
  auditoria: "Sin Obs" | "No coincide" | "Pendiente";
  comparisonStatus: "MATCH" | "MISMATCH" | "NO_TSE_DATA" | "ERROR" | "PENDING";
  comparedAt?: string | null;
  mismatches?: Array<{
    field: string;
    label: string;
    local: number;
    tse: number;
    kind: "party" | "metric";
  }>;
}

export interface AuditMatchResponse {
  observados: number;
  sinObservaciones: number;
  pendientes: number;
  total: number;
  details: AuditMatchDetail[];
}

interface PersonalParticipationResponse {
  summary: {
    contratados: number;
    participaron: number;
    faltantes: number;
  };
  details: Array<{
    _id: string;
    recinto: string;
    mesa: string;
    usuario: string;
    estado: string;
    ballotId: string | null;
  }>;
}

export const personalApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getParticipacionPersonal: builder.query<PersonalParticipationResponse, void>({
      async queryFn() {
        const mockData = [
          {
            _id: "1",
            recinto: "Col. Simón Bolivar",
            mesa: "1024",
            usuario: "Juan Pérez",
            estado: "Recibida",
            ballotId: "b1",
          },
          {
            _id: "2",
            recinto: "Col. Simón Bolivar",
            mesa: "1025",
            usuario: "---",
            estado: "Faltante",
            ballotId: null,
          },
          {
            _id: "3",
            recinto: "Col. Simón Bolivar",
            mesa: "1026",
            usuario: "Maria López",
            estado: "Recibida",
            ballotId: "b2",
          },
          {
            _id: "4",
            recinto: "Col. Simón Bolivar",
            mesa: "1027",
            usuario: "Juan Pérez",
            estado: "Recibida",
            ballotId: "b3",
          },
          {
            _id: "5",
            recinto: "Esc. 12 de Abril",
            mesa: "2030",
            usuario: "Carlos Ruiz",
            estado: "Recibida",
            ballotId: "b4",
          },
        ];

        return {
          data: {
            summary: { contratados: 83, participaron: 73, faltantes: 10 },
            details: mockData,
          },
        };
      },
    }),
    getAuditoriaTSE: builder.query<AuditMatchResponse, Record<string, string | undefined>>({
      query: (filters) => ({
        url: "/client-reports/audit-match",
        params: filters,
      }),
      providesTags: ["ClientReports"],
    }),
  }),
});

export const { useGetParticipacionPersonalQuery, useGetAuditoriaTSEQuery } =
  personalApiSlice;
