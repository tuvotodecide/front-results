import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "@/domains/votacion/navigation/compat-private";
import Modal2 from "../../components/Modal2";
import ConfigStepsTabs from "./components/ConfigStepsTabs";
import ConfigPageFallback from "./components/ConfigPageFallback";
import LoadedPadronView from "./components/LoadedPadronView";
import PadronDropzone from "./components/PadronDropzone";
import PadronObservationsModal from "./components/PadronObservationsModal";
import PadronRecordModal from "./components/PadronRecordModal";
import PadronStagingView from "./components/PadronStagingView";
import UploadProgressModal from "./components/UploadProgressModal";
import UploadSummaryModal from "./components/UploadSummaryModal";
import {
  addGeminiDraftRecord,
  analyzePadronDocumentWithGemini,
  buildPadronCsvFromDraft,
  clearGeminiPadronDraft,
  createManualPadronDraft,
  deleteGeminiDraftRecord,
  getGeminiDraftSummary,
  hasGeminiPadronConfig,
  loadGeminiPadronDraft,
  normalizePadronCarnet,
  saveGeminiPadronDraft,
  toggleGeminiDraftRecord,
  type GeminiPadronDraft,
  updateGeminiDraftRecord,
} from "./data/padronGeminiClient";
import { getRequestErrorMessage } from "./requestErrorMessage";
import {
  areResultsAvailable,
  canEditElectionBeforeCutoff,
  canEditPadronInLimitedMode,
  hasDraftAlreadyStarted,
  hasVotingEnded,
  isAfterPublishCutoffBeforeVoting,
  isOfficiallyPublished,
  isDuringVotingWindow,
  useClientNow,
} from "./renderUtils";
import type { ConfigStep, PadronFile, Voter } from "./types";
import {
  useAddCurrentPadronVoterMutation,
  useAddPadronStagingEntryMutation,
  useConfirmPadronStagingMutation,
  useDeletePadronStagingEntryMutation,
  useEnableCurrentPadronVoterMutation,
  useGetEventOptionsQuery,
  useGetEventReviewReadinessQuery,
  useGetEventRolesQuery,
  useGetPadronStagingQuery,
  useGetPadronVotersQuery,
  useGetPadronWorkflowSummaryQuery,
  useImportPadronMutation,
  useGetVotingEventQuery,
  useLazyDownloadPadronCsvQuery,
  useLazyGetPadronImportStatusQuery,
  useUpdatePadronStagingEntryMutation,
} from "../../store/votingEvents";

type SummaryModalState = "none" | "uploading" | "summary";
type SummarySnapshot = {
  totalCount: number;
  enabledCount: number;
  disabledCount: number;
  observedCount: number;
} | null;

type RecordModalState =
  | { open: false }
  | { open: true; mode: "create"; voter?: undefined }
  | { open: true; mode: "edit"; voter: Voter };

const PAGE_SIZE = 50;
const SUPPORTED_PADRON_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
const PADRON_AI_TIMEOUT_MS = 40000;
const FINAL_STEP_LABEL = "Finalizar configuración";

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const isSupportedPadronFile = (file: File) => {
  const fileName = file.name.toLowerCase();
  return SUPPORTED_PADRON_EXTENSIONS.some((extension) => fileName.endsWith(extension));
};

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const toTimestamp = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (!value) continue;
    const timestamp = new Date(value).getTime();
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  return null;
};

const shouldPreferCurrentVersion = (
  currentVersion?: {
    padronVersionId?: string | null;
    createdAt?: string | null;
    sourceType?: string | null;
  } | null,
  activeDraft?: {
    status?: string | null;
    confirmedAt?: string | null;
    confirmedPadronVersionId?: string | null;
    processedAt?: string | null;
    updatedAt?: string | null;
    createdAt?: string | null;
  } | null,
) => {
  if (!currentVersion || !activeDraft) {
    return false;
  }

  if (
    activeDraft.status === "CONFIRMED" ||
    (activeDraft.confirmedPadronVersionId &&
      currentVersion.padronVersionId &&
      activeDraft.confirmedPadronVersionId === currentVersion.padronVersionId)
  ) {
    return true;
  }

  const currentVersionTimestamp = toTimestamp(currentVersion.createdAt);
  const activeDraftTimestamp = toTimestamp(
    activeDraft.confirmedAt,
    activeDraft.confirmedAt,
    activeDraft.processedAt,
    activeDraft.updatedAt,
    activeDraft.createdAt,
  );

  if (currentVersionTimestamp === null || activeDraftTimestamp === null) {
    return false;
  }

  return currentVersionTimestamp >= activeDraftTimestamp;
};

const formatPadronSourceLabel = (sourceType?: string | null) => {
  if (sourceType === "PDF_GEMINI" || sourceType === "PDF_IMPORT" || sourceType === "PDF") {
    return "Documento PDF";
  }
  if (sourceType === "IMAGE_GEMINI" || sourceType === "IMAGE_IMPORT" || sourceType === "IMAGE") {
    return "Imagen";
  }
  if (sourceType === "CSV_LEGACY") {
    return "Padrón";
  }
  if (sourceType === "MANUAL_CLIENT") {
    return "Carga manual";
  }
  return "Documento";
};

const getPadronFileDisplayName = (
  fileName?: string | null,
  sourceType?: string | null,
  options?: { confirmed?: boolean },
) => {
  const normalizedFileName = String(fileName ?? "").trim();
  const normalizedKey = normalizedFileName.toLowerCase();
  const baseLabel = formatPadronSourceLabel(sourceType);
  const suffix = options?.confirmed ? "confirmado" : "cargado";

  if (
    !normalizedFileName ||
    normalizedKey.includes("legacy-upload") ||
    normalizedKey.endsWith(".csv")
  ) {
    return `${baseLabel} ${suffix}`;
  }

  return normalizedFileName;
};

