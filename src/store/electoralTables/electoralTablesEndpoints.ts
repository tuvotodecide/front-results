import { apiSlice } from "../apiSlice";
import {
  PaginatedResponse,
  ElectoralTablesType,
  ElectoralTableType,
  // ElectoralTableByCodeType,
  CreateElectoralTableType,
  UpdateElectoralTableType,
  ElectoralTableTransformedType,
} from "../../types";

interface QueryElectoralTablesParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: Record<string, any>;
  search?: string;
  active?: boolean;
}

export const electoralTablesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getElectoralTables: builder.query<
      PaginatedResponse<ElectoralTablesType>,
      QueryElectoralTablesParams
    >({
      query: (params) => ({
        url: "/geographic/electoral-tables",
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: "ElectoralTables" as const, id: "LIST" }],
    }),
    getElectoralTablesByElectoralLocationId: builder.query<
      ElectoralTableType[],
      string
    >({
      query: (electoralLocationId) => ({
        url: "/geographic/electoral-tables/by-location/" + electoralLocationId,
      }),
      keepUnusedDataFor: 300,
      providesTags: (_result, _error, electoralLocationId) => [
        { type: "ElectoralTables" as const, id: electoralLocationId },
      ],
    }),
    // getElectoralTablesByElectoralLocationId: builder.query<any, string>({
    //   async queryFn(locationId) {
    //     // Generamos mesas cuyo código dependa del ID del recinto para que se sienta real
    //     const mesas = Array.from({ length: 12 }, (_, i) => {
    //       const tableNum = 101 + i;
    //       const code = `C${locationId?.slice(-3) || "000"}-${tableNum}`;
    //       return {
    //         _id: `id-mesa-${code}`,
    //         tableNumber: tableNum,
    //         tableCode: code,
    //         status: i % 4 === 0 ? "dispute" : "processed", // Algunas en disputa para variar
    //       };
    //     });
    //     return { data: mesas };
    //   },
    // }),
    getElectoralTable: builder.query<ElectoralTablesType, string>({
      query: (id) => `/geographic/electoral-tables/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: "ElectoralTables" as const, id },
      ],
    }),
    getElectoralTableByTableCode: builder.query<
      ElectoralTableTransformedType,
      string
    >({
      query: (tableCode) =>
        `/geographic/electoral-tables/table-code/${tableCode}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, tableCode) => [
        { type: 'ElectoralTables' as const, id: `code-${tableCode}` },
      ],
    }),
    // getElectoralTableByTableCode: builder.query<any, string>({
    //   async queryFn(tableCode) {
    //     Simulamos que extraemos información del código de la mesa
    //     para que la vista detalle muestre los datos correctos arriba
    //     return {
    //       data: {
    //         _id: `id-mesa-${tableCode}`,
    //         tableNumber: tableCode.split("-")[1] || "101", // Extrae el número si el código es CXXX-101
    //         tableCode: tableCode,
    //         department: { _id: "dept-1", name: "La Paz" },
    //         province: { _id: "prov-1", name: "Murillo" },
    //         municipality: { _id: "muni-1", name: "La Paz" },
    //         electoralSeat: { name: "Zona Central" },
    //         electoralLocation: {
    //           _id: "loc-1",
    //           name: "UNIDAD EDUCATIVA DON BOSCO",
    //           address: "Av. 16 de Julio (Prado)",
    //           totalTables: 25,
    //         },
    //       },
    //     };
    //   },
    // }),
    createElectoralTable: builder.mutation<
      ElectoralTablesType,
      CreateElectoralTableType
    >({
      query: (body) => ({
        url: "/geographic/electoral-tables",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ElectoralTables", id: "LIST" }],
    }),
    updateElectoralTable: builder.mutation<
      ElectoralTablesType,
      { id: string; item: UpdateElectoralTableType }
    >({
      query: ({ id, item }) => ({
        url: `/geographic/electoral-tables/${id}`,
        method: "PATCH",
        body: item,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ElectoralTables", id: "LIST" },
        { type: "ElectoralTables", id },
      ],
    }),
    deleteElectoralTable: builder.mutation<void, string>({
      query: (id) => ({
        url: `/geographic/electoral-tables/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ElectoralTables", id: "LIST" }],
    }),
  }),
});

export const {
  useGetElectoralTablesQuery,
  useLazyGetElectoralTablesQuery,
  useGetElectoralTablesByElectoralLocationIdQuery,
  useLazyGetElectoralTablesByElectoralLocationIdQuery,
  useGetElectoralTableQuery,
  useLazyGetElectoralTableQuery,
  useGetElectoralTableByTableCodeQuery,
  useLazyGetElectoralTableByTableCodeQuery,
  useCreateElectoralTableMutation,
  useUpdateElectoralTableMutation,
  useDeleteElectoralTableMutation,
} = electoralTablesApiSlice;
