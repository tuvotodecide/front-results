import {
  UserProfile,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailResponse
} from "../../types";
import { apiSlice } from "../apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<UserProfile, void>({
      query: () => "/auth/profile",
      keepUnusedDataFor: 60,
      providesTags: () => ["Profile"],
    }),

    createUser: builder.mutation<any, RegisterRequest>({
      query: (user) => ({
        url: "/auth/register",
        method: "POST",
        body: user,
      }),
    }),

    loginUser: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
    }),

    forgotPassword: builder.mutation<any, ForgotPasswordRequest>({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    resetPassword: builder.mutation<any, ResetPasswordRequest>({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),

    verifyEmail: builder.query<VerifyEmailResponse, { token: string }>({
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
  useLoginUserMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLazyVerifyEmailQuery,
  useVerifyEmailQuery,
} = authApiSlice;
