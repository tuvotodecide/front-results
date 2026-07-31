import { apiSlice } from "../apiSlice";

export type ApprovalStatus =
  | "NONE"
  | "PENDING_EMAIL_VERIFICATION"
  | "PENDING_APPROVAL"
  | "PENDING_MOBILE_AUTHORIZATION"
  | "MOBILE_AUTHORIZATION_EXPIRED"
  | "PENDING_CHAIN_CONFIRMATION"
  | "CHAIN_RETRY_PENDING"
  | "RECONCILIATION_PENDING"
  | "CHAIN_FAILED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REVOKED";

export interface InstitutionalApplication {
  id: string;
  applicationId?: string;
  userId?: string;
  dni?: string;
  name?: string;
  email?: string;
  institutionName?: string;
  tenantName?: string;
  tenantId?: string;
  status?: ApprovalStatus;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type InstitutionalAdminInvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export interface InstitutionalAdminInvitation {
  id: string;
  tenantId?: string | null;
  dni: string;
  name?: string;
  status: InstitutionalAdminInvitationStatus;
  expiresAt?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  cancelledAt?: string | null;
  applicationId?: string | null;
  noticeCount?: number;
  lastNoticeAt?: string | null;
  reason?: string | null;
}

export interface TerritorialAccessRequest {
  userId: string;
  id?: string;
  name?: string;
  email?: string;
  role?: "MAYOR" | "GOVERNOR" | string;
  status?: ApprovalStatus;
  territorialAccessStatus?: ApprovalStatus;
  votingDepartmentId?: string | null;
  votingMunicipalityId?: string | null;
  departmentName?: string | null;
  municipalityName?: string | null;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const unwrapList = <T,>(response: any): T[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const normalizeInstitutional = (raw: any): InstitutionalApplication => ({
  id: String(raw?.id ?? raw?._id ?? raw?.applicationId ?? ""),
  applicationId: raw?.applicationId ? String(raw.applicationId) : undefined,
  userId: raw?.userId ? String(raw.userId) : undefined,
  dni: raw?.dni ?? undefined,
  name: raw?.name ?? raw?.fullName,
  email: raw?.email,
  institutionName: raw?.institutionName ?? raw?.tenantName,
  tenantName: raw?.tenantName ?? raw?.institutionName,
  tenantId: raw?.tenantId ? String(raw.tenantId) : undefined,
  status: raw?.status,
  reason: raw?.reason ?? null,
  createdAt: raw?.createdAt,
  updatedAt: raw?.updatedAt,
});

const normalizeInvitation = (raw: any): InstitutionalAdminInvitation => ({
  id: String(raw?.id ?? raw?._id ?? ""),
  tenantId: raw?.tenantId ? String(raw.tenantId) : null,
  dni: String(raw?.dni ?? ""),
  name: raw?.name ?? undefined,
  status: raw?.status ?? "PENDING",
  expiresAt: raw?.expiresAt ?? null,
  acceptedAt: raw?.acceptedAt ?? null,
  rejectedAt: raw?.rejectedAt ?? null,
  cancelledAt: raw?.cancelledAt ?? null,
  applicationId: raw?.applicationId ? String(raw.applicationId) : null,
  noticeCount: raw?.noticeCount ?? 0,
  lastNoticeAt: raw?.lastNoticeAt ?? null,
  reason: raw?.reason ?? null,
});

const normalizeTerritorial = (raw: any): TerritorialAccessRequest => ({
  userId: String(raw?.userId ?? raw?.id ?? raw?._id ?? ""),
  id: raw?.id ? String(raw.id) : raw?._id ? String(raw._id) : undefined,
  name: raw?.name ?? raw?.fullName,
  email: raw?.email,
  role: raw?.role,
  status: raw?.status ?? raw?.territorialAccessStatus,
  territorialAccessStatus: raw?.territorialAccessStatus ?? raw?.status,
  votingDepartmentId: raw?.votingDepartmentId ?? raw?.departmentId ?? null,
  votingMunicipalityId: raw?.votingMunicipalityId ?? raw?.municipalityId ?? null,
  departmentName: raw?.departmentName ?? null,
  municipalityName: raw?.municipalityName ?? null,
  reason: raw?.reason ?? raw?.territorialReason ?? null,
  createdAt: raw?.createdAt,
  updatedAt: raw?.updatedAt,
});

export const accessApprovalsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInstitutionalApplications: builder.query<
      InstitutionalApplication[],
      { status?: string; tenantId?: string } | void
    >({
      query: (params) => ({
        url: "/institutional-admin-applications",
        params: params ?? undefined,
      }),
      transformResponse: (response: any) =>
        unwrapList<any>(response).map(normalizeInstitutional),
      providesTags: ["AccessApprovals"],
    }),
    getInstitutionalAdminInvitations: builder.query<
      InstitutionalAdminInvitation[],
      string
    >({
      query: (tenantId) =>
        `/institutional-admin-applications/tenants/${tenantId}/invitations`,
      transformResponse: (response: any) =>
        unwrapList<any>(response).map(normalizeInvitation),
      providesTags: ["AccessApprovals"],
    }),
    createInstitutionalAdminInvitation: builder.mutation<
      InstitutionalAdminInvitation,
      { tenantId: string; dni: string; name?: string; reason?: string }
    >({
      query: ({ tenantId, ...body }) => ({
        url: `/institutional-admin-applications/tenants/${tenantId}/invitations`,
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => normalizeInvitation(response?.data ?? response),
      invalidatesTags: ["AccessApprovals"],
    }),
    resendInstitutionalAdminInvitation: builder.mutation<
      InstitutionalAdminInvitation,
      string
    >({
      query: (invitationId) => ({
        url: `/institutional-admin-applications/invitations/${invitationId}/resend`,
        method: "POST",
      }),
      transformResponse: (response: any) => normalizeInvitation(response?.data ?? response),
      invalidatesTags: ["AccessApprovals"],
    }),
    cancelInstitutionalAdminInvitation: builder.mutation<
      InstitutionalAdminInvitation,
      { invitationId: string; reason?: string }
    >({
      query: ({ invitationId, reason }) => ({
        url: `/institutional-admin-applications/invitations/${invitationId}/cancel`,
        method: "POST",
        body: reason ? { reason } : undefined,
      }),
      transformResponse: (response: any) => normalizeInvitation(response?.data ?? response),
      invalidatesTags: ["AccessApprovals"],
    }),
    getPendingInstitutionalApplications: builder.query<
      InstitutionalApplication[],
      void
    >({
      query: () => "/institutional-admin-applications/pending",
      transformResponse: (response: any) =>
        unwrapList<any>(response).map(normalizeInstitutional),
      providesTags: ["AccessApprovals"],
    }),
    getInstitutionalApplication: builder.query<InstitutionalApplication, string>({
      query: (applicationId) =>
        `/institutional-admin-applications/${applicationId}`,
      transformResponse: (response: any) =>
        normalizeInstitutional(response?.data ?? response),
      providesTags: (_result, _error, applicationId) => [
        { type: "AccessApprovals", id: applicationId },
      ],
    }),
    approveInstitutionalApplication: builder.mutation<InstitutionalApplication, string>({
      query: (applicationId) => ({
        url: `/institutional-admin-applications/${applicationId}/approve`,
        method: "POST",
      }),
      transformResponse: (response: any) =>
        normalizeInstitutional(response?.data ?? response),
      invalidatesTags: ["AccessApprovals"],
    }),
    retryInstitutionalAuthorization: builder.mutation<InstitutionalApplication, string>({
      query: (applicationId) => ({
        url: `/institutional-admin-applications/${applicationId}/retry-authorization`,
        method: "POST",
      }),
      transformResponse: (response: any) =>
        normalizeInstitutional(response?.data ?? response),
      invalidatesTags: ["AccessApprovals"],
    }),
    rejectInstitutionalApplication: builder.mutation<
      void,
      { applicationId: string; reason?: string }
    >({
      query: ({ applicationId, reason }) => ({
        url: `/institutional-admin-applications/${applicationId}/reject`,
        method: "POST",
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: ["AccessApprovals"],
    }),
    revokeInstitutionalApplication: builder.mutation<
      void,
      { applicationId: string; reason?: string }
    >({
      query: ({ applicationId, reason }) => ({
        url: `/institutional-admin-applications/${applicationId}/revoke`,
        method: "POST",
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: ["AccessApprovals"],
    }),
    reopenInstitutionalApplication: builder.mutation<void, string>({
      query: (applicationId) => ({
        url: `/institutional-admin-applications/${applicationId}/reopen`,
        method: "POST",
      }),
      invalidatesTags: ["AccessApprovals"],
    }),
    getTerritorialAccessRequests: builder.query<
      TerritorialAccessRequest[],
      { status?: string } | void
    >({
      query: (params) => ({
        url: "/contracts/territorial-access-requests",
        params: params ?? undefined,
      }),
      transformResponse: (response: any) =>
        unwrapList<any>(response).map(normalizeTerritorial),
      providesTags: ["AccessApprovals"],
    }),
    getTerritorialAccessRequest: builder.query<TerritorialAccessRequest, string>({
      query: (userId) => `/contracts/territorial-access-requests/${userId}`,
      transformResponse: (response: any) =>
        normalizeTerritorial(response?.data ?? response),
      providesTags: (_result, _error, userId) => [
        { type: "AccessApprovals", id: userId },
      ],
    }),
    approveTerritorialAccessRequest: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/contracts/users/${userId}/approve`,
        method: "POST",
        body: { approve: true },
      }),
      invalidatesTags: ["AccessApprovals"],
    }),
    rejectTerritorialAccessRequest: builder.mutation<
      void,
      { userId: string; reason?: string }
    >({
      query: ({ userId, reason }) => ({
        url: `/contracts/users/${userId}/approve`,
        method: "POST",
        body: { approve: false, reason },
      }),
      invalidatesTags: ["AccessApprovals"],
    }),
    revokeTerritorialAccessRequest: builder.mutation<
      void,
      { userId: string; reason?: string }
    >({
      query: ({ userId, reason }) => ({
        url: `/contracts/territorial-access-requests/${userId}/revoke`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["AccessApprovals"],
    }),
  }),
});

export const {
  useGetInstitutionalApplicationsQuery,
  useGetInstitutionalAdminInvitationsQuery,
  useCreateInstitutionalAdminInvitationMutation,
  useResendInstitutionalAdminInvitationMutation,
  useCancelInstitutionalAdminInvitationMutation,
  useGetPendingInstitutionalApplicationsQuery,
  useGetInstitutionalApplicationQuery,
  useApproveInstitutionalApplicationMutation,
  useRetryInstitutionalAuthorizationMutation,
  useRejectInstitutionalApplicationMutation,
  useRevokeInstitutionalApplicationMutation,
  useReopenInstitutionalApplicationMutation,
  useGetTerritorialAccessRequestsQuery,
  useGetTerritorialAccessRequestQuery,
  useApproveTerritorialAccessRequestMutation,
  useRejectTerritorialAccessRequestMutation,
  useRevokeTerritorialAccessRequestMutation,
} = accessApprovalsApi;
