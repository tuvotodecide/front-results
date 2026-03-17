import { apiSlice } from "../apiSlice";
import type {
  ComparisonReportStatus,
  CreateEventNewsDto,
  CreateEventRoleDto,
  CreateParticipationDto,
  CreateVotingEventDto,
  CreateVotingOptionDto,
  EligibilityResult,
  EventNews,
  EventResults,
  EventRole,
  PadronCsvDownload,
  PadronImportResult,
  PadronVersion,
  PadronVoter,
  ParticipationStatus,
  ReplaceCandidatesDto,
  UpdateEventRoleDto,
  UpdatePublicEligibilityDto,
  UpdateScheduleDto,
  UpdateVotingEventDto,
  UpdateVotingOptionDto,
  UpsertEventResultsSnapshotDto,
  VotingEvent,
  VotingOption,
} from "./types";

const toVotingEvent = (raw: any): VotingEvent => {
  const state = (raw?.state ?? raw?.status ?? "DRAFT") as VotingEvent["state"];
  return {
    id: String(raw?.id ?? raw?._id ?? ""),
    tenantId: String(raw?.tenantId ?? ""),
    name: raw?.name ?? "",
    objective: raw?.objective ?? "",
    votingStart: raw?.votingStart ?? null,
    votingEnd: raw?.votingEnd ?? null,
    resultsPublishAt: raw?.resultsPublishAt ?? null,
    state,
    status: state,
    publicEligibilityEnabled: Boolean(raw?.publicEligibilityEnabled),
    publicEligibility: Boolean(raw?.publicEligibilityEnabled),
    roles: Array.isArray(raw?.roles)
      ? raw.roles.map((r: any) => ({
          id: String(r?.id ?? r?._id ?? ""),
          eventId: String(r?.eventId ?? raw?.id ?? raw?._id ?? ""),
          name: r?.name ?? "",
          maxWinners: Number(r?.maxWinners ?? 1),
          createdAt: r?.createdAt,
        }))
      : undefined,
    options: Array.isArray(raw?.options)
      ? raw.options.map((o: any) => ({
          id: String(o?.id ?? o?._id ?? ""),
          eventId: String(o?.eventId ?? raw?.id ?? raw?._id ?? ""),
          name: o?.name ?? "",
          color: o?.color ?? "#000000",
          logoUrl: o?.logoUrl ?? undefined,
          active: Boolean(o?.active ?? true),
          createdAt: o?.createdAt,
          candidates: Array.isArray(o?.candidates)
            ? o.candidates.map((c: any, idx: number) => ({
                id: String(c?.id ?? c?._id ?? `${String(o?.id ?? o?._id ?? "opt")}-${idx}`),
                optionId: String(o?.id ?? o?._id ?? ""),
                name: c?.name ?? "",
                photoUrl: c?.photoUrl ?? undefined,
                roleName: c?.roleName ?? "",
              }))
            : [],
        }))
      : undefined,
  };
};

const toRole = (raw: any): EventRole => ({
  id: String(raw?.id ?? raw?._id ?? ""),
  eventId: String(raw?.eventId ?? ""),
  name: raw?.name ?? "",
  maxWinners: Number(raw?.maxWinners ?? 1),
  createdAt: raw?.createdAt,
});

const toOption = (raw: any): VotingOption => ({
  id: String(raw?.id ?? raw?._id ?? ""),
  eventId: String(raw?.eventId ?? ""),
  name: raw?.name ?? "",
  color: raw?.color ?? "#000000",
  logoUrl: raw?.logoUrl ?? undefined,
  active: Boolean(raw?.active ?? true),
  createdAt: raw?.createdAt,
  candidates: Array.isArray(raw?.candidates)
    ? raw.candidates.map((c: any, idx: number) => ({
        id: String(c?.id ?? c?._id ?? `${String(raw?.id ?? raw?._id ?? "opt")}-${idx}`),
        optionId: String(raw?.id ?? raw?._id ?? ""),
        name: c?.name ?? "",
        photoUrl: c?.photoUrl ?? undefined,
        roleName: c?.roleName ?? "",
      }))
    : [],
});

