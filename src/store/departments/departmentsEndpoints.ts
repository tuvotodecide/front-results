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
    getDepartments: builder.query<
      PaginatedResponse<DepartmentType>,
      QueryDepartmentsParams
    >({
      query: (params) => ({
        url: '/geographic/departments',
        params,
      }),
      keepUnusedDataFor: 300,
      providesTags: () => [{ type: 'Departments' as const, id: 'LIST' }],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const {
            data: { data: departments },
          } = await queryFulfilled;
          // console.log('Fetched departments:', departments);
          dispatch(setDepartments(departments));
        } catch (error) {
          console.error('Failed to fetch departments:', error);
        }
      },
    }),
   
    getDepartment: builder.query<DepartmentType, string>({
      query: (id) => `/geographic/departments/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: "Departments" as const, id },
      ],
    }),
    // getDepartment: builder.query<any, string>({
    //   async queryFn(id) {
    //     return {
    //       data: { _id: id, name: id === "dept-1" ? "La Paz" : "Santa Cruz" },
    //     };
    //   },
    // }),
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
