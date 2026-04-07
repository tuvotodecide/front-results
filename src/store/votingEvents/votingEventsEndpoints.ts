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
  PublishEventResponse,
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

type ApiRecord = Record<string, unknown>;
type ApiRole = ApiRecord & {
  id?: string;
  _id?: string;
  eventId?: string;
  name?: string;
  maxWinners?: number;
  createdAt?: string;
};
type ApiOption = ApiRecord & {
  id?: string;
  _id?: string;
  eventId?: string;
  name?: string;
  color?: string;
  logoUrl?: string;
  active?: boolean;
  createdAt?: string;
  candidates?: unknown[];
};
type ApiCandidate = ApiRecord & {
  id?: string;
  _id?: string;
  name?: string;
  photoUrl?: string;
  roleName?: string;
};
type ApiVotingEvent = ApiRecord & {
  id?: string;
  _id?: string;
  tenantId?: string;
  chainRequestId?: string;
  name?: string;
  objective?: string;
  votingStart?: string | null;
  votingEnd?: string | null;
  resultsPublishAt?: string | null;
  state?: string;
  status?: string;
  publicEligibilityEnabled?: boolean;
  roles?: unknown[];
  options?: unknown[];
};
type ApiPadronVersion = ApiRecord & {
  id?: string;
  padronVersionId?: string;
  fileDigest?: string;
  totals?: {
    validCount?: number;
    invalidCount?: number;
    duplicateCount?: number;
  };
  createdAt?: string;
  createdBy?: string;
  isCurrent?: boolean;
};
type ApiPadronVoter = ApiRecord & {
  id?: string;
  _id?: string;
  carnetNorm?: string;
  enabled?: boolean;
  createdAt?: string;
};
type ApiRankingItem = ApiRecord & {
  optionId?: string;
  optionName?: string;
  votes?: number;
  percentage?: number;
};
type ApiResultsRole = ApiRecord & {
  roleName?: string;
  total?: number;
  ranking?: unknown[];
  winners?: string[];
};

const asRecord = (value: unknown): ApiRecord =>
  typeof value === "object" && value !== null ? (value as ApiRecord) : {};

const unwrapApiData = <T = unknown>(raw: unknown): T | ApiRecord => {
  const record = asRecord(raw);
  return (record.data as T | undefined) ?? record;
};

const toVotingEvent = (raw: unknown): VotingEvent => {
  const source = unwrapApiData<ApiVotingEvent>(raw) as ApiVotingEvent;
  const state = (source?.state ?? source?.status ?? "DRAFT") as VotingEvent["state"];
  return {
    id: String(source?.id ?? source?._id ?? ""),
    tenantId: String(source?.tenantId ?? ""),
    chainRequestId: String(source?.chainRequestId ?? ""),
    name: source?.name ?? "",
    objective: source?.objective ?? "",
    votingStart: source?.votingStart ?? null,
    votingEnd: source?.votingEnd ?? null,
    resultsPublishAt: source?.resultsPublishAt ?? null,
    state,
    status: state,
    publicEligibilityEnabled: Boolean(source?.publicEligibilityEnabled),
    publicEligibility: Boolean(source?.publicEligibilityEnabled),
    roles: Array.isArray(source?.roles)
      ? source.roles.map((rawRole) => {
          const r = asRecord(rawRole) as ApiRole;
          return {
          id: String(r?.id ?? r?._id ?? ""),
          eventId: String(r?.eventId ?? source?.id ?? source?._id ?? ""),
          name: r?.name ?? "",
          maxWinners: Number(r?.maxWinners ?? 1),
          createdAt: r?.createdAt,
          };
        })
      : undefined,
    options: Array.isArray(source?.options)
      ? source.options.map((rawOption) => {
          const o = asRecord(rawOption) as ApiOption;
          return {
          id: String(o?.id ?? o?._id ?? ""),
          eventId: String(o?.eventId ?? source?.id ?? source?._id ?? ""),
          name: o?.name ?? "",
          color: o?.color ?? "#000000",
          logoUrl: o?.logoUrl ?? undefined,
          active: Boolean(o?.active ?? true),
          createdAt: o?.createdAt,
          candidates: Array.isArray(o?.candidates)
            ? o.candidates.map((rawCandidate, idx: number) => {
                const c = asRecord(rawCandidate) as ApiCandidate;
                return {
                id: String(c?.id ?? c?._id ?? `${String(o?.id ?? o?._id ?? "opt")}-${idx}`),
                optionId: String(o?.id ?? o?._id ?? ""),
                name: c?.name ?? "",
                photoUrl: c?.photoUrl ?? undefined,
                roleName: c?.roleName ?? "",
                };
              })
            : [],
          };
        })
      : undefined,
  };
};

