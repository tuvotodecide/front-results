import { apiSlice } from "../apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<any, void>({
      query: () => "admin/auth/profile",
      keepUnusedDataFor: 60,
      providesTags: () => ["Profile"],
    }),
    createUser: builder.mutation({
      query: (user) => ({
        url: "/admin/auth/register",
        method: "POST",
        body: user,
      }),
    }),
    loginUser: builder.mutation({
      query: (data) => ({
        url: "/admin/auth/login",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useCreateUserMutation,
  useLoginUserMutation,
} = authApiSlice;
