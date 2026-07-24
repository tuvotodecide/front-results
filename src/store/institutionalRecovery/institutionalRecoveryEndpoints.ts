import { apiSlice } from "../apiSlice";
import type {
  ApproveInstitutionalRecoveryRequest,
  CreateInstitutionalRecoveryRequest,
  InstitutionalRecoveryApprovalResponse,
  InstitutionalRecoveryDetail,
  InstitutionalRecoveryListQuery,
  InstitutionalRecoveryListResponse,
  InstitutionalRecoveryPublicReceipt,
  RejectInstitutionalRecoveryRequest,
} from "./institutionalRecoveryTypes";

export const institutionalRecoveryEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createInstitutionalRecoveryRequest: builder.mutation<
      InstitutionalRecoveryPublicReceipt,
      CreateInstitutionalRecoveryRequest
    >({
      query: (body) => ({
        url: "/institutional-access-recovery-requests",
        method: "POST",
        body,
      }),
    }),
    listInstitutionalRecoveryRequests: builder.query<
      InstitutionalRecoveryListResponse,
      InstitutionalRecoveryListQuery | void
    >({
      query: (params) => ({
        url: "/institutional-access-recovery-requests",
        method: "GET",
        params: params?.status ? { status: params.status } : undefined,
      }),
      providesTags: ["InstitutionalRecoveryRequests"],
    }),
    getInstitutionalRecoveryRequest: builder.query<
      InstitutionalRecoveryDetail,
      string
    >({
      query: (requestId) => ({
        url: `/institutional-access-recovery-requests/${requestId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, requestId) => [
        { type: "InstitutionalRecoveryRequest", id: requestId },
      ],
    }),
    approveInstitutionalRecoveryRequest: builder.mutation<
      InstitutionalRecoveryApprovalResponse,
      { requestId: string; body: ApproveInstitutionalRecoveryRequest }
    >({
      query: ({ requestId, body }) => ({
        url: `/institutional-access-recovery-requests/${requestId}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { requestId }) => [
        "InstitutionalRecoveryRequests",
        { type: "InstitutionalRecoveryRequest", id: requestId },
      ],
    }),
    rejectInstitutionalRecoveryRequest: builder.mutation<
      InstitutionalRecoveryDetail,
      { requestId: string; body: RejectInstitutionalRecoveryRequest }
    >({
      query: ({ requestId, body }) => ({
        url: `/institutional-access-recovery-requests/${requestId}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { requestId }) => [
        "InstitutionalRecoveryRequests",
        { type: "InstitutionalRecoveryRequest", id: requestId },
      ],
    }),
  }),
});

export const {
  useCreateInstitutionalRecoveryRequestMutation,
  useListInstitutionalRecoveryRequestsQuery,
  useGetInstitutionalRecoveryRequestQuery,
  useApproveInstitutionalRecoveryRequestMutation,
  useRejectInstitutionalRecoveryRequestMutation,
} = institutionalRecoveryEndpoints;