const toRole = (raw: unknown): EventRole => {
  const source = unwrapApiData<ApiRole>(raw) as ApiRole;
  return {
    id: String(source?.id ?? source?._id ?? ""),
    eventId: String(source?.eventId ?? ""),
    name: source?.name ?? "",
    maxWinners: Number(source?.maxWinners ?? 1),
    createdAt: source?.createdAt,
  };
};

const toOption = (raw: unknown): VotingOption => {
  const source = unwrapApiData<ApiOption>(raw) as ApiOption;
  return {
    id: String(source?.id ?? source?._id ?? ""),
    eventId: String(source?.eventId ?? ""),
    name: source?.name ?? "",
    color: source?.color ?? "#000000",
    logoUrl: source?.logoUrl ?? undefined,
    active: Boolean(source?.active ?? true),
    createdAt: source?.createdAt,
    candidates: Array.isArray(source?.candidates)
      ? source.candidates.map((rawCandidate, idx: number) => {
          const c = asRecord(rawCandidate) as ApiCandidate;
          return {
          id: String(c?.id ?? c?._id ?? `${String(source?.id ?? source?._id ?? "opt")}-${idx}`),
          optionId: String(source?.id ?? source?._id ?? ""),
          name: c?.name ?? "",
          photoUrl: c?.photoUrl ?? undefined,
          roleName: c?.roleName ?? "",
          };
        })
      : [],
  };
};

