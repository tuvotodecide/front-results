import { apiSlice } from "../apiSlice";
import type { AccessStatus } from "./authSlice";

export interface RegisterTenantAdminPayload {
  dni: string;
  name: string;
  email: string;
  password?: string;
  tenantName: string;
  tenantDescription?: string;
}

export interface CreateInstitutionalAdminApplicationPayload {
  dni: string;
  accountAddress?: string;
  name: string;
  email: string;
  password?: string;
  institutionName?: string;
  institutionId?: string;
  invitationId?: string;
  registrationContinuationCode?: string;
}

export type InvitationRegistrationContext = {
  invitationId: string;
  status: "REQUIRES_ADMIN_ACCOUNT";
  tenant: { id: string; name: string };
};

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
          ...(data.password?.trim() ? { password: data.password } : {}),
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
          ...(data.accountAddress?.trim()
            ? { accountAddress: data.accountAddress }
            : {}),
          ...(data.password?.trim() ? { password: data.password } : {}),
          ...(data.institutionId ? { institutionId: data.institutionId } : {}),
          ...(data.institutionName ? { institutionName: data.institutionName } : {}),
          ...(data.invitationId ? { invitationId: data.invitationId } : {}),
          ...(data.registrationContinuationCode
            ? { registrationContinuationCode: data.registrationContinuationCode }
            : {}),
        },
      }),
    }),

    getAccessStatus: builder.query<AccessStatus, void>({
      query: () => "/auth/access-status",
      keepUnusedDataFor: 0,
    }),

    getInvitationRegistrationContext: builder.query<
      InvitationRegistrationContext,
      { invitationId: string; continuationCode: string }
    >({
      query: ({ invitationId, continuationCode }) => ({
        url: `/institutional-admin-applications/invitations/${encodeURIComponent(invitationId)}/registration-context`,
        method: "GET",
        params: { continuationCode },
      }),
    }),

    verifyInstitutionalAdminApplication: builder.mutation<any, { token: string }>({
      query: ({ token }) => ({
        url: "/institutional-admin-applications/verify-email",
        method: "POST",
        body: { token },
      }),
    }),

    resendInstitutionalAdminVerificationEmail: builder.mutation<
      any,
      { email: string }
    >({
      query: ({ email }) => ({
        url: "/institutional-admin-applications/resend-verification-email",
        method: "POST",
        body: { email },
      }),
    }),

    loginUser: builder.mutation<any, { email: string; password: string }>({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
    }),

    forgotPassword: builder.mutation<
      any,
      { email: string; context?: "votacion" | "resultados" }
    >({
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
  useLazyGetAccessStatusQuery,
  useCreateUserMutation,
  useRegisterTenantAdminMutation,
  useCreateInstitutionalAdminApplicationMutation,
  useLazyGetInvitationRegistrationContextQuery,
  useVerifyInstitutionalAdminApplicationMutation,
  useResendInstitutionalAdminVerificationEmailMutation,
  useLoginUserMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLazyVerifyEmailQuery,
  useVerifyEmailQuery,
} = authApiSlice;
