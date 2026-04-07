import { apiSlice } from "../apiSlice";
import type { AuthState } from "./authSlice";

interface AuthTokensResponse {
  access_token?: string;
  accessToken?: string;
  token?: string;
}

type AuthUser = NonNullable<AuthState["user"]>;

export interface AuthResponse extends AuthTokensResponse {
  user?: AuthState["user"];
  active?: boolean;
  role?: string;
}

export interface ProfileResponse extends Partial<AuthUser> {
  id?: string;
  _id?: string;
  sub?: string;
  tenantId?: string;
  votingDepartmentId?: string;
  votingMunicipalityId?: string;
}

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
    getProfile: builder.query<ProfileResponse, void>({
      query: () => "/auth/profile",
      keepUnusedDataFor: 60,
      providesTags: () => ["Profile"],
    }),

    createUser: builder.mutation<AuthResponse, Record<string, unknown>>({
      query: (user) => ({
        url: "/auth/register",
        method: "POST",
        body: user,
      }),
    }),

    registerTenantAdmin: builder.mutation<AuthResponse, RegisterTenantAdminPayload>({
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
      AuthResponse,
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

    verifyInstitutionalAdminApplication: builder.mutation<AuthResponse, { token: string }>({
      query: ({ token }) => ({
        url: "/institutional-admin-applications/verify-email",
        method: "POST",
        body: { token },
      }),
    }),

    loginUser: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
    }),

    forgotPassword: builder.mutation<{ message?: string }, { email: string }>({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    resetPassword: builder.mutation<{ message?: string }, { token: string; password: string }>({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),

    verifyEmail: builder.query<{ message?: string }, { token: string }>({
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
