import { apiSlice } from "../apiSlice";
import {
  normalizeCreatePresentialSessionResult,
  normalizePresentialCurrentState,
} from "@/domains/votacion/kiosk/presentialSessionAdapters";
import type {
  ComparisonReportStatus,
  ConfirmPadronStagingResult,
  CreateEventNewsDto,
  CreatePresentialSessionDto,
  CreateEventRoleDto,
  CreateParticipationDto,
  CurrentPadronVoterMutationResult,
  CreatePresentialSessionResult,
  CreateVotingEventDto,
  CreateVotingOptionDto,
  EligibilityResult,
  EventNews,
  EventResults,
  EventRole,
  PadronCsvDownload,
  PadronImportJob,
  PadronImportResult,
  PadronStagingEntry,
  PadronStagingList,
  PadronSummary,
  PadronVersion,
  PadronVoter,
  PadronWorkflowSummary,
  ParticipationStatus,
  PresentialCurrentState,
  ReviewReadinessResponse,
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

const unwrapApiData = (raw: any) => raw?.data ?? raw;

const toPublicationWindow = (source: any) => ({
  deadline: source?.deadline ?? null,
  canConfirmOfficialPublication: Boolean(source?.canConfirmOfficialPublication),
  expired: Boolean(source?.expired),
  hoursUntilDeadline:
    source?.hoursUntilDeadline === null || source?.hoursUntilDeadline === undefined
      ? null
      : Number(source.hoursUntilDeadline),
});

const toReviewReadiness = (raw: any): ReviewReadinessResponse => {
  const source = unwrapApiData(raw);
  return {
    id: String(source?.id ?? source?._id ?? ""),
    state: (source?.state ?? "DRAFT") as ReviewReadinessResponse["state"],
    isReady: Boolean(source?.isReady),
    pending: Array.isArray(source?.pending) ? source.pending.map(String) : [],
    publishDeadline: source?.publishDeadline ?? null,
    publicationWindow: source?.publicationWindow
      ? toPublicationWindow(source.publicationWindow)
      : undefined,
  };
};

const toPublishResponse = (raw: any): PublishEventResponse => {
  const source = unwrapApiData(raw);
  return {
    id: String(source?.id ?? source?._id ?? ""),
    state: (source?.state ?? "DRAFT") as PublishEventResponse["state"],
    nullifiers: Array.isArray(source?.nullifiers) ? source.nullifiers.map(String) : undefined,
    officialPublishedAt: source?.officialPublishedAt ?? null,
    publishDeadline: source?.publishDeadline ?? null,
    publicationConfirmed:
      source?.publicationConfirmed === undefined
        ? undefined
        : Boolean(source.publicationConfirmed),
    publicationWindow: source?.publicationWindow
      ? toPublicationWindow(source.publicationWindow)
      : undefined,
    publicUrl: source?.publicUrl ?? undefined,
    publicPath: source?.publicPath ?? undefined,
  };
};

const toVotingEvent = (raw: any): VotingEvent => {
  const source = unwrapApiData(raw);
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
    publishDeadline: source?.publishDeadline ?? null,
    state,
    status: state,
    publicEligibilityEnabled: Boolean(source?.publicEligibilityEnabled),
    publicEligibility: Boolean(source?.publicEligibilityEnabled),
    presentialKioskEnabled: Boolean(source?.presentialKioskEnabled),
    canEditPadronInLimitedMode:
      source?.canEditPadronInLimitedMode === undefined
        ? undefined
        : Boolean(source.canEditPadronInLimitedMode),
    createdAt: source?.createdAt,
    updatedAt: source?.updatedAt,
    roles: Array.isArray(source?.roles)
      ? source.roles.map((r: any) => ({
          id: String(r?.id ?? r?._id ?? ""),
          eventId: String(r?.eventId ?? source?.id ?? source?._id ?? ""),
          name: r?.name ?? "",
          maxWinners: Number(r?.maxWinners ?? 1),
          createdAt: r?.createdAt,
        }))
      : undefined,
    options: Array.isArray(source?.options)
      ? source.options.map((o: any) => ({
          id: String(o?.id ?? o?._id ?? ""),
          eventId: String(o?.eventId ?? source?.id ?? source?._id ?? ""),
          name: o?.name ?? "",
          color: o?.color ?? o?.colors?.[0] ?? "#000000",
          colors: Array.isArray(o?.colors) ? o.colors.map(String) : undefined,
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

const toRole = (raw: any): EventRole => {
  const source = unwrapApiData(raw);
  return {
    id: String(source?.id ?? source?._id ?? ""),
    eventId: String(source?.eventId ?? ""),
    name: source?.name ?? "",
    maxWinners: Number(source?.maxWinners ?? 1),
    createdAt: source?.createdAt,
  };
};

const toOption = (raw: any): VotingOption => {
  const source = unwrapApiData(raw);
  return {
    id: String(source?.id ?? source?._id ?? ""),
    eventId: String(source?.eventId ?? ""),
    name: source?.name ?? "",
    color: source?.color ?? source?.colors?.[0] ?? "#000000",
    colors: Array.isArray(source?.colors) ? source.colors.map(String) : undefined,
    logoUrl: source?.logoUrl ?? undefined,
    active: Boolean(source?.active ?? true),
    createdAt: source?.createdAt,
    candidates: Array.isArray(source?.candidates)
      ? source.candidates.map((c: any, idx: number) => ({
          id: String(c?.id ?? c?._id ?? `${String(source?.id ?? source?._id ?? "opt")}-${idx}`),
          optionId: String(source?.id ?? source?._id ?? ""),
          name: c?.name ?? "",
          photoUrl: c?.photoUrl ?? undefined,
          roleName: c?.roleName ?? "",
        }))
      : [],
  };
};

const toPadronImportJob = (raw: any): PadronImportJob => {
  const source = unwrapApiData(raw);
  return {
    importJobId: String(source?.importJobId ?? source?.id ?? source?._id ?? ""),
    eventId: String(source?.eventId ?? ""),
    tenantId: String(source?.tenantId ?? ""),
    sourceType: source?.sourceType === "IMAGE" ? "IMAGE" : "PDF",
    status: (source?.status ?? "PROCESSING") as PadronImportJob["status"],
    isActiveDraft: Boolean(source?.isActiveDraft),
    originalFile: {
      fileName: String(source?.originalFile?.fileName ?? ""),
      mimeType: String(source?.originalFile?.mimeType ?? ""),
      size: Number(source?.originalFile?.size ?? 0),
      sha256: String(source?.originalFile?.sha256 ?? ""),
    },
    parser: {
      provider: String(source?.parser?.provider ?? "local-fallback"),
      model: source?.parser?.model ?? null,
      usedFallback: source?.parser?.usedFallback !== false,
    },
    summary: {
      parsedCount: Number(source?.summary?.parsedCount ?? 0),
      validCount: Number(source?.summary?.validCount ?? 0),
      duplicateCount: Number(source?.summary?.duplicateCount ?? 0),
      invalidCount: Number(source?.summary?.invalidCount ?? 0),
      stagingCount: Number(source?.summary?.stagingCount ?? 0),
      enabledCount: Number(source?.summary?.enabledCount ?? 0),
      disabledCount: Number(source?.summary?.disabledCount ?? 0),
    },
    errors: Array.isArray(source?.errors)
      ? source.errors.map((error: any) => ({
          code: String(error?.code ?? "UNKNOWN"),
          message: String(error?.message ?? "Observación de procesamiento"),
          rowIndex:
            error?.rowIndex === null || error?.rowIndex === undefined
              ? null
              : Number(error.rowIndex),
          rawValue:
            error?.rawValue === null || error?.rawValue === undefined
              ? null
              : String(error.rawValue),
        }))
      : [],
    processedAt: source?.processedAt ?? null,
    confirmedAt: source?.confirmedAt ?? null,
    confirmedPadronVersionId: source?.confirmedPadronVersionId
      ? String(source.confirmedPadronVersionId)
      : null,
    createdAt: source?.createdAt ?? null,
    updatedAt: source?.updatedAt ?? null,
  };
};

const toPadronStagingEntry = (raw: any): PadronStagingEntry => {
  const source = unwrapApiData(raw);
  return {
    id: String(source?.id ?? source?._id ?? ""),
    importJobId: String(source?.importJobId ?? ""),
    ci: String(source?.ci ?? source?.carnetNorm ?? ""),
    enabled: source?.enabled !== false,
    sourceKind: source?.sourceKind === "MANUAL" ? "MANUAL" : "PARSED",
    sourceRow:
      source?.sourceRow === null || source?.sourceRow === undefined
        ? null
        : Number(source.sourceRow),
    createdAt: source?.createdAt ?? null,
    updatedAt: source?.updatedAt ?? null,
  };
};

const toPadronWorkflowSummary = (raw: any): PadronWorkflowSummary => {
  const source = unwrapApiData(raw);
  const currentVersion = source?.currentVersion;
  return {
    eventId: String(source?.eventId ?? ""),
    eventState: source?.eventState ?? undefined,
    canEditPadronInLimitedMode:
      source?.canEditPadronInLimitedMode === undefined
        ? undefined
        : Boolean(source.canEditPadronInLimitedMode),
    currentVersion: currentVersion
      ? {
          padronVersionId: String(currentVersion?.padronVersionId ?? ""),
          createdAt: currentVersion?.createdAt ?? null,
          createdBy: String(currentVersion?.createdBy ?? ""),
          totals: {
            validCount: Number(currentVersion?.totals?.validCount ?? 0),
            duplicateCount: Number(currentVersion?.totals?.duplicateCount ?? 0),
            invalidCount: Number(currentVersion?.totals?.invalidCount ?? 0),
          },
          sourceType:
            currentVersion?.sourceType === "IMAGE_IMPORT"
              ? "IMAGE_IMPORT"
              : currentVersion?.sourceType === "PDF_IMPORT"
                ? "PDF_IMPORT"
                : "CSV_LEGACY",
          importJobId: currentVersion?.importJobId
            ? String(currentVersion.importJobId)
            : null,
          comparisonStatus:
            currentVersion?.comparisonStatus === "OK"
              ? "OK"
              : currentVersion?.comparisonStatus === "FAILED"
                ? "FAILED"
                : "PENDING",
          certificate: currentVersion?.certificate ?? undefined,
        }
      : null,
    activeDraft: source?.activeDraft ? toPadronImportJob(source.activeDraft) : null,
  };
};

const toCreatePresentialSessionResult = (
  raw: any,
): CreatePresentialSessionResult => normalizeCreatePresentialSessionResult(raw);

const toPresentialCurrentState = (raw: any): PresentialCurrentState =>
  normalizePresentialCurrentState(raw);

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

    publishVotingEvent: builder.mutation<PublishEventResponse, { electionId: string; }>({
      query: ({ electionId }) => ({
        url: `/voting/events/${electionId}/publish`,
        method: "POST",
      }),
      transformResponse: (response: any) => toPublishResponse(response),
      invalidatesTags: (_result, _error, { electionId }) => [{ type: "VotingEvents", id: electionId }],
    }),

    getEventReviewReadiness: builder.query<ReviewReadinessResponse, string>({
      query: (eventId) => `/voting/events/${eventId}/review-readiness`,
      transformResponse: (response: any) => toReviewReadiness(response),
      providesTags: (_result, _error, eventId) => [{ type: "VotingEvents", id: eventId }],
    }),

    markEventReadyForReview: builder.mutation<ReviewReadinessResponse, string>({
      query: (eventId) => ({
        url: `/voting/events/${eventId}/ready-for-review`,
        method: "POST",
      }),
      transformResponse: (response: any) => toReviewReadiness(response),
      invalidatesTags: (_result, _error, eventId) => [{ type: "VotingEvents", id: eventId }],
    }),

    confirmOfficialPublication: builder.mutation<PublishEventResponse, { eventId: string }>({
      query: ({ eventId }) => ({
        url: `/voting/events/${eventId}/official-publication/confirm`,
        method: "POST",
        body: {},
      }),
      transformResponse: (response: any) => toPublishResponse(response),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEvents", id: eventId }],
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
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "VotingEventPadron", id: eventId },
        { type: "VotingEventPadronSummary", id: eventId },
        { type: "VotingEvents", id: eventId },
      ],
    }),

    uploadPadronSource: builder.mutation<PadronImportJob, { eventId: string; file: File }>({
      query: ({ eventId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/voting/events/${eventId}/padron/imports`,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: any) => toPadronImportJob(response),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "VotingEventPadron", id: eventId },
        { type: "VotingEventPadronSummary", id: eventId },
        { type: "VotingEvents", id: eventId },
      ],
    }),

    getPadronImportStatus: builder.query<
      PadronImportJob,
      { eventId: string; importJobId: string }
    >({
      query: ({ eventId, importJobId }) =>
        `/voting/events/${eventId}/padron/imports/${importJobId}`,
      transformResponse: (response: any) => toPadronImportJob(response),
      providesTags: (_result, _error, { eventId }) => [
        { type: "VotingEventPadron", id: eventId },
        { type: "VotingEventPadronSummary", id: eventId },
      ],
    }),

    getPadronWorkflowSummary: builder.query<PadronWorkflowSummary, string>({
      query: (eventId) => `/voting/events/${eventId}/padron/summary`,
      transformResponse: (response: any) => toPadronWorkflowSummary(response),
      providesTags: (_result, _error, eventId) => [
        { type: "VotingEventPadron", id: eventId },
        { type: "VotingEventPadronSummary", id: eventId },
      ],
    }),

    getPadronStaging: builder.query<
      PadronStagingList,
      { eventId: string; page?: number; limit?: number }
    >({
      query: ({ eventId, page = 1, limit = 50 }) => ({
        url: `/voting/events/${eventId}/padron/staging`,
        params: { page, limit },
      }),
      transformResponse: (response: any) => ({
        importJob: response?.importJob ? toPadronImportJob(response.importJob) : null,
        data: Array.isArray(response?.data)
          ? response.data.map((entry: any) => toPadronStagingEntry(entry))
          : [],
        page: Number(response?.page ?? 1),
        limit: Number(response?.limit ?? 50),
        total: Number(response?.total ?? 0),
        totalPages: Number(response?.totalPages ?? 0),
      }),
      providesTags: (_result, _error, { eventId }) => [
        { type: "VotingEventPadron", id: eventId },
        { type: "VotingEventPadronSummary", id: eventId },
      ],
    }),

    addPadronStagingEntry: builder.mutation<
      PadronStagingEntry,
      { eventId: string; ci: string; enabled?: boolean }
    >({
      query: ({ eventId, ...body }) => ({
        url: `/voting/events/${eventId}/padron/staging`,
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => toPadronStagingEntry(response),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "VotingEventPadron", id: eventId },
        { type: "VotingEventPadronSummary", id: eventId },
        { type: "VotingEvents", id: eventId },
      ],
    }),

    updatePadronStagingEntry: builder.mutation<
      PadronStagingEntry,
      { eventId: string; entryId: string; ci?: string; enabled?: boolean }
    >({
      query: ({ eventId, entryId, ...body }) => ({
        url: `/voting/events/${eventId}/padron/staging/${entryId}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: any) => toPadronStagingEntry(response),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "VotingEventPadron", id: eventId },
        { type: "VotingEventPadronSummary", id: eventId },
        { type: "VotingEvents", id: eventId },
      ],
    }),

    deletePadronStagingEntry: builder.mutation<
      { id: string; deleted: boolean },
      { eventId: string; entryId: string }
    >({
      query: ({ eventId, entryId }) => ({
        url: `/voting/events/${eventId}/padron/staging/${entryId}`,
        method: "DELETE",
      }),
      transformResponse: (response: any) => ({
        id: String(response?.id ?? ""),
        deleted: Boolean(response?.deleted),
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "VotingEventPadron", id: eventId },
        { type: "VotingEventPadronSummary", id: eventId },
        { type: "VotingEvents", id: eventId },
      ],
    }),

    confirmPadronStaging: builder.mutation<
      ConfirmPadronStagingResult,
      { eventId: string }
    >({
      query: ({ eventId }) => ({
        url: `/voting/events/${eventId}/padron/staging/confirm`,
        method: "POST",
        body: {},
      }),
      transformResponse: (response: any) => ({
        importJobId: String(response?.importJobId ?? ""),
        padronVersionId: String(response?.padronVersionId ?? ""),
        state: "CONFIRMED",
        totals: {
          validCount: Number(response?.totals?.validCount ?? 0),
          duplicateCount: Number(response?.totals?.duplicateCount ?? 0),
          invalidCount: Number(response?.totals?.invalidCount ?? 0),
        },
        comparisonStatus:
          response?.comparisonStatus === "OK"
            ? "OK"
            : response?.comparisonStatus === "FAILED"
              ? "FAILED"
              : "PENDING",
        sourceType: response?.sourceType === "IMAGE_IMPORT" ? "IMAGE_IMPORT" : "PDF_IMPORT",
        certificate: response?.certificate ?? undefined,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "VotingEventPadron", id: eventId },
        { type: "VotingEventPadronSummary", id: eventId },
        { type: "VotingEvents", id: eventId },
      ],
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
              sourceType:
                v?.sourceType === "IMAGE_IMPORT"
                  ? "IMAGE_IMPORT"
                  : v?.sourceType === "PDF_IMPORT"
                    ? "PDF_IMPORT"
                    : "CSV_LEGACY",
              importJobId: v?.importJobId ? String(v.importJobId) : null,
            }))
          : [],
      providesTags: (_result, _error, eventId) => [{ type: "VotingEventPadron", id: eventId }],
    }),

    getPadronSummary: builder.query<PadronSummary, string>({
      query: (eventId) => `/voting/events/${eventId}/padron/voters/summary`,
      providesTags: (_result, _error, eventId) => [{ type: "VotingEventPadronSummary", id: eventId }],
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

    addCurrentPadronVoter: builder.mutation<
      CurrentPadronVoterMutationResult,
      { eventId: string; carnet: string; enabled?: boolean }
    >({
      query: ({ eventId, ...body }) => ({
        url: `/voting/events/${eventId}/padron/voters`,
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => ({
        id: String(response?.id ?? response?._id ?? ""),
        padronVersionId: String(response?.padronVersionId ?? ""),
        carnetNorm: String(response?.carnetNorm ?? ""),
        enabled: response?.enabled !== false,
        mode: response?.mode === "VOTING_LIMITED" ? "VOTING_LIMITED" : undefined,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "VotingEventPadron", id: eventId },
        { type: "VotingEventPadronSummary", id: eventId },
        { type: "VotingEvents", id: eventId },
      ],
    }),

    enableCurrentPadronVoter: builder.mutation<
      CurrentPadronVoterMutationResult,
      { eventId: string; voterId: string }
    >({
      query: ({ eventId, voterId }) => ({
        url: `/voting/events/${eventId}/padron/voters/${voterId}/enable`,
        method: "POST",
        body: {},
      }),
      transformResponse: (response: any) => ({
        id: String(response?.id ?? response?._id ?? ""),
        padronVersionId: String(response?.padronVersionId ?? ""),
        carnetNorm: String(response?.carnetNorm ?? ""),
        enabled: response?.enabled !== false,
        mode: response?.mode === "VOTING_LIMITED" ? "VOTING_LIMITED" : undefined,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "VotingEventPadron", id: eventId },
        { type: "VotingEventPadronSummary", id: eventId },
        { type: "VotingEvents", id: eventId },
      ],
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

    createPresentialSession: builder.mutation<
      CreatePresentialSessionResult,
      { eventId: string; data?: CreatePresentialSessionDto }
    >({
      query: ({ eventId, data }) => ({
        url: `/voting/events/${eventId}/presential-sessions`,
        method: "POST",
        body: data ?? {},
      }),
      transformResponse: toCreatePresentialSessionResult,
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "VotingEvents", id: eventId }],
    }),

    getCurrentPresentialSession: builder.query<
      PresentialCurrentState,
      { eventId: string; stationId?: string; kioskToken?: string }
    >({
      query: ({ eventId, stationId, kioskToken }) => ({
        url: `/voting/events/${eventId}/presential-sessions/current`,
        params: stationId ? { stationId } : undefined,
        headers: kioskToken ? { "x-kiosk-token": kioskToken } : undefined,
      }),
      transformResponse: toPresentialCurrentState,
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
  useGetEventReviewReadinessQuery,
  useMarkEventReadyForReviewMutation,
  useConfirmOfficialPublicationMutation,
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
  useUploadPadronSourceMutation,
  useGetPadronImportStatusQuery,
  useLazyGetPadronImportStatusQuery,
  useGetPadronWorkflowSummaryQuery,
  useLazyGetPadronWorkflowSummaryQuery,
  useGetPadronStagingQuery,
  useLazyGetPadronStagingQuery,
  useAddPadronStagingEntryMutation,
  useUpdatePadronStagingEntryMutation,
  useDeletePadronStagingEntryMutation,
  useAddCurrentPadronVoterMutation,
  useEnableCurrentPadronVoterMutation,
  useConfirmPadronStagingMutation,
  useGetPadronVersionsQuery,
  useLazyGetPadronVersionsQuery,
  useGetPadronSummaryQuery,
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
  useCreatePresentialSessionMutation,
  useGetCurrentPresentialSessionQuery,
  useLazyGetCurrentPresentialSessionQuery,
  useCreateEventNewsMutation,
} = votingEventsEndpoints;