export const votingEventsEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getVotingEvents: builder.query<VotingEvent[], { tenantId?: string } | void>({
      query: (params) => ({
        url: "/voting/events",
        params: params || {},
      }),
      transformResponse: (response: unknown) => {
        const data = (asRecord(response).data as unknown[]) ?? [];
        return Array.isArray(data) ? data.map(toVotingEvent) : [];
      },
      providesTags: ["VotingEvents"],
    }),

    getVotingEvent: builder.query<VotingEvent, string>({
      query: (eventId) => `/voting/events/${eventId}`,
      transformResponse: (response: unknown) => toVotingEvent(response),
      providesTags: (_result, _error, eventId) => [{ type: "VotingEvents", id: eventId }],
    }),

    createVotingEvent: builder.mutation<VotingEvent, CreateVotingEventDto>({
      query: (body) => ({
        url: "/voting/events",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) => toVotingEvent(response),
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
      transformResponse: (response: unknown) => toVotingEvent(response),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEvents", id: eventId }],
    }),

    deleteVotingEvent: builder.mutation<void, string>({
      query: (eventId) => ({
        url: `/voting/events/${eventId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["VotingEvents"],
    }),

    publishVotingEvent: builder.mutation<PublishEventResponse, { electionId: string; nullifiers: string[] }>({
      query: ({ electionId, nullifiers }) => ({
        url: `/voting/events/${electionId}/publish`,
        method: "POST",
        body: nullifiers,
      }),
      invalidatesTags: (_result, _error, { electionId }) => [{ type: "VotingEvents", id: electionId }],
    }),

    getEventRoles: builder.query<EventRole[], string>({
      query: (eventId) => `/voting/events/${eventId}/roles`,
      transformResponse: (response: unknown) => {
        const data = (asRecord(response).data as unknown[]) ?? [];
        return Array.isArray(data) ? data.map(toRole) : [];
      },
      providesTags: (_result, _error, eventId) => [{ type: "VotingEventRoles", id: eventId }],
    }),

    createEventRole: builder.mutation<EventRole, { eventId: string; data: CreateEventRoleDto }>({
      query: ({ eventId, data }) => ({
        url: `/voting/events/${eventId}/roles`,
        method: "POST",
        body: data,
      }),
      transformResponse: (response: unknown) => toRole(response),
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
      transformResponse: (response: unknown) => toRole(response),
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
      transformResponse: (response: unknown) => {
        const data = (asRecord(response).data as unknown[]) ?? [];
        return Array.isArray(data) ? data.map(toOption) : [];
      },
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
      transformResponse: (response: unknown) => toOption(response),
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
      transformResponse: (response: unknown) => toOption(response),
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
      transformResponse: (response: unknown) => toOption(response),
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
      transformResponse: (response: unknown) => {
        const payload = asRecord(response) as ApiRecord & {
          padronVersionId?: string;
          fileDigest?: string;
          totals?: PadronImportResult["totals"];
          createdAt?: string;
        };
        return {
        versionId: String(payload.padronVersionId ?? ""),
        padronVersionId: String(payload.padronVersionId ?? ""),
        fileDigest: String(payload.fileDigest ?? ""),
        totalRecords: Number(payload.totals?.validCount ?? 0),
        validCount: Number(payload.totals?.validCount ?? 0),
        invalidCount: Number(payload.totals?.invalidCount ?? 0),
        duplicateCount: Number(payload.totals?.duplicateCount ?? 0),
        uploadedAt: payload.createdAt,
        totals: payload.totals,
        };
      },
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEventPadron", id: eventId }],
    }),

    getPadronVersions: builder.query<PadronVersion[], string>({
      query: (eventId) => `/voting/events/${eventId}/padron/versions`,
      transformResponse: (response: unknown) => {
        const data = (asRecord(response).data as unknown[]) ?? [];
        return Array.isArray(data)
          ? data.map((v) => {
              const version = asRecord(v) as ApiPadronVersion;
              return {
                id: String(version.padronVersionId ?? version.id ?? ""),
                padronVersionId: String(version.padronVersionId ?? version.id ?? ""),
                fileDigest: String(version.fileDigest ?? ""),
                fileName: `padron-${String(version.padronVersionId ?? version.id ?? "")}.csv`,
                totalRecords: Number(version.totals?.validCount ?? 0),
                validCount: Number(version.totals?.validCount ?? 0),
                invalidCount: Number(version.totals?.invalidCount ?? 0),
                duplicateCount: Number(version.totals?.duplicateCount ?? 0),
                uploadedAt: version.createdAt ?? "",
                createdAt: version.createdAt ?? "",
                createdBy: version.createdBy,
                isCurrent: Boolean(version.isCurrent),
              };
            })
          : [];
      },
      providesTags: (_result, _error, eventId) => [{ type: "VotingEventPadron", id: eventId }],
    }),

    getPadronVoters: builder.query<
      { voters: PadronVoter[]; total: number; page: number; limit: number; totalPages: number },
      { eventId: string; page?: number; limit?: number }
    >({
      query: ({ eventId, page = 1, limit = 50 }) =>
        `/voting/events/${eventId}/padron/voters?page=${page}&limit=${limit}`,
      transformResponse: (response: unknown) => {
        const payload = asRecord(response);
        const data = (payload.data as unknown[]) ?? [];
        return {
          voters: Array.isArray(data)
            ? data.map((v) => {
                const voter = asRecord(v) as ApiPadronVoter;
                return {
                  id: String(voter.id ?? voter._id ?? ""),
                  carnet: String(voter.carnetNorm ?? ""),
                  carnetNorm: String(voter.carnetNorm ?? ""),
                  enabled: voter.enabled !== false,
                  status: "valid" as const,
                  createdAt: voter.createdAt,
                };
              })
            : [],
          total: Number(payload.total ?? 0),
          page: Number(payload.page ?? 1),
          limit: Number(payload.limit ?? 50),
          totalPages: Number(payload.totalPages ?? 0),
        };
      },
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
        const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/i);
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
      transformResponse: (response: unknown) => {
        const payload = asRecord(response);
        const roles = (payload.roles as unknown[]) ?? [];
        return {
        eventId: String(payload.eventId ?? ""),
        status: "FINAL",
        roles: Array.isArray(roles)
          ? roles.map((r) => {
              const role = asRecord(r) as ApiResultsRole;
              return {
              roleName: role.roleName ?? "",
              total: Number(role.total ?? 0),
              ranking: Array.isArray(role.ranking)
                ? role.ranking.map((rk) => {
                    const ranking = asRecord(rk) as ApiRankingItem;
                    return {
                    optionId: String(ranking.optionId ?? ""),
                    optionName: ranking.optionName ?? "",
                    votes: Number(ranking.votes ?? 0),
                    percentage: Number(ranking.percentage ?? 0),
                    };
                  })
                : [],
              winners: Array.isArray(role.winners) ? role.winners : [],
              };
            })
          : [],
        publishedAt: typeof payload.publishedAt === "string" ? payload.publishedAt : undefined,
        lastUpdated: typeof payload.publishedAt === "string" ? payload.publishedAt : undefined,
        source: typeof payload.source === "string" ? payload.source : undefined,
        txHash: typeof payload.txHash === "string" ? payload.txHash : undefined,
        blockNumber: typeof payload.blockNumber === "string" ? payload.blockNumber : undefined,
        };
      },
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
      transformResponse: (response: unknown) => {
        const payload = asRecord(response);
        return {
          status: String(payload.status ?? "NOT_ELIGIBLE"),
          eligible: String(payload.status ?? "").toUpperCase() === "ELIGIBLE",
          normalizedCarnet:
            typeof payload.normalizedCarnet === "string" ? payload.normalizedCarnet : undefined,
          referenceVersion:
            typeof payload.referenceVersion === "string" ? payload.referenceVersion : null,
        };
      },
    }),

    checkPublicEligibility: builder.query<EligibilityResult, { eventId: string; carnet: string }>({
      query: ({ eventId, carnet }) =>
        `/voting/events/${eventId}/eligibility/public?carnet=${encodeURIComponent(carnet)}`,
      transformResponse: (response: unknown) => {
        const payload = asRecord(response);
        return {
          status: String(payload.status ?? "NOT_ELIGIBLE"),
          eligible: String(payload.status ?? "").toUpperCase() === "ELIGIBLE",
          referenceVersion:
            typeof payload.referenceVersion === "string" ? payload.referenceVersion : null,
        };
      },
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
      transformResponse: (response: unknown) => ({
        statusCode: 200,
        body: response,
      }),
    }),

    getParticipationStatus: builder.query<ParticipationStatus, { eventId: string; carnet: string }>({
      query: ({ eventId, carnet }) =>
        `/voting/events/${eventId}/participations/status?carnet=${encodeURIComponent(carnet)}`,
      transformResponse: (response: unknown) => {
        const payload = asRecord(response);
        return {
          status: String(payload.status ?? "UNKNOWN"),
          hasParticipated: Boolean(payload.alreadyVoted),
          alreadyVoted: Boolean(payload.alreadyVoted),
          canVote: Boolean(payload.canVote),
          participatedAt:
            typeof payload.participatedAt === "string" ? payload.participatedAt : undefined,
        };
      },
    }),

    createEventNews: builder.mutation<EventNews, { eventId: string; data: CreateEventNewsDto }>({
      query: ({ eventId, data }) => ({
        url: `/voting/events/${eventId}/news`,
        method: "POST",
        body: data,
      }),
      transformResponse: (response: unknown) => {
        const payload = asRecord(response);
        return {
          eventId: String(payload.eventId ?? ""),
          sent: Number(payload.sent ?? 0),
          skipped: typeof payload.skipped === "string" ? payload.skipped : null,
        };
      },
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
