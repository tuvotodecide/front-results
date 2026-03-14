import { apiSlice } from "../apiSlice";

export interface RegisterTenantAdminPayload {
  dni: string;
  name: string;
  email: string;
  password: string;
  tenantName: string;
  tenantDescription?: string;
}

export interface CreateInstitutionalAdminApplicationPayload {
  dni: string;
  name: string;
  email: string;
  password: string;
  institutionName: string;
}

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<any, void>({
      query: () => "/auth/profile",
      keepUnusedDataFor: 60,
      providesTags: () => ["Profile"],
    }),

    createUser: builder.mutation<any, any>({
      query: (user) => ({
        url: "/auth/register",
        method: "POST",
        body: user,
      }),
    }),

    registerTenantAdmin: builder.mutation<any, RegisterTenantAdminPayload>({
      query: (data) => ({
        url: "/auth/register",
        method: "POST",
        body: {
          dni: data.dni,
          name: data.name,
          email: data.email,
          password: data.password,
          institutionName: data.tenantName,
        },
      }),
    }),

    createInstitutionalAdminApplication: builder.mutation<
      any,
      CreateInstitutionalAdminApplicationPayload
    >({
      query: (data) => ({
        url: "/institutional-admin-applications",
        method: "POST",
        body: {
          dni: data.dni,
          name: data.name,
          email: data.email,
          password: data.password,
          institutionName: data.institutionName,
        },
      }),
    }),

    verifyInstitutionalAdminApplication: builder.mutation<any, { token: string }>({
      query: ({ token }) => ({
        url: "/institutional-admin-applications/verify-email",
        method: "POST",
        body: { token },
      }),
    }),

    loginUser: builder.mutation<any, { email: string; password: string }>({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
    }),

    forgotPassword: builder.mutation<any, { email: string }>({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    resetPassword: builder.mutation<any, { token: string; password: string }>({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),

    verifyEmail: builder.query<any, { token: string }>({
      query: ({ token }) => ({
        url: `/auth/verify-email`,
        method: "GET",
        params: { token },
      }),
    }),
  }),
});

export const {
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useCreateUserMutation,
  useRegisterTenantAdminMutation,
  useCreateInstitutionalAdminApplicationMutation,
  useVerifyInstitutionalAdminApplicationMutation,
  useLoginUserMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLazyVerifyEmailQuery,
  useVerifyEmailQuery,
} = authApiSlice;
