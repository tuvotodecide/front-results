import { apiSlice } from "../apiSlice";

export const personalApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getParticipacionPersonal: builder.query<any, any>({
      async queryFn() {
        // MOCK: Simulamos la lista de personas contratadas vs reporte
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
    getAuditoriaTSE: builder.query<any, any>({
      async queryFn(_filters) {
        // MOCK DATA
        return {
          data: {
            observados: 2,
            details: [
              {
                _id: "a1",
                recinto: "Col. Italia",
                mesa: "1123",
                testigo: "Pedro S.",
                auditoria: "Sin Obs",
                ballotId: "677d",
              },
              {
                _id: "a2",
                recinto: "Holanda",
                mesa: "1129",
                testigo: "Juan Peres",
                auditoria: "No coincide",
                ballotId: "677e",
              },
              {
                _id: "a3",
                recinto: "Holanda",
                mesa: "1122",
                testigo: "Juan Peres",
                auditoria: "No coincide",
                ballotId: "677e",
              },
            ],
          },
        };
      },
    }),
  }),
});

export const { useGetParticipacionPersonalQuery, useGetAuditoriaTSEQuery } = personalApiSlice;
