import { apiSlice } from '../apiSlice';
import { PaginatedResponse, DepartmentType } from '../../types';
import { setDepartments } from './departmentsSlice';

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
    getDepartments: builder.query<DepartmentType[], QueryDepartmentsParams>({
      query: (params) => ({
        url: '/geographic/departments',
        params,
      }),
      keepUnusedDataFor: 300,
      providesTags: () => [{ type: 'Departments' as const, id: 'LIST' }],
      transformResponse: (response: PaginatedResponse<DepartmentType>) => {
        return response.data;
      },
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          console.log('Fetched departments:', data);
          dispatch(setDepartments(data));
        } catch (error) {
          console.error('Failed to fetch departments:', error);
        }
      },
    }),
    getDepartment: builder.query<DepartmentType, string>({
      query: (id) => `/geographic/departments/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: 'Departments' as const, id },
      ],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useLazyGetDepartmentsQuery,
  useGetDepartmentQuery,
} = departmentsApiSlice;