const createClientDraftRecordId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `padron-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const parseCsvRow = (line: string) => {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const parseEnabledFromCsv = (value: string) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return ["1", "true", "si", "sí", "habilitado", "activo"].includes(normalized);
};

const createDraftFromPadronCsv = (
  csvContent: string,
  fileName: string,
): GeminiPadronDraft => {
  const lines = csvContent
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const records = lines
    .map((line, index) => ({ values: parseCsvRow(line), index }))
    .filter(({ values }) => values.length >= 1)
    .filter(({ values, index }) => {
      if (index !== 0) return true;
      const first = String(values[0] ?? "").trim().toLowerCase();
      const second = String(values[1] ?? "").trim().toLowerCase();
      return !(first.includes("carnet") || first.includes("ci")) || !(second.includes("habil"));
    })
    .map(({ values, index }) => ({
      id: createClientDraftRecordId(),
      carnet: normalizePadronCarnet(values[0] ?? ""),
      enabled: parseEnabledFromCsv(values[1] ?? "si"),
      sourceKind: "MANUAL" as const,
      sourceRow: index + 1,
      updatedAt: null,
    }))
    .filter((record) => record.carnet);

  return {
    fileName,
    uploadedAt: new Date().toISOString(),
    sourceType: "MANUAL_CLIENT",
    analysisProvider: "MANUAL_CLIENT",
    model: null,
    records,
    observations: [],
  };
};

const ElectionConfigPadron: React.FC = () => {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();
  const actualElectionId = electionId || "";
  const nowMs = useClientNow();
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const startedPollingImportRef = useRef<string | null>(null);
  const autoOpenedConfirmedPadronRef = useRef<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [summaryModalState, setSummaryModalState] = useState<SummaryModalState>("none");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSummaryJobId, setUploadSummaryJobId] = useState<string | null>(null);
  const [clientDraft, setClientDraft] = useState<GeminiPadronDraft | null>(null);
  const [summarySnapshot, setSummarySnapshot] = useState<SummarySnapshot>(null);
  const [observationsOpen, setObservationsOpen] = useState(false);
  const [recordModal, setRecordModal] = useState<RecordModalState>({ open: false });
  const [deleteCandidate, setDeleteCandidate] = useState<Voter | null>(null);
  const [hydratedDraftEventId, setHydratedDraftEventId] = useState<string | null>(null);
  const [currentPadronActionVoterId, setCurrentPadronActionVoterId] = useState<string | null>(null);
  const [isRefreshingConfirmedPadron, setIsRefreshingConfirmedPadron] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    data: event,
    isLoading: loadingEvent,
    isError: eventLoadFailed,
    refetch: refetchEvent,
  } = useGetVotingEventQuery(actualElectionId, {
    skip: !actualElectionId,
  });
  const {
    data: roles = [],
    isLoading: loadingRoles,
    isError: rolesLoadFailed,
  } = useGetEventRolesQuery(actualElectionId, {
    skip: !actualElectionId,
  });
  const {
    data: options = [],
    isLoading: loadingOptions,
    isError: optionsLoadFailed,
  } = useGetEventOptionsQuery(actualElectionId, {
    skip: !actualElectionId,
  });
  const {
    data: workflowSummary,
    isLoading: loadingWorkflowSummary,
    isError: workflowSummaryLoadFailed,
    refetch: refetchWorkflowSummary,
  } = useGetPadronWorkflowSummaryQuery(actualElectionId, {
    skip: !actualElectionId,
  });
  const {
    data: reviewReadiness,
    isLoading: loadingReviewReadiness,
    isFetching: fetchingReviewReadiness,
    refetch: refetchReviewReadiness,
  } = useGetEventReviewReadinessQuery(actualElectionId, {
    skip: !actualElectionId,
  });
  const limitedPadronModeAllowed = canEditPadronInLimitedMode(
    {
      ...event,
      canEditPadronInLimitedMode:
        workflowSummary?.canEditPadronInLimitedMode ?? event?.canEditPadronInLimitedMode,
    },
    nowMs,
  );
  const workflowCurrentVersion = workflowSummary?.currentVersion ?? null;
  const workflowActiveDraft = workflowSummary?.activeDraft ?? null;
  const effectiveWorkflowActiveDraft = shouldPreferCurrentVersion(
    workflowCurrentVersion,
    workflowActiveDraft,
  )
    ? null
    : limitedPadronModeAllowed
      ? null
      : workflowActiveDraft;
  const {
    data: stagingData,
    isFetching: fetchingStaging,
    isError: stagingLoadFailed,
    isUninitialized: stagingUninitialized,
    refetch: refetchStaging,
  } = useGetPadronStagingQuery(
    { eventId: actualElectionId, page, limit: PAGE_SIZE },
    {
      skip: !actualElectionId || !effectiveWorkflowActiveDraft,
    },
  );
  const {
    data: currentVotersData,
    isFetching: fetchingCurrentVoters,
    isError: currentVotersLoadFailed,
    isUninitialized: currentVotersUninitialized,
    refetch: refetchCurrentVoters,
  } = useGetPadronVotersQuery(
    { eventId: actualElectionId, page, limit: PAGE_SIZE },
    {
      skip: !actualElectionId || Boolean(effectiveWorkflowActiveDraft) || !workflowCurrentVersion,
    },
  );

  const [fetchImportStatus] = useLazyGetPadronImportStatusQuery();
  const [addPadronStagingEntry, { isLoading: addingEntry }] = useAddPadronStagingEntryMutation();
  const [updatePadronStagingEntry, { isLoading: updatingEntry }] = useUpdatePadronStagingEntryMutation();
  const [deletePadronStagingEntry, { isLoading: deletingEntry }] = useDeletePadronStagingEntryMutation();
  const [confirmPadronStaging, { isLoading: confirmingStaging }] = useConfirmPadronStagingMutation();
  const [importPadron, { isLoading: importingStructuredPadron }] = useImportPadronMutation();
  const [addCurrentPadronVoter, { isLoading: addingCurrentPadronVoter }] = useAddCurrentPadronVoterMutation();
  const [enableCurrentPadronVoter] = useEnableCurrentPadronVoterMutation();
  const [downloadPadronCsv] = useLazyDownloadPadronCsvQuery();

  const baseLoading = loadingEvent || loadingWorkflowSummary || loadingRoles || loadingOptions;
  const hasPositions = roles.length > 0;
  const hasPartiesWithCandidates = options.some((option) => option.candidates.length > 0);
  const activeDraft = effectiveWorkflowActiveDraft;
  const currentVersion = workflowCurrentVersion;
  const hasCurrentPadron = Boolean(currentVersion) && !activeDraft;
  const searchNeedle = normalizeSearch(searchTerm);
  const fullPadronEditingEnabled = canEditElectionBeforeCutoff(event, nowMs);
  const postCutoffReadOnly = isAfterPublishCutoffBeforeVoting(event, nowMs);
  const closedPadronReadOnly = hasVotingEnded(event, nowMs) || areResultsAvailable(event, nowMs);
  const officiallyPublished = isOfficiallyPublished(event);

  const stagingFile: PadronFile | null = activeDraft
    ? {
        fileName: getPadronFileDisplayName(activeDraft.originalFile.fileName, activeDraft.sourceType),
        uploadedAt:
          activeDraft.processedAt ??
          activeDraft.updatedAt ??
          activeDraft.createdAt ??
          new Date().toISOString(),
        totalRecords: activeDraft.summary.stagingCount,
        validCount: activeDraft.summary.enabledCount,
        invalidCount: activeDraft.summary.invalidCount + activeDraft.summary.duplicateCount,
        sourceType: activeDraft.sourceType,
      }
    : null;

  const currentFile: PadronFile | null = currentVersion
    ? {
        fileName: getPadronFileDisplayName(null, currentVersion.sourceType, { confirmed: true }),
        uploadedAt: currentVersion.createdAt ?? new Date().toISOString(),
        totalRecords: 0,
        validCount: 0,
        invalidCount: 0,
        sourceType: currentVersion.sourceType,
      }
    : null;

  useEffect(() => {
    setClientDraft(loadGeminiPadronDraft(actualElectionId));
    setHydratedDraftEventId(actualElectionId);
  }, [actualElectionId]);

  useEffect(() => {
    if (!actualElectionId || hydratedDraftEventId !== actualElectionId) {
      return;
    }

    if (clientDraft) {
      saveGeminiPadronDraft(actualElectionId, clientDraft);
      return;
    }

    clearGeminiPadronDraft(actualElectionId);
  }, [actualElectionId, clientDraft, hydratedDraftEventId]);

  const clientDraftSummary = clientDraft ? getGeminiDraftSummary(clientDraft) : null;
  const clientFilteredRecords = useMemo(() => {
    if (!clientDraft) {
      return [];
    }

    return clientDraft.records.filter((record) => {
      if (!searchNeedle) return true;
      return record.carnet.toLowerCase().includes(searchNeedle);
    });
  }, [clientDraft, searchNeedle]);

  const clientDraftTotalPages = clientDraft
    ? Math.max(1, Math.ceil(clientFilteredRecords.length / PAGE_SIZE))
    : 1;
  const safeClientDraftPage = clientDraft
    ? Math.min(page, clientDraftTotalPages)
    : page;

  const clientDraftVoters: Voter[] = useMemo(() => {
    if (!clientDraft) {
      return [];
    }

    return clientFilteredRecords
      .slice((safeClientDraftPage - 1) * PAGE_SIZE, safeClientDraftPage * PAGE_SIZE)
      .map((record, index) => ({
        id: record.id,
        rowNumber: (safeClientDraftPage - 1) * PAGE_SIZE + index + 1,
        carnet: record.carnet,
        fullName: "",
        enabled: record.enabled,
        status: "valid" as const,
        sourceKind: record.sourceKind,
        sourceRow: record.sourceRow ?? null,
        updatedAt: record.updatedAt ?? null,
      }));
  }, [clientDraft, clientFilteredRecords, safeClientDraftPage]);

  const clientDraftFile: PadronFile | null = clientDraftSummary
    ? {
        fileName: getPadronFileDisplayName(clientDraft?.fileName, clientDraft?.sourceType),
        uploadedAt: clientDraft?.uploadedAt ?? new Date().toISOString(),
        totalRecords: clientDraftSummary.totalCount,
        validCount: clientDraftSummary.enabledCount,
        invalidCount: clientDraftSummary.observedCount,
        sourceType: clientDraft?.sourceType,
      }
    : null;

  const stagingVoters: Voter[] = useMemo(
    () =>
      (stagingData?.data ?? [])
        .map((entry, index) => ({
          id: entry.id,
          rowNumber: (page - 1) * PAGE_SIZE + index + 1,
          carnet: entry.ci,
          fullName: "",
          enabled: entry.enabled,
          status: "valid" as const,
          sourceKind: entry.sourceKind,
          sourceRow: entry.sourceRow ?? null,
          updatedAt: entry.updatedAt ?? null,
        }))
        .filter((voter) => {
          if (!searchNeedle) return true;
          return voter.carnet.toLowerCase().includes(searchNeedle);
        }),
    [page, searchNeedle, stagingData?.data],
  );

  const currentVoters: Voter[] = useMemo(
    () =>
      (currentVotersData?.voters ?? [])
        .map((voter, index) => ({
          id: voter.id,
          rowNumber: (page - 1) * PAGE_SIZE + index + 1,
          carnet: voter.carnetNorm,
          fullName: voter.fullName ?? "",
          enabled: voter.enabled !== false,
          status: "valid" as const,
        }))
        .filter((voter) => {
          if (!searchNeedle) return true;
          return (
            voter.carnet.toLowerCase().includes(searchNeedle) ||
            voter.fullName.toLowerCase().includes(searchNeedle)
          );
        }),
    [currentVotersData?.voters, page, searchNeedle],
  );

  const currentPadronStats = useMemo(() => {
    const versionValidCount = Number(currentVersion?.totals.validCount ?? 0);
    const versionInvalidCount = Number(currentVersion?.totals.invalidCount ?? 0);
    const versionTotalCount = versionValidCount + versionInvalidCount;

    if (versionTotalCount > 0) {
      return {
        totalCount: versionTotalCount,
        validCount: versionValidCount,
        invalidCount: versionInvalidCount,
      };
    }

    const visibleRows = currentVotersData?.voters ?? [];
    const fallbackTotalCount = Number(currentVotersData?.total ?? visibleRows.length);

    return {
      totalCount: fallbackTotalCount,
      validCount: fallbackTotalCount,
      invalidCount: 0,
    };
  }, [currentVersion?.totals.invalidCount, currentVersion?.totals.validCount, currentVotersData?.total, currentVotersData?.voters]);

  const resolvedCurrentFile: PadronFile | null = currentFile
    ? {
        ...currentFile,
        totalRecords: currentPadronStats.totalCount,
        validCount: currentPadronStats.validCount,
        invalidCount: currentPadronStats.invalidCount,
      }
    : null;

  const uploadSummaryJob =
    uploadSummaryJobId && effectiveWorkflowActiveDraft?.importJobId === uploadSummaryJobId
      ? effectiveWorkflowActiveDraft
      : null;

  const isPadronConfirmed = Boolean(currentVersion?.padronVersionId) && !activeDraft;
  const clientDraftReadyForNextStep = clientDraftSummary
    ? clientDraftSummary.totalCount > 0 && clientDraftSummary.observedCount === 0
    : false;
  const stagingDraftReadyForNextStep = activeDraft
    ? activeDraft.summary.stagingCount > 0 &&
      activeDraft.summary.invalidCount + activeDraft.summary.duplicateCount === 0
    : false;
  const reviewPending = new Set(reviewReadiness?.pending ?? []);
  const hasPadronReviewPending =
    reviewPending.has("padron") ||
    reviewPending.has("padron_invalid") ||
    reviewPending.has("padron_validation");
  const padronReadyForNextStep =
    isPadronConfirmed &&
    currentPadronStats.totalCount > 0 &&
    currentPadronStats.invalidCount === 0 &&
    !hasPadronReviewPending;
  const showFinalizeConfigurationCta =
    !limitedPadronModeAllowed &&
    !closedPadronReadOnly;
  const isPadronStateHydrating =
    isRefreshingConfirmedPadron ||
    loadingReviewReadiness ||
    fetchingReviewReadiness ||
    (isPadronConfirmed &&
      Number(workflowCurrentVersion?.totals.validCount ?? 0) +
        Number(workflowCurrentVersion?.totals.invalidCount ?? 0) ===
        0 &&
      (currentVotersUninitialized || fetchingCurrentVoters));
  const canFinalizePadron =
    !postCutoffReadOnly &&
    !isPadronStateHydrating &&
    (padronReadyForNextStep || clientDraftReadyForNextStep || stagingDraftReadyForNextStep);
  const showPadronPendingNotice =
    showFinalizeConfigurationCta &&
    isPadronConfirmed &&
    !padronReadyForNextStep &&
    !isPadronStateHydrating &&
    !postCutoffReadOnly;
  const structuralErrors =
    eventLoadFailed ||
    rolesLoadFailed ||
    optionsLoadFailed ||
    workflowSummaryLoadFailed ||
    stagingLoadFailed ||
    currentVotersLoadFailed;

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (clientDraft && page !== safeClientDraftPage) {
      setPage(safeClientDraftPage);
    }
  }, [clientDraft, page, safeClientDraftPage]);

  useEffect(() => {
    if (!isRefreshingConfirmedPadron) {
      return;
    }

    const confirmedVersionHydrated =
      Boolean(workflowCurrentVersion) &&
      (Number(workflowCurrentVersion?.totals.validCount ?? 0) +
        Number(workflowCurrentVersion?.totals.invalidCount ?? 0) >
        0 ||
        (!currentVotersUninitialized && !fetchingCurrentVoters)) &&
      !loadingReviewReadiness &&
      !fetchingReviewReadiness;

    if (effectiveWorkflowActiveDraft || confirmedVersionHydrated) {
      setIsRefreshingConfirmedPadron(false);
    }
  }, [
    currentVotersUninitialized,
    effectiveWorkflowActiveDraft,
    fetchingCurrentVoters,
    fetchingReviewReadiness,
    isRefreshingConfirmedPadron,
    loadingReviewReadiness,
    workflowCurrentVersion,
  ]);

  const pollImportJobUntilReady = useCallback(
    async (importJobId: string) => {
      startedPollingImportRef.current = importJobId;
      setSummaryModalState("uploading");

      for (let attempt = 0; attempt < 45; attempt += 1) {
        const job = await fetchImportStatus({
          eventId: actualElectionId,
          importJobId,
        }).unwrap();

        if (job.status !== "PROCESSING") {
          setUploadProgress(100);
          startedPollingImportRef.current = null;
          setUploadSummaryJobId(job.importJobId);
          await refetchWorkflowSummary();
          setSummaryModalState("summary");
          return job;
        }

        setUploadProgress((current) => Math.min(Math.max(current, 65) + 4, 94));
        await wait(1200);
      }

      startedPollingImportRef.current = null;
      throw new Error("El procesamiento sigue en curso. Reintenta en unos segundos.");
    },
    [actualElectionId, fetchImportStatus, refetchStaging, refetchWorkflowSummary],
  );

  useEffect(() => {
    if (
      activeDraft?.status === "PROCESSING" &&
      activeDraft.importJobId &&
      startedPollingImportRef.current !== activeDraft.importJobId
    ) {
      setUploadProgress((current) => Math.max(current, 48));
      void pollImportJobUntilReady(activeDraft.importJobId).catch((pollError: any) => {
        setSummaryModalState("none");
        setError(getRequestErrorMessage(pollError, "No se pudo completar el procesamiento del padrón."));
      });
    }
  }, [activeDraft?.importJobId, activeDraft?.status, pollImportJobUntilReady]);

  const refetchVisiblePadronData = useCallback(async () => {
    await refetchWorkflowSummary();
    await refetchReviewReadiness();

    if (!stagingUninitialized) {
      await refetchStaging();
    }

    if (!currentVotersUninitialized) {
      await refetchCurrentVoters();
    }
  }, [
    currentVotersUninitialized,
    refetchCurrentVoters,
    refetchReviewReadiness,
    refetchStaging,
    refetchWorkflowSummary,
    stagingUninitialized,
  ]);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile || !isSupportedPadronFile(selectedFile)) {
        setError("Solo se admiten archivos PDF, JPG, JPEG, PNG o WEBP para el padrón.");
        return;
      }

      setError(null);
      setInfo(null);
      setSuccess(null);
      setUploadSummaryJobId(null);
      setSummarySnapshot(null);

      const startManualFallback = (message: string) => {
        setSummaryModalState("none");
        setUploadProgress(0);
        setObservationsOpen(false);
        setClientDraft(createManualPadronDraft(selectedFile.name));
        setInfo(message);
      };

      if (!hasGeminiPadronConfig()) {
        startManualFallback(
          "El análisis automático no está disponible en este navegador. Puedes continuar con la carga manual del padrón.",
        );
        return;
      }

      setSummaryModalState("uploading");
      setUploadProgress(12);

      const progressInterval = window.setInterval(() => {
        setUploadProgress((current) => Math.min(current + 5, 82));
      }, 320);

      try {
        const analysisResult = await Promise.race([
          analyzePadronDocumentWithGemini(selectedFile).then((draft) => ({
            kind: "resolved" as const,
            draft,
          })),
          wait(PADRON_AI_TIMEOUT_MS).then(() => ({ kind: "timeout" as const })),
        ]);

        window.clearInterval(progressInterval);
        if (analysisResult.kind === "timeout") {
          startManualFallback(
            "No se pudieron reconocer campos a tiempo. Puedes continuar con la carga manual del padrón.",
          );
          return;
        }

        const draft = analysisResult.draft;
        if (!draft.records.length) {
          startManualFallback(
            "No se detectaron registros confiables en el archivo. Puedes completar el padrón manualmente.",
          );
          return;
        }

        setClientDraft(draft);
        setUploadProgress(100);
        setSummarySnapshot(getGeminiDraftSummary(draft));
        setSummaryModalState("summary");
      } catch (uploadError: any) {
        window.clearInterval(progressInterval);
        startManualFallback(
          uploadError?.message === "GEMINI_API_KEY_MISSING"
            ? "El análisis automático no está disponible en este navegador. Puedes continuar con la carga manual del padrón."
            : "No se pudo obtener un resultado confiable del archivo. Puedes continuar con carga manual.",
        );
      }
    },
    [],
  );

  const handleReplaceFile = () => {
    replaceFileInputRef.current?.click();
  };

  const handleReplaceFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      await handleFileSelect(selectedFile);
    }
    event.target.value = "";
  };

  const handleEditConfirmedPadron = useCallback(async () => {
    if (!currentVersion) return;

    try {
      setError(null);
      setSuccess(null);
      const result = await downloadPadronCsv({
        eventId: actualElectionId,
        padronVersionId: currentVersion.padronVersionId,
      }).unwrap();

      const nextDraft = createDraftFromPadronCsv(
        result.content,
        currentFile?.fileName ||
          getPadronFileDisplayName(result.fileName, currentVersion.sourceType) ||
          `${formatPadronSourceLabel(currentVersion.sourceType)} editable`,
      );

      if (!nextDraft.records.length) {
        throw new Error("No se pudo reconstruir el padrón confirmado para seguir editándolo.");
      }

      setClientDraft(nextDraft);
      setInfo(
        "Estás editando el padrón confirmado. Cuando termines, usa Finalizar configuración para guardar los cambios.",
      );
    } catch (editError: any) {
      setError(getRequestErrorMessage(editError, "No se pudo reabrir el padrón para edición."));
    }
  }, [actualElectionId, currentFile?.fileName, currentVersion, downloadPadronCsv]);

  useEffect(() => {
    const currentVersionId = currentVersion?.padronVersionId ?? null;

    if (
      !currentVersionId ||
      !fullPadronEditingEnabled ||
      limitedPadronModeAllowed ||
      closedPadronReadOnly ||
      postCutoffReadOnly ||
      clientDraft ||
      activeDraft
    ) {
      return;
    }

    if (autoOpenedConfirmedPadronRef.current === currentVersionId) {
      return;
    }

    autoOpenedConfirmedPadronRef.current = currentVersionId;
    void handleEditConfirmedPadron();
  }, [
    activeDraft,
    clientDraft,
    closedPadronReadOnly,
    currentVersion?.padronVersionId,
    fullPadronEditingEnabled,
    handleEditConfirmedPadron,
    limitedPadronModeAllowed,
    postCutoffReadOnly,
  ]);

  const handleDeleteClientDraft = () => {
    setClientDraft(null);
    setPage(1);
    setSearchTerm("");
    setUploadSummaryJobId(null);
    setSummaryModalState("none");
    setSummarySnapshot(null);
    setObservationsOpen(false);
    setInfo(null);
    setSuccess(null);
    setError(null);
  };

  const handleSaveRecord = async (payload: { ci: string; enabled: boolean }) => {
    try {
      if (limitedPadronModeAllowed) {
        setCurrentPadronActionVoterId("__create__");
        await addCurrentPadronVoter({
          eventId: actualElectionId,
          carnet: payload.ci,
          enabled: true,
        }).unwrap();
        setRecordModal({ open: false });
        setSuccess("Votante habilitado agregado al padrón vigente.");
        await refetchCurrentVoters();
        setCurrentPadronActionVoterId(null);
        return;
      }

      if (clientDraft) {
        const normalizedCi = normalizePadronCarnet(payload.ci);
        const normalizedKey = normalizedCi.replace(/[\s.-]/g, "");
        const editingRecordId =
          recordModal.open && recordModal.mode === "edit" ? recordModal.voter.id : null;
        const duplicate = clientDraft.records.some(
          (record) =>
            record.id !== editingRecordId &&
            normalizePadronCarnet(record.carnet).replace(/[\s.-]/g, "") === normalizedKey,
        );

        if (duplicate) {
          throw new Error("Ya existe un empadronado con ese CI en el padrón.");
        }

        const nextDraft =
          recordModal.open && recordModal.mode === "edit" && recordModal.voter
            ? updateGeminiDraftRecord(clientDraft, recordModal.voter.id, {
                ci: normalizedCi,
                enabled: payload.enabled,
              })
            : addGeminiDraftRecord(clientDraft, {
                ci: normalizedCi,
                enabled: payload.enabled,
              });

        setClientDraft(nextDraft);
        setRecordModal({ open: false });
        setSuccess(
          recordModal.open && recordModal.mode === "edit"
            ? "Registro actualizado en el padrón."
            : "Registro agregado al padrón.",
        );
        return;
      }

      if (recordModal.open && recordModal.mode === "edit" && recordModal.voter) {
        await updatePadronStagingEntry({
          eventId: actualElectionId,
          entryId: recordModal.voter.id,
          ci: payload.ci,
          enabled: payload.enabled,
        }).unwrap();
      } else {
        await addPadronStagingEntry({
          eventId: actualElectionId,
          ci: payload.ci,
          enabled: payload.enabled,
        }).unwrap();
      }

      setRecordModal({ open: false });
      setSuccess(
        recordModal.open && recordModal.mode === "edit"
          ? "Registro actualizado en el padrón."
          : "Registro agregado al padrón.",
      );
      await refetchVisiblePadronData();
    } catch (recordError: any) {
      setCurrentPadronActionVoterId(null);
      throw new Error(getRequestErrorMessage(recordError, "No se pudo guardar el registro del padrón."));
    }
  };

  const handleToggleEnabled = async (voter: Voter, nextEnabled: boolean) => {
    try {
      setError(null);

      if (limitedPadronModeAllowed) {
        if (voter.enabled || !nextEnabled) {
          return;
        }

        setCurrentPadronActionVoterId(voter.id);
        await enableCurrentPadronVoter({
          eventId: actualElectionId,
          voterId: voter.id,
        }).unwrap();
        setSuccess("Votante habilitado en el padrón vigente.");
        await refetchCurrentVoters();
        setCurrentPadronActionVoterId(null);
        return;
      }

      if (clientDraft) {
        setClientDraft(toggleGeminiDraftRecord(clientDraft, voter.id, nextEnabled));
        return;
      }

      await updatePadronStagingEntry({
        eventId: actualElectionId,
        entryId: voter.id,
        enabled: nextEnabled,
      }).unwrap();
      await refetchVisiblePadronData();
    } catch (toggleError: any) {
      setCurrentPadronActionVoterId(null);
      setError(getRequestErrorMessage(toggleError, "No se pudo actualizar la habilitación del registro."));
    }
  };

  const handleDeleteRecord = async () => {
    if (!deleteCandidate) return;

    try {
      if (clientDraft) {
        setClientDraft(deleteGeminiDraftRecord(clientDraft, deleteCandidate.id));
        setDeleteCandidate(null);
        setSuccess("Registro eliminado del padrón.");
        return;
      }

      await deletePadronStagingEntry({
        eventId: actualElectionId,
        entryId: deleteCandidate.id,
      }).unwrap();
      setDeleteCandidate(null);
      setSuccess("Registro eliminado del padrón.");
      await refetchVisiblePadronData();
    } catch (deleteError: any) {
      setError(getRequestErrorMessage(deleteError, "No se pudo eliminar el registro del padrón."));
    }
  };

  const handleConfirmPadron = async () => {
    try {
      if (clientDraft) {
        if (!clientDraft.records.length) {
          throw new Error("No se puede confirmar un padrón vacío.");
        }

        const csvContent = buildPadronCsvFromDraft(clientDraft);
        const csvFile = new File(
          ["\uFEFF", csvContent],
          `${clientDraft.fileName.replace(/\.(pdf|jpg|jpeg|png|webp)$/i, "") || "padron-estructurado"}.csv`,
          { type: "text/csv;charset=utf-8;" },
        );

        await importPadron({
          eventId: actualElectionId,
          file: csvFile,
        }).unwrap();

        setPage(1);
        clearGeminiPadronDraft(actualElectionId);
        setClientDraft(null);
        setSummarySnapshot(null);
        setInfo(null);
        setSuccess("Padrón confirmado correctamente.");
        setSummaryModalState("none");
        setObservationsOpen(false);
        setIsRefreshingConfirmedPadron(true);
        await refetchWorkflowSummary();
        await refetchVisiblePadronData();
        return true;
      }

      await confirmPadronStaging({ eventId: actualElectionId }).unwrap();
      setPage(1);
      setSuccess("Padrón confirmado correctamente.");
      setSummaryModalState("none");
      setObservationsOpen(false);
      setIsRefreshingConfirmedPadron(true);
      await refetchWorkflowSummary();
      await refetchVisiblePadronData();
      return true;
    } catch (confirmError: any) {
      setIsRefreshingConfirmedPadron(false);
      setError(
        confirmError?.message ||
          getRequestErrorMessage(confirmError, "No se pudo confirmar la versión final del padrón."),
      );
      return false;
    }
  };

  const handleContinueAfterSummary = () => {
    setSummaryModalState("none");
  };

  const handleStartManualPadron = () => {
    setError(null);
    setInfo(null);
    setSuccess(null);
    setSummaryModalState("none");
    setSummarySnapshot(null);
    setClientDraft(createManualPadronDraft());
    setRecordModal({ open: true, mode: "create" });
  };

  const handleFinish = async () => {
    setError(null);

    if (clientDraft || activeDraft) {
      const confirmed = await handleConfirmPadron();
      if (!confirmed) {
        return;
      }
    }

    if (!padronReadyForNextStep && !clientDraftReadyForNextStep && !stagingDraftReadyForNextStep) {
      return;
    }

    navigate(`/votacion/elecciones/${actualElectionId}/config/review`);
  };

  const handleGoToStep = (step: ConfigStep) => {
    if (step === 1) {
      navigate(`/votacion/elecciones/${actualElectionId}/config/cargos`);
      return;
    }

    if (step === 2) {
      navigate(`/votacion/elecciones/${actualElectionId}/config/planchas`);
    }
  };

  if (!actualElectionId) {
    return (
      <ConfigPageFallback
        title="ID de votación no válido"
        message="No se pudo resolver la votación seleccionada. Vuelve al listado y entra nuevamente."
        actionLabel="Volver a elecciones"
        onAction={() => navigate("/votacion/elecciones")}
      />
    );
  }

  if (structuralErrors) {
    return (
      <ConfigPageFallback
        title="No se pudo cargar el padrón"
        message="Alguno de los datos necesarios para este paso falló al cargar. Reintenta antes de continuar."
        actionLabel="Reintentar"
        onAction={() => {
          void refetchEvent();
          void refetchWorkflowSummary();
        }}
      />
    );
  }

  if (!baseLoading && !event) {
    return (
      <ConfigPageFallback
        title="Votación no encontrada"
        message="La votación no existe o la respuesta llegó incompleta. Vuelve al listado y selecciónala de nuevo."
        actionLabel="Volver a elecciones"
        onAction={() => navigate("/votacion/elecciones")}
      />
    );
  }

  if (event && hasDraftAlreadyStarted(event, nowMs)) {
    return (
      <ConfigPageFallback
        title="La votación ya venció antes de completarse"
        message="Como la hora de inicio ya pasó y el evento sigue en borrador, ya no debe seguir configurándose. Elimínalo desde la lista de votaciones."
        actionLabel="Volver a elecciones"
        onAction={() => navigate("/votacion/elecciones")}
      />
    );
  }

  if (event?.status === "PUBLICATION_EXPIRED" || event?.state === "PUBLICATION_EXPIRED") {
    return (
      <ConfigPageFallback
        title="La publicación oficial venció"
        message="El límite de publicación oficial ya pasó sin confirmación. El padrón queda bloqueado y esta votación no debe seguir editándose."
        actionLabel="Volver al estado"
        onAction={() => navigate(`/votacion/elecciones/${actualElectionId}/status`)}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-8 text-center text-4xl font-extrabold text-gray-900">
            {event?.name || "Cargando..."}
          </h1>


          <div className="mb-4">
            <ConfigStepsTabs
              currentStep={3}
              completedSteps={[
                ...(hasPositions ? [1] : []),
                ...(hasPartiesWithCandidates ? [2] : []),
                ...(isPadronConfirmed ? [3] : []),
              ] as ConfigStep[]}
              onStepChange={handleGoToStep}
              canNavigate={(step) => step === 1 || step === 2 || step === 3}
            />
          </div>

          <p className="mb-6 text-gray-600">
            Paso 3 de 3: Gestiona el padrón de la elección según la etapa actual.
          </p>
          {limitedPadronModeAllowed ? (
            <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {officiallyPublished && !isDuringVotingWindow(event, nowMs)
                ? "La publicación oficial ya fue confirmada. Desde aquí solo se permite agregar habilitados nuevos y habilitar votantes deshabilitados del padrón vigente."
                : "La votación está activa. En esta etapa solo se permite agregar nuevos habilitados y habilitar votantes ya existentes que estén deshabilitados."}
            </div>
          ) : null}

          {postCutoffReadOnly ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Ya faltan menos de 24 horas para el inicio. El padrón queda en solo lectura hasta que comience la votación.
            </div>
          ) : null}

          {closedPadronReadOnly ? (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              La votación ya no admite cambios de padrón desde esta vista.
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {info ? (
            <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {info}
            </div>
          ) : null}

          {success ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <span>{success}</span>
            </div>
          ) : null}

          {showPadronPendingNotice ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              El padrón ya está cargado, pero todavía no quedó listo para pasar a revisión. Revisa los registros pendientes y luego usa Finalizar configuración.
            </div>
          ) : null}

          {baseLoading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 rounded-full border-4 border-[#459151] border-t-transparent animate-spin" />
              <p className="mt-4 text-gray-500">Cargando configuración del padrón...</p>
            </div>
          ) : isPadronStateHydrating ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 rounded-full border-4 border-[#459151] border-t-transparent animate-spin" />
              <p className="mt-4 text-gray-700">Actualizando la versión confirmada del padrón...</p>
              <p className="mt-2 text-sm text-gray-500">
                En cuanto termine la actualización verás el padrón vigente o la versión en edición sin volver a la pantalla inicial.
              </p>
            </div>
          ) : limitedPadronModeAllowed && resolvedCurrentFile ? (
            <LoadedPadronView
              file={resolvedCurrentFile}
              voters={currentVoters}
              totalVoters={currentVotersData?.total ?? 0}
              validCount={currentPadronStats.validCount}
              invalidCount={currentPadronStats.invalidCount}
              page={page}
              totalPages={currentVotersData?.totalPages ?? 1}
              pageSize={PAGE_SIZE}
              searchValue={searchTerm}
              onPageChange={setPage}
              onSearchChange={setSearchTerm}
              onAddRecord={() => setRecordModal({ open: true, mode: "create" })}
              onEnableVoter={(voter) => void handleToggleEnabled(voter, true)}
              enablingVoterId={currentPadronActionVoterId}
              addRecordLabel="Agregar habilitado"
              loading={fetchingCurrentVoters}
              readOnly
            />
          ) : limitedPadronModeAllowed ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Padrón vigente no disponible</h2>
              <p className="mt-2 text-sm text-slate-500">
                Todavía no hay un padrón vigente disponible para esta etapa. Revisa el estado de la elección antes de continuar.
              </p>
            </div>
          ) : fullPadronEditingEnabled && clientDraft && clientDraftFile && clientDraftSummary ? (
            <PadronStagingView
              file={clientDraftFile}
              voters={clientDraftVoters}
              totalVoters={clientFilteredRecords.length}
              enabledCount={clientDraftSummary.enabledCount}
              disabledCount={clientDraftSummary.disabledCount}
              observedCount={clientDraftSummary.observedCount}
              page={safeClientDraftPage}
              totalPages={clientDraftTotalPages}
              pageSize={PAGE_SIZE}
              searchValue={searchTerm}
              loading={false}
              confirming={importingStructuredPadron}
              parsedLabel="Gemini"
              onPageChange={setPage}
              onSearchChange={setSearchTerm}
              onInspectObservations={() => setObservationsOpen(true)}
              onAddRecord={() => setRecordModal({ open: true, mode: "create" })}
              onEditRecord={(voter) => setRecordModal({ open: true, mode: "edit", voter })}
              onDeleteRecord={(voter) => setDeleteCandidate(voter)}
              onToggleEnabled={(voter, nextEnabled) => void handleToggleEnabled(voter, nextEnabled)}
              onReplaceFile={handleReplaceFile}
              onDeleteFile={handleDeleteClientDraft}
            />
          ) : fullPadronEditingEnabled && activeDraft && stagingFile ? (
            <PadronStagingView
              file={stagingFile}
              voters={stagingVoters}
              totalVoters={stagingData?.total ?? activeDraft.summary.stagingCount}
              enabledCount={activeDraft.summary.enabledCount}
              disabledCount={activeDraft.summary.disabledCount}
              observedCount={activeDraft.summary.invalidCount + activeDraft.summary.duplicateCount}
              page={page}
              totalPages={stagingData?.totalPages ?? 1}
              pageSize={PAGE_SIZE}
              searchValue={searchTerm}
              loading={fetchingStaging}
              confirming={confirmingStaging}
              onPageChange={setPage}
              onSearchChange={setSearchTerm}
              onInspectObservations={() => setObservationsOpen(true)}
              onAddRecord={() => setRecordModal({ open: true, mode: "create" })}
              onEditRecord={(voter) => setRecordModal({ open: true, mode: "edit", voter })}
              onDeleteRecord={(voter) => setDeleteCandidate(voter)}
              onToggleEnabled={(voter, nextEnabled) => void handleToggleEnabled(voter, nextEnabled)}
              onReplaceFile={handleReplaceFile}
            />
          ) : hasCurrentPadron && resolvedCurrentFile ? (
            <LoadedPadronView
              file={resolvedCurrentFile}
              voters={currentVoters}
              totalVoters={currentVotersData?.total ?? 0}
              validCount={currentPadronStats.validCount}
              invalidCount={currentPadronStats.invalidCount}
              page={page}
              totalPages={currentVotersData?.totalPages ?? 1}
              pageSize={PAGE_SIZE}
              searchValue={searchTerm}
              onPageChange={setPage}
              onSearchChange={setSearchTerm}
              onReplaceFile={handleReplaceFile}
              loading={fetchingCurrentVoters}
              readOnly={!fullPadronEditingEnabled}
            />
          ) : fullPadronEditingEnabled ? (
            <PadronDropzone
              onFileSelect={(file) => void handleFileSelect(file)}
              disabled={summaryModalState === "uploading"}
              onManualStart={handleStartManualPadron}
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">No hay un padrón editable disponible</h2>
              <p className="mt-2 text-sm text-slate-500">
                En esta etapa el padrón queda en solo lectura y no se puede reemplazar desde esta vista.
              </p>
            </div>
          )}

          {showFinalizeConfigurationCta ? (
            <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleFinish()}
                  disabled={!canFinalizePadron}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition ${
                    canFinalizePadron
                      ? "bg-[#459151] text-white hover:bg-[#3a7a44]"
                      : "cursor-not-allowed bg-slate-200 text-slate-500"
                  }`}
                >
                  <span>{FINAL_STEP_LABEL}</span>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
            </div>
          ) : null}
        </div>
      </div>

      <input
        ref={replaceFileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
        onChange={handleReplaceFileSelect}
        className="hidden"
      />

      <UploadProgressModal
        isOpen={summaryModalState === "uploading"}
        progress={uploadProgress}
        title="Revisando archivo del padrón..."
        subtitle="Estamos intentando reconocer los registros."
      />

      <UploadSummaryModal
        isOpen={summaryModalState === "summary" && Boolean(uploadSummaryJob || summarySnapshot)}
        onClose={() => setSummaryModalState("none")}
        totalCount={summarySnapshot?.totalCount ?? uploadSummaryJob?.summary.stagingCount ?? 0}
        enabledCount={summarySnapshot?.enabledCount ?? uploadSummaryJob?.summary.enabledCount ?? 0}
        disabledCount={summarySnapshot?.disabledCount ?? uploadSummaryJob?.summary.disabledCount ?? 0}
        observedCount={
          summarySnapshot?.observedCount ??
          ((uploadSummaryJob?.summary.invalidCount ?? 0) +
            (uploadSummaryJob?.summary.duplicateCount ?? 0))
        }
        onContinue={handleContinueAfterSummary}
        onFix={
          (summarySnapshot && summarySnapshot.observedCount > 0) ||
          (uploadSummaryJob &&
            uploadSummaryJob.summary.invalidCount + uploadSummaryJob.summary.duplicateCount > 0)
            ? () => {
                setSummaryModalState("none");
                setObservationsOpen(true);
              }
            : undefined
        }
        continueLabel="Ir al padrón"
      />

      <PadronObservationsModal
        isOpen={observationsOpen}
        errors={clientDraft?.observations ?? effectiveWorkflowActiveDraft?.errors ?? []}
        onClose={() => setObservationsOpen(false)}
        onAddRecord={
          clientDraft || effectiveWorkflowActiveDraft
            ? () => {
                setObservationsOpen(false);
                setRecordModal({ open: true, mode: "create" });
              }
            : undefined
        }
      />

      <PadronRecordModal
        isOpen={recordModal.open}
        mode={recordModal.open ? recordModal.mode : "create"}
        initialCi={recordModal.open && recordModal.mode === "edit" ? recordModal.voter.carnet : ""}
        initialEnabled={recordModal.open && recordModal.mode === "edit" ? recordModal.voter.enabled : true}
        enabledLocked={limitedPadronModeAllowed && recordModal.open && recordModal.mode === "create"}
        enabledHelperText={
          limitedPadronModeAllowed && recordModal.open && recordModal.mode === "create"
            ? "En el modo limitado solo se permite agregar nuevos votantes ya habilitados."
            : undefined
        }
        isLoading={addingEntry || updatingEntry || addingCurrentPadronVoter}
        onClose={() => setRecordModal({ open: false })}
        onSubmit={handleSaveRecord}
      />

      <Modal2
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        title="Eliminar registro"
        size="sm"
        type="plain"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4 text-sm text-red-800">
            ¿Seguro que quieres eliminar el registro{" "}
            <span className="font-semibold">{deleteCandidate?.carnet}</span> del padrón?
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteCandidate(null)}
              disabled={deletingEntry}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteRecord()}
              disabled={deletingEntry}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {deletingEntry ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              <span>{deletingEntry ? "Eliminando..." : "Eliminar"}</span>
            </button>
          </div>
        </div>
      </Modal2>
    </div>
  );
};

export default ElectionConfigPadron;
