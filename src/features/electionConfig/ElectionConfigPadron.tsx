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
  analyzePadronDocumentWithGemini,
  getGeminiDraftSummary,
  hasGeminiPadronConfig,
  isBlockingGeminiObservation,
  normalizePadronCarnet,
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
  useDeletePadronStagingEntryMutation,
  useEnableCurrentPadronVoterMutation,
  useGetEventOptionsQuery,
  useGetEventReviewReadinessQuery,
  useGetEventRolesQuery,
  useGetPadronStagingQuery,
  useGetPadronVotersQuery,
  useGetPadronWorkflowSummaryQuery,
  useGetVotingEventQuery,
  useLazyGetPadronImportStatusQuery,
  type PadronImportError,
  useUploadPadronSourceMutation,
  useUpdatePadronStagingEntryMutation,
} from "../../store/votingEvents";

type SummaryModalState = "none" | "uploading" | "summary";

type RecordModalState =
  | { open: false }
  | { open: true; mode: "create"; voter?: undefined }
  | { open: true; mode: "edit"; voter: Voter };

const PAGE_SIZE = 50;
const GEMINI_STAGING_BATCH_SIZE = 25;
const SUPPORTED_PADRON_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
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
  if (sourceType === "SYSTEM") {
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

const ElectionConfigPadron: React.FC = () => {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();
  const actualElectionId = electionId || "";
  const nowMs = useClientNow();
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const startedPollingImportRef = useRef<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [summaryModalState, setSummaryModalState] = useState<SummaryModalState>("none");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSummaryJobId, setUploadSummaryJobId] = useState<string | null>(null);
  const [observationsOpen, setObservationsOpen] = useState(false);
  const [recordModal, setRecordModal] = useState<RecordModalState>({ open: false });
  const [deleteCandidate, setDeleteCandidate] = useState<Voter | null>(null);
  const [currentPadronActionVoterId, setCurrentPadronActionVoterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [frontendGeminiObservations, setFrontendGeminiObservations] = useState<
    PadronImportError[]
  >([]);

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
  const effectiveWorkflowActiveDraft = limitedPadronModeAllowed ? null : workflowActiveDraft;
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
  const [uploadPadronSource, { isLoading: uploadingPadronSource }] = useUploadPadronSourceMutation();
  const [addPadronStagingEntry, { isLoading: addingEntry }] = useAddPadronStagingEntryMutation();
  const [updatePadronStagingEntry, { isLoading: updatingEntry }] = useUpdatePadronStagingEntryMutation();
  const [deletePadronStagingEntry, { isLoading: deletingEntry }] = useDeletePadronStagingEntryMutation();
  const [addCurrentPadronVoter, { isLoading: addingCurrentPadronVoter }] = useAddCurrentPadronVoterMutation();
  const [enableCurrentPadronVoter] = useEnableCurrentPadronVoterMutation();

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

  const stagingVoters: Voter[] = useMemo(
    () =>
      (stagingData?.data ?? [])
        .map((entry, index) => ({
          id: entry.id,
          rowNumber: (page - 1) * PAGE_SIZE + index + 1,
          carnet: entry.ci,
          fullName: "",
          enabled: entry.enabled,
          hasIdentity: entry.hasIdentity,
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

  const missingIdentityCount = Number(activeDraft?.summary.missingIdentityCount ?? 0);
  const areAllRegistered = missingIdentityCount === 0;

  const currentVoters: Voter[] = useMemo(
    () =>
      (currentVotersData?.voters ?? [])
        .map((voter, index) => ({
          id: voter.id,
          rowNumber: (page - 1) * PAGE_SIZE + index + 1,
          carnet: voter.carnetNorm,
          fullName: voter.fullName ?? "",
          enabled: voter.enabled !== false,
          hasIdentity: false,
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

  const activeDraftObservedCount = activeDraft
    ? activeDraft.summary.invalidCount + activeDraft.summary.duplicateCount
    : 0;
  const displayedObservations =
    frontendGeminiObservations.length > 0
      ? frontendGeminiObservations
      : effectiveWorkflowActiveDraft?.errors ?? [];
  const isPadronConfirmed = Boolean(currentVersion?.padronVersionId) && !activeDraft;
  const stagingDraftReadyForNextStep = activeDraft
    ? activeDraft.summary.stagingCount > 0 &&
      activeDraftObservedCount === 0 &&
      missingIdentityCount === 0
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
    (padronReadyForNextStep || stagingDraftReadyForNextStep);
  const padronStepCompleted = padronReadyForNextStep || stagingDraftReadyForNextStep;
  const showPadronPendingNotice =
    showFinalizeConfigurationCta &&
    ((activeDraft && !stagingDraftReadyForNextStep) || (isPadronConfirmed && !padronReadyForNextStep)) &&
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
          await refetchReviewReadiness();
          setSummaryModalState("summary");
          return job;
        }

        setUploadProgress((current) => Math.min(Math.max(current, 65) + 4, 94));
        await wait(1200);
      }

      startedPollingImportRef.current = null;
      throw new Error("El procesamiento sigue en curso. Reintenta en unos segundos.");
    },
    [actualElectionId, fetchImportStatus, refetchReviewReadiness, refetchWorkflowSummary],
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

  const persistGeminiRecordsIntoStaging = useCallback(
    async (
      records: Array<{
        carnet: string;
        enabled: boolean;
      }>,
    ) => {
      const pendingRecords = records.reduce<Array<{ ci: string; enabled: boolean }>>((acc, record) => {
        const ci = normalizePadronCarnet(record.carnet);
        if (!ci || acc.some((entry) => entry.ci === ci)) {
          return acc;
        }

        acc.push({
          ci,
          enabled: record.enabled !== false,
        });
        return acc;
      }, []);

      for (let index = 0; index < pendingRecords.length; index += GEMINI_STAGING_BATCH_SIZE) {
        const batch = pendingRecords.slice(index, index + GEMINI_STAGING_BATCH_SIZE);
        await Promise.all(
          batch.map((record) =>
            addPadronStagingEntry({
              eventId: actualElectionId,
              ci: record.ci,
              enabled: record.enabled,
            }).unwrap(),
          ),
        );
      }

      return pendingRecords.length;
    },
    [actualElectionId, addPadronStagingEntry],
  );

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile || !isSupportedPadronFile(selectedFile)) {
        setError("Solo se admiten archivos PDF, JPG, JPEG, PNG o WEBP para el padrón.");
        return;
      }

      if (!hasGeminiPadronConfig()) {
        setError(
          "No se pudo iniciar el análisis del padrón porque Gemini no está configurado en el frontend.",
        );
        return;
      }

      setError(null);
      setInfo(null);
      setSuccess(null);
      setUploadSummaryJobId(null);
      setObservationsOpen(false);
      setFrontendGeminiObservations([]);

      setSummaryModalState("uploading");
      setUploadProgress(8);

      let progressInterval: number | null = null;

      try {
        const geminiDraft = await analyzePadronDocumentWithGemini(selectedFile);
        const geminiSummary = getGeminiDraftSummary(geminiDraft);
        const blockingObservations = geminiDraft.observations.filter(isBlockingGeminiObservation);

        if (blockingObservations.length > 0 || geminiSummary.totalCount === 0) {
          setFrontendGeminiObservations(geminiDraft.observations);
          setSummaryModalState("none");
          setUploadProgress(0);
          setObservationsOpen(true);
          setError(
            geminiSummary.totalCount === 0
              ? "Gemini no pudo extraer registros utilizables del documento. Revisa las observaciones antes de intentar nuevamente."
              : "Gemini detectó observaciones que requieren revisión antes de continuar con la carga del padrón.",
          );
          return;
        }

        if (geminiDraft.observations.length > 0) {
          setInfo(
            "Gemini detectó observaciones informativas, pero no bloquean el avance. Continuaremos con la carga al staging editable.",
          );
        }

        setUploadProgress(24);
        progressInterval = window.setInterval(() => {
          setUploadProgress((current) => Math.min(current + 5, 82));
        }, 320);

        const importJob = await uploadPadronSource({
          eventId: actualElectionId,
          file: selectedFile,
        }).unwrap();
        if (progressInterval !== null) {
          window.clearInterval(progressInterval);
        }
        setUploadSummaryJobId(importJob.importJobId);
        setFrontendGeminiObservations([]);

        let resolvedImportJob = importJob;

        if (importJob.status === "PROCESSING") {
          setUploadProgress(52);
          resolvedImportJob = await pollImportJobUntilReady(importJob.importJobId);
        } else {
          setUploadProgress(100);
          await refetchWorkflowSummary();
          await refetchReviewReadiness();
          setSummaryModalState("summary");
        }

        const needsGeminiStagingFallback =
          geminiSummary.totalCount > 0 &&
          Number(resolvedImportJob.summary?.stagingCount ?? 0) === 0;

        if (needsGeminiStagingFallback) {
          setSummaryModalState("uploading");
          setUploadProgress(92);

          const seededCount = await persistGeminiRecordsIntoStaging(geminiDraft.records);

          await refetchVisiblePadronData();

          setUploadProgress(100);
          setSummaryModalState("summary");
          setInfo(
            seededCount > 0
              ? "Gemini detectó registros válidos y los cargó al staging editable cuando el procesamiento del backend no generó filas."
              : "El documento fue analizado, pero no se pudieron persistir registros editables en el staging.",
          );
        }
      } catch (uploadError: any) {
        if (progressInterval !== null) {
          window.clearInterval(progressInterval);
        }
        setSummaryModalState("none");
        setUploadProgress(0);
        setError(
          uploadError?.message === "GEMINI_API_KEY_MISSING"
            ? "No se pudo iniciar el análisis del padrón."
            : getRequestErrorMessage(
                uploadError,
                "No se pudo analizar y cargar el archivo del padrón.",
              ),
        );
      }
    },
    [
      actualElectionId,
      persistGeminiRecordsIntoStaging,
      pollImportJobUntilReady,
      refetchReviewReadiness,
      refetchVisiblePadronData,
      refetchWorkflowSummary,
      uploadPadronSource,
    ],
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

      if (recordModal.open && recordModal.mode === "edit" && recordModal.voter) {
        await updatePadronStagingEntry({
          eventId: actualElectionId,
          entryId: recordModal.voter.id,
          ci: normalizePadronCarnet(payload.ci),
          enabled: payload.enabled,
        }).unwrap();
      } else {
        await addPadronStagingEntry({
          eventId: actualElectionId,
          ci: normalizePadronCarnet(payload.ci),
          enabled: payload.enabled,
        }).unwrap();
      }

      setRecordModal({ open: false });
      setSuccess(
        recordModal.open && recordModal.mode === "edit"
          ? "Registro actualizado y guardado automáticamente."
          : "Registro agregado y guardado automáticamente.",
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

      await updatePadronStagingEntry({
        eventId: actualElectionId,
        entryId: voter.id,
        enabled: nextEnabled,
      }).unwrap();
      setSuccess("Registro actualizado y guardado automáticamente.");
      await refetchVisiblePadronData();
    } catch (toggleError: any) {
      setCurrentPadronActionVoterId(null);
      setError(getRequestErrorMessage(toggleError, "No se pudo actualizar la habilitación del registro."));
    }
  };

  const handleDeleteRecord = async () => {
    if (!deleteCandidate) return;

    try {
      await deletePadronStagingEntry({
        eventId: actualElectionId,
        entryId: deleteCandidate.id,
      }).unwrap();
      setDeleteCandidate(null);
      setSuccess("Registro eliminado y guardado automáticamente.");
      await refetchVisiblePadronData();
    } catch (deleteError: any) {
      setError(getRequestErrorMessage(deleteError, "No se pudo eliminar el registro del padrón."));
    }
  };

  const handleContinueAfterSummary = () => {
    setSummaryModalState("none");
  };

  const handleFinish = async () => {
    setError(null);

    await refetchVisiblePadronData();

    if (!padronReadyForNextStep && !stagingDraftReadyForNextStep) {
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
                ...(padronStepCompleted ? [3] : []),
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
              Ya faltan menos de 6 horas para el inicio. El padrón queda en solo lectura hasta que comience la votación.
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
              El padrón actualizado
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
              <p className="mt-4 text-gray-700">Actualizando el estado del padrón...</p>
              <p className="mt-2 text-sm text-gray-500">
                En cuanto termine la actualización verás el padrón vigente o el staging editable sin volver a la pantalla inicial.
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
          ) : fullPadronEditingEnabled && activeDraft && stagingFile ? (
            <PadronStagingView
              file={stagingFile}
              voters={stagingVoters}
              observationsLabel={
                areAllRegistered
                  ? undefined
                  : missingIdentityCount === 1
                    ? "Hay 1 registro del padrón sin identidad verificada en la aplicación electoral. Corrígelo antes de continuar a revisión."
                    : `Hay ${missingIdentityCount} registros del padrón sin identidad verificada en la aplicación electoral. Corrígelos antes de continuar a revisión.`
              }
              totalVoters={stagingData?.total ?? activeDraft.summary.stagingCount}
              enabledCount={activeDraft.summary.enabledCount}
              disabledCount={activeDraft.summary.disabledCount}
              observedCount={activeDraftObservedCount}
              page={page}
              totalPages={stagingData?.totalPages ?? 1}
              pageSize={PAGE_SIZE}
              searchValue={searchTerm}
              loading={fetchingStaging}
              confirming={uploadingPadronSource}
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
                  disabled={!canFinalizePadron || !areAllRegistered}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition ${
                    canFinalizePadron && areAllRegistered
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
        title="Analizando archivo del padrón..."
        subtitle="La IA está leyendo el documento."
      />

      <UploadSummaryModal
        isOpen={summaryModalState === "summary" && Boolean(uploadSummaryJob)}
        onClose={() => setSummaryModalState("none")}
        totalCount={uploadSummaryJob?.summary.stagingCount ?? 0}
        enabledCount={uploadSummaryJob?.summary.enabledCount ?? 0}
        disabledCount={uploadSummaryJob?.summary.disabledCount ?? 0}
        observedCount={
          (uploadSummaryJob?.summary.invalidCount ?? 0) +
          (uploadSummaryJob?.summary.duplicateCount ?? 0)
        }
        onContinue={handleContinueAfterSummary}
        onFix={
          uploadSummaryJob &&
          uploadSummaryJob.summary.invalidCount + uploadSummaryJob.summary.duplicateCount > 0
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
        errors={displayedObservations}
        onClose={() => {
          setObservationsOpen(false);
          if (frontendGeminiObservations.length > 0) {
            setFrontendGeminiObservations([]);
          }
        }}
        onAddRecord={
          effectiveWorkflowActiveDraft && frontendGeminiObservations.length === 0
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