export const votingEventsEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getVotingEvents: builder.query<VotingEvent[], { tenantId?: string } | void>({
      query: (params) => ({
        url: "/voting/events",
        params: params || {},
      }),
      transformResponse: (response: any) =>
        Array.isArray(response?.data) ? response.data.map(toVotingEvent) : [],
      providesTags: ["VotingEvents"],
    }),

    getVotingEvent: builder.query<VotingEvent, string>({
      query: (eventId) => `/voting/events/${eventId}`,
      transformResponse: (response: any) => toVotingEvent(response),
      providesTags: (_result, _error, eventId) => [{ type: "VotingEvents", id: eventId }],
    }),

    createVotingEvent: builder.mutation<VotingEvent, CreateVotingEventDto>({
      query: (body) => ({
        url: "/voting/events",
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => toVotingEvent(response),
      invalidatesTags: ["VotingEvents"],
    }),

    updateVotingEvent: builder.mutation<
      VotingEvent,
      { eventId: string; data: UpdateVotingEventDto }
    >({
      query: ({ eventId, data }) => ({
        url: `/voting/events/${eventId}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: any) => toVotingEvent(response),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEvents", id: eventId }],
    }),

    deleteVotingEvent: builder.mutation<void, string>({
      query: (eventId) => ({
        url: `/voting/events/${eventId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["VotingEvents"],
    }),

    publishVotingEvent: builder.mutation<any, string>({
      query: (eventId) => ({
        url: `/voting/events/${eventId}/publish`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, eventId) => [{ type: "VotingEvents", id: eventId }],
    }),

    getEventRoles: builder.query<EventRole[], string>({
      query: (eventId) => `/voting/events/${eventId}/roles`,
      transformResponse: (response: any) =>
        Array.isArray(response?.data) ? response.data.map(toRole) : [],
      providesTags: (_result, _error, eventId) => [{ type: "VotingEventRoles", id: eventId }],
    }),

    createEventRole: builder.mutation<EventRole, { eventId: string; data: CreateEventRoleDto }>({
      query: ({ eventId, data }) => ({
        url: `/voting/events/${eventId}/roles`,
        method: "POST",
        body: data,
      }),
      transformResponse: (response: any) => toRole(response),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEventRoles", id: eventId }],
    }),

    updateEventRole: builder.mutation<
      EventRole,
      { eventId: string; roleId: string; data: UpdateEventRoleDto }
    >({
      query: ({ eventId, roleId, data }) => ({
        url: `/voting/events/${eventId}/roles/${roleId}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: any) => toRole(response),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEventRoles", id: eventId }],
    }),

    deleteEventRole: builder.mutation<void, { eventId: string; roleId: string }>({
      query: ({ eventId, roleId }) => ({
        url: `/voting/events/${eventId}/roles/${roleId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEventRoles", id: eventId }],
    }),

    getEventOptions: builder.query<VotingOption[], string>({
      query: (eventId) => `/voting/events/${eventId}/options`,
      transformResponse: (response: any) =>
        Array.isArray(response?.data) ? response.data.map(toOption) : [],
      providesTags: (_result, _error, eventId) => [{ type: "VotingEventOptions", id: eventId }],
    }),

    createVotingOption: builder.mutation<
      VotingOption,
      { eventId: string; data: CreateVotingOptionDto }
    >({
      query: ({ eventId, data }) => ({
        url: `/voting/events/${eventId}/options`,
        method: "POST",
        body: data,
      }),
      transformResponse: (response: any) => toOption(response),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEventOptions", id: eventId }],
    }),

    updateVotingOption: builder.mutation<
      VotingOption,
      { eventId: string; optionId: string; data: UpdateVotingOptionDto }
    >({
      query: ({ eventId, optionId, data }) => ({
        url: `/voting/events/${eventId}/options/${optionId}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: any) => toOption(response),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEventOptions", id: eventId }],
    }),

    replaceOptionCandidates: builder.mutation<
      VotingOption,
      { eventId: string; optionId: string; data: ReplaceCandidatesDto }
    >({
      query: ({ eventId, optionId, data }) => ({
        url: `/voting/events/${eventId}/options/${optionId}/candidates`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response: any) => toOption(response),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEventOptions", id: eventId }],
    }),

    deactivateVotingOption: builder.mutation<void, { eventId: string; optionId: string }>({
      query: ({ eventId, optionId }) => ({
        url: `/voting/events/${eventId}/options/${optionId}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEventOptions", id: eventId }],
    }),

    deleteVotingOption: builder.mutation<void, { eventId: string; optionId: string }>({
      query: ({ eventId, optionId }) => ({
        url: `/voting/events/${eventId}/options/${optionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEventOptions", id: eventId }],
    }),

    importPadron: builder.mutation<PadronImportResult, { eventId: string; file: File }>({
      query: ({ eventId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/voting/events/${eventId}/padron/import`,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: any) => ({
        versionId: String(response?.padronVersionId ?? ""),
        padronVersionId: String(response?.padronVersionId ?? ""),
        fileDigest: String(response?.fileDigest ?? ""),
        totalRecords: Number(response?.totals?.validCount ?? 0),
        validCount: Number(response?.totals?.validCount ?? 0),
        invalidCount: Number(response?.totals?.invalidCount ?? 0),
        duplicateCount: Number(response?.totals?.duplicateCount ?? 0),
        uploadedAt: response?.createdAt,
        totals: response?.totals,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEventPadron", id: eventId }],
    }),

    getPadronVersions: builder.query<PadronVersion[], string>({
      query: (eventId) => `/voting/events/${eventId}/padron/versions`,
      transformResponse: (response: any) =>
        Array.isArray(response?.data)
          ? response.data.map((v: any) => ({
              id: String(v?.padronVersionId ?? v?.id ?? ""),
              padronVersionId: String(v?.padronVersionId ?? v?.id ?? ""),
              fileDigest: String(v?.fileDigest ?? ""),
              fileName: `padron-${String(v?.padronVersionId ?? v?.id ?? "")}.csv`,
              totalRecords: Number(v?.totals?.validCount ?? 0),
              validCount: Number(v?.totals?.validCount ?? 0),
              invalidCount: Number(v?.totals?.invalidCount ?? 0),
              duplicateCount: Number(v?.totals?.duplicateCount ?? 0),
              uploadedAt: v?.createdAt,
              createdAt: v?.createdAt,
              createdBy: v?.createdBy,
              isCurrent: Boolean(v?.isCurrent),
            }))
          : [],
      providesTags: (_result, _error, eventId) => [{ type: "VotingEventPadron", id: eventId }],
    }),

    getPadronVoters: builder.query<
      { voters: PadronVoter[]; total: number; page: number; limit: number; totalPages: number },
      { eventId: string; page?: number; limit?: number }
    >({
      query: ({ eventId, page = 1, limit = 50 }) =>
        `/voting/events/${eventId}/padron/voters?page=${page}&limit=${limit}`,
      transformResponse: (response: any) => ({
        voters: Array.isArray(response?.data)
          ? response.data.map((v: any) => ({
              id: String(v?.id ?? v?._id ?? ""),
              carnet: String(v?.carnetNorm ?? ""),
              carnetNorm: String(v?.carnetNorm ?? ""),
              enabled: v?.enabled !== false,
              status: "valid" as const,
              createdAt: v?.createdAt,
            }))
          : [],
        total: Number(response?.total ?? 0),
        page: Number(response?.page ?? 1),
        limit: Number(response?.limit ?? 50),
        totalPages: Number(response?.totalPages ?? 0),
      }),
      providesTags: (_result, _error, { eventId }) => [{ type: "VotingEventPadron", id: eventId }],
    }),

    downloadPadronCsv: builder.query<
      PadronCsvDownload,
      { eventId: string; padronVersionId?: string }
    >({
      query: ({ eventId, padronVersionId }) => ({
        url: `/voting/events/${eventId}/padron/download`,
        params: padronVersionId ? { padronVersionId } : undefined,
        responseHandler: "text",
      }),
      transformResponse: (response: string, meta, arg) => {
        const contentDisposition = meta?.response?.headers?.get("content-disposition") ?? "";
        const fileNameMatch = contentDisposition.match(/filename=\"([^\"]+)\"/i);
        return {
          content: String(response ?? ""),
          fileName:
            fileNameMatch?.[1] ??
            `padron-${String(arg.padronVersionId ?? arg.eventId)}.csv`,
        };
      },
    }),

    updateEventSchedule: builder.mutation<void, { eventId: string; data: UpdateScheduleDto }>({
      query: ({ eventId, data }) => ({
        url: `/voting/events/${eventId}/schedule`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEvents", id: eventId }],
    }),

    updatePublicEligibility: builder.mutation<void, { eventId: string; data: UpdatePublicEligibilityDto }>({
      query: ({ eventId, data }) => ({
        url: `/voting/events/${eventId}/public-eligibility`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEvents", id: eventId }],
    }),

    getEventResults: builder.query<EventResults, string>({
      query: (eventId) => `/voting/events/${eventId}/results`,
      transformResponse: (response: any) => ({
        eventId: String(response?.eventId ?? ""),
        status: "FINAL",
        roles: Array.isArray(response?.roles)
          ? response.roles.map((r: any) => ({
              roleName: r?.roleName ?? "",
              total: Number(r?.total ?? 0),
              ranking: Array.isArray(r?.ranking)
                ? r.ranking.map((rk: any) => ({
                    optionId: String(rk?.optionId ?? ""),
                    optionName: rk?.optionName ?? "",
                    votes: Number(rk?.votes ?? 0),
                    percentage: Number(rk?.percentage ?? 0),
                  }))
                : [],
              winners: Array.isArray(r?.winners) ? r.winners : [],
            }))
          : [],
        publishedAt: response?.publishedAt,
        lastUpdated: response?.publishedAt,
        source: response?.source,
        txHash: response?.txHash ?? undefined,
        blockNumber: response?.blockNumber ?? undefined,
      }),
      providesTags: (_result, _error, eventId) => [{ type: "VotingEventResults", id: eventId }],
    }),

    upsertResultsSnapshot: builder.mutation<void, { eventId: string; data: UpsertEventResultsSnapshotDto }>({
      query: ({ eventId, data }) => ({
        url: `/voting/events/${eventId}/results/snapshot`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEventResults", id: eventId }],
    }),

    updateComparisonReportStatus: builder.mutation<void, { eventId: string; status: ComparisonReportStatus; padronVersionId?: string }>({
      query: ({ eventId, status, padronVersionId }) => ({
        url: `/voting/events/${eventId}/comparison-report/status`,
        method: "POST",
        body: { status, padronVersionId },
      }),
    }),

    checkEligibility: builder.query<EligibilityResult, { eventId: string; carnet: string }>({
      query: ({ eventId, carnet }) =>
        `/voting/events/${eventId}/eligibility?carnet=${encodeURIComponent(carnet)}`,
      transformResponse: (response: any) => ({
        status: String(response?.status ?? "NOT_ELIGIBLE"),
        eligible: String(response?.status ?? "").toUpperCase() === "ELIGIBLE",
        normalizedCarnet: response?.normalizedCarnet,
        referenceVersion: response?.referenceVersion ?? null,
      }),
    }),

    checkPublicEligibility: builder.query<EligibilityResult, { eventId: string; carnet: string }>({
      query: ({ eventId, carnet }) =>
        `/voting/events/${eventId}/eligibility/public?carnet=${encodeURIComponent(carnet)}`,
      transformResponse: (response: any) => ({
        status: String(response?.status ?? "NOT_ELIGIBLE"),
        eligible: String(response?.status ?? "").toUpperCase() === "ELIGIBLE",
        referenceVersion: response?.referenceVersion ?? null,
      }),
    }),

    createParticipation: builder.mutation<
      { statusCode: number; body: unknown },
      { eventId: string; data: CreateParticipationDto; idempotencyKey?: string }
    >({
      query: ({ eventId, data, idempotencyKey }) => ({
        url: `/voting/events/${eventId}/participations`,
        method: "POST",
        body: data,
        headers: idempotencyKey ? { "idempotency-key": idempotencyKey } : {},
      }),
      transformResponse: (response: any, _meta: any) => ({
        statusCode: 200,
        body: response,
      }),
    }),

    getParticipationStatus: builder.query<ParticipationStatus, { eventId: string; carnet: string }>({
      query: ({ eventId, carnet }) =>
        `/voting/events/${eventId}/participations/status?carnet=${encodeURIComponent(carnet)}`,
      transformResponse: (response: any) => ({
        status: String(response?.status ?? "UNKNOWN"),
        hasParticipated: Boolean(response?.alreadyVoted),
        alreadyVoted: Boolean(response?.alreadyVoted),
        canVote: Boolean(response?.canVote),
        participatedAt: response?.participatedAt,
      }),
    }),

    createEventNews: builder.mutation<EventNews, { eventId: string; data: CreateEventNewsDto }>({
      query: ({ eventId, data }) => ({
        url: `/voting/events/${eventId}/news`,
        method: "POST",
        body: data,
      }),
      transformResponse: (response: any) => ({
        eventId: String(response?.eventId ?? ""),
        sent: Number(response?.sent ?? 0),
        skipped: response?.skipped ?? null,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEventNews", id: eventId }],
    }),
  }),
});

export const {
  useGetVotingEventsQuery,
  useLazyGetVotingEventsQuery,
  useGetVotingEventQuery,
  useLazyGetVotingEventQuery,
  useCreateVotingEventMutation,
  useUpdateVotingEventMutation,
  useDeleteVotingEventMutation,
  usePublishVotingEventMutation,
  useGetEventRolesQuery,
  useLazyGetEventRolesQuery,
  useCreateEventRoleMutation,
  useUpdateEventRoleMutation,
  useDeleteEventRoleMutation,
  useGetEventOptionsQuery,
  useLazyGetEventOptionsQuery,
  useCreateVotingOptionMutation,
  useUpdateVotingOptionMutation,
  useReplaceOptionCandidatesMutation,
  useDeactivateVotingOptionMutation,
  useDeleteVotingOptionMutation,
  useImportPadronMutation,
  useGetPadronVersionsQuery,
  useLazyGetPadronVersionsQuery,
  useGetPadronVotersQuery,
  useLazyGetPadronVotersQuery,
  useLazyDownloadPadronCsvQuery,
  useUpdateEventScheduleMutation,
  useUpdatePublicEligibilityMutation,
  useGetEventResultsQuery,
  useLazyGetEventResultsQuery,
  useUpsertResultsSnapshotMutation,
  useUpdateComparisonReportStatusMutation,
  useCheckEligibilityQuery,
  useLazyCheckEligibilityQuery,
  useCheckPublicEligibilityQuery,
  useLazyCheckPublicEligibilityQuery,
  useCreateParticipationMutation,
  useGetParticipationStatusQuery,
  useLazyGetParticipationStatusQuery,
  useCreateEventNewsMutation,
} = votingEventsEndpoints;
