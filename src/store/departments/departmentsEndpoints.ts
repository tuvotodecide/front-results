import { apiSlice } from "../apiSlice";
import {
  PaginatedResponse,
  DepartmentType,
  CreateDepartmentType,
  UpdateDepartmentType,
} from "../../types";
import { setDepartments } from "./departmentsSlice";

interface QueryDepartmentsParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: Record<string, any>;
  search?: string;
  active?: boolean;
}

export const departmentsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // getDepartments: builder.query<
    //   PaginatedResponse<DepartmentType>,
    //   QueryDepartmentsParams
    // >({
    //   query: (params) => ({
    //     url: '/geographic/departments',
    //     params,
    //   }),
    //   keepUnusedDataFor: 300,
    //   providesTags: () => [{ type: 'Departments' as const, id: 'LIST' }],
    //   onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
    //     try {
    //       const {
    //         data: { data: departments },
    //       } = await queryFulfilled;
    //       // console.log('Fetched departments:', departments);
    //       dispatch(setDepartments(departments));
    //     } catch (error) {
    //       console.error('Failed to fetch departments:', error);
    //     }
    //   },
    // }),
    getDepartments: builder.query<any, any>({
      async queryFn() {
        // Estos son los datos que devolverá la "API"
        const mockData = [
          { _id: "dept-1", name: "La Paz" },
          { _id: "dept-2", name: "Santa Cruz" },
          { _id: "dept-3", name: "Cochabamba" },
          { _id: "dept-4", name: "Oruro" },
          { _id: "dept-5", name: "Potosí" },
          { _id: "dept-6", name: "Tarija" },
          { _id: "dept-7", name: "Chuquisaca" },
          { _id: "dept-8", name: "Beni" },
          { _id: "dept-9", name: "Pando" },
        ];

        return { data: { data: mockData } };
      },
      // ¡ESTO ES LO QUE FALTA!
      // Al iniciar la query, mandamos los datos al slice de departamentos
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // data.data porque tu mock devuelve { data: { data: [...] } }
          dispatch(setDepartments(data.data));
        } catch (error) {
          console.error("Error en el mock de departamentos:", error);
        }
      },
    }),
    // getDepartment: builder.query<DepartmentType, string>({
    //   query: (id) => `/geographic/departments/${id}`,
    //   keepUnusedDataFor: 60,
    //   providesTags: (_result, _error, id) => [
    //     { type: "Departments" as const, id },
    //   ],
    // }),
    getDepartment: builder.query<any, string>({
      async queryFn(id) {
        return {
          data: { _id: id, name: id === "dept-1" ? "La Paz" : "Santa Cruz" },
        };
      },
    }),
    createDepartment: builder.mutation<DepartmentType, CreateDepartmentType>({
      query: (item) => ({
        url: "/geographic/departments",
        method: "POST",
        body: item,
      }),
      invalidatesTags: [{ type: "Departments", id: "LIST" }],
    }),
    updateDepartment: builder.mutation<
      DepartmentType,
      { id: string; item: UpdateDepartmentType }
    >({
      query: ({ id, item }) => ({
        url: `/geographic/departments/${id}`,
        method: "PATCH",
        body: item,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Departments", id: "LIST" },
        { type: "Departments", id },
      ],
    }),
    deleteDepartment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/geographic/departments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Departments", id: "LIST" },
        { type: "Departments", id },
      ],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useLazyGetDepartmentsQuery,
  useGetDepartmentQuery,
  useLazyGetDepartmentQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentsApiSlice;
