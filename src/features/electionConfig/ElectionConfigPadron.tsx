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
import { getRequestErrorMessage } from "./requestErrorMessage";
import { hasDraftAlreadyStarted, useClientNow } from "./renderUtils";
import type { ConfigStep, PadronFile, Voter } from "./types";
import {
  useAddPadronStagingEntryMutation,
  useConfirmPadronStagingMutation,
  useDeletePadronStagingEntryMutation,
  useGetEventOptionsQuery,
  useGetEventRolesQuery,
  useGetPadronStagingQuery,
  useGetPadronVotersQuery,
  useGetPadronWorkflowSummaryQuery,
  useGetVotingEventQuery,
  useLazyDownloadPadronCsvQuery,
  useLazyGetPadronImportStatusQuery,
  useUpdatePadronStagingEntryMutation,
  useUploadPadronSourceMutation,
} from "../../store/votingEvents";

type SummaryModalState = "none" | "uploading" | "summary";

type RecordModalState =
  | { open: false }
  | { open: true; mode: "create"; voter?: undefined }
  | { open: true; mode: "edit"; voter: Voter };

const PAGE_SIZE = 50;
const SUPPORTED_PADRON_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const isSupportedPadronFile = (file: File) => {
  const fileName = file.name.toLowerCase();
  return SUPPORTED_PADRON_EXTENSIONS.some((extension) => fileName.endsWith(extension));
};

const normalizeSearch = (value: string) => value.trim().toLowerCase();

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
  const [error, setError] = useState<string | null>(null);
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
    data: stagingData,
    isFetching: fetchingStaging,
    isError: stagingLoadFailed,
    refetch: refetchStaging,
  } = useGetPadronStagingQuery(
    { eventId: actualElectionId, page, limit: PAGE_SIZE },
    {
      skip: !actualElectionId || !workflowSummary?.activeDraft,
    },
  );
  const {
    data: currentVotersData,
    isFetching: fetchingCurrentVoters,
    isError: currentVotersLoadFailed,
    refetch: refetchCurrentVoters,
  } = useGetPadronVotersQuery(
    { eventId: actualElectionId, page, limit: PAGE_SIZE },
    {
      skip: !actualElectionId || Boolean(workflowSummary?.activeDraft) || !workflowSummary?.currentVersion,
    },
  );

  const [uploadPadronSource, { isLoading: uploadingSource }] = useUploadPadronSourceMutation();
  const [fetchImportStatus] = useLazyGetPadronImportStatusQuery();
  const [addPadronStagingEntry, { isLoading: addingEntry }] = useAddPadronStagingEntryMutation();
  const [updatePadronStagingEntry, { isLoading: updatingEntry }] = useUpdatePadronStagingEntryMutation();
  const [deletePadronStagingEntry, { isLoading: deletingEntry }] = useDeletePadronStagingEntryMutation();
  const [confirmPadronStaging, { isLoading: confirmingStaging }] = useConfirmPadronStagingMutation();
  const [downloadPadronCsv, { isFetching: downloadingCsv }] = useLazyDownloadPadronCsvQuery();

  const baseLoading = loadingEvent || loadingWorkflowSummary || loadingRoles || loadingOptions;
  const hasPositions = roles.length > 0;
  const hasPartiesWithCandidates = options.some((option) => option.candidates.length > 0);
  const activeDraft = workflowSummary?.activeDraft ?? stagingData?.importJob ?? null;
  const currentVersion = workflowSummary?.currentVersion ?? null;
  const hasCurrentPadron = Boolean(currentVersion) && !activeDraft;
  const searchNeedle = normalizeSearch(searchTerm);

  const stagingFile: PadronFile | null = activeDraft
    ? {
        fileName: activeDraft.originalFile.fileName,
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
        fileName: `Padrón vigente ${currentVersion.padronVersionId.slice(-6)}`,
        uploadedAt: currentVersion.createdAt ?? new Date().toISOString(),
        totalRecords: Number(currentVersion.totals.validCount ?? 0),
        validCount: Number(currentVersion.totals.validCount ?? 0),
        invalidCount: Number(currentVersion.totals.invalidCount ?? 0),
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

  const uploadSummaryJob =
    uploadSummaryJobId && activeDraft?.importJobId === uploadSummaryJobId
      ? activeDraft
      : activeDraft;

  const isPadronReady = Boolean(currentVersion?.padronVersionId);
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

    if (workflowSummary?.activeDraft) {
      await refetchStaging();
    }

    if (workflowSummary?.currentVersion && !workflowSummary?.activeDraft) {
      await refetchCurrentVoters();
    }
  }, [
    refetchCurrentVoters,
    refetchStaging,
    refetchWorkflowSummary,
    workflowSummary?.activeDraft,
    workflowSummary?.currentVersion,
  ]);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile || !isSupportedPadronFile(selectedFile)) {
        setError("Solo se admiten archivos PDF, JPG, JPEG, PNG o WEBP para el padrón.");
        return;
      }

      setError(null);
      setSuccess(null);
      setUploadSummaryJobId(null);
      setSummaryModalState("uploading");
      setUploadProgress(18);

      const progressInterval = window.setInterval(() => {
        setUploadProgress((current) => Math.min(current + 7, 72));
      }, 280);

      try {
        const job = await uploadPadronSource({
          eventId: actualElectionId,
          file: selectedFile,
        }).unwrap();

        window.clearInterval(progressInterval);
        setUploadProgress(86);

        if (job.status === "PROCESSING") {
          await pollImportJobUntilReady(job.importJobId);
          return;
        }

        await refetchWorkflowSummary();
        setUploadProgress(100);
        setUploadSummaryJobId(job.importJobId);
        setSummaryModalState("summary");
      } catch (uploadError: any) {
        window.clearInterval(progressInterval);
        setSummaryModalState("none");
        setError(getRequestErrorMessage(uploadError, "No se pudo subir el padrón."));
      }
    },
    [
      actualElectionId,
      pollImportJobUntilReady,
      refetchStaging,
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

  const handleDownloadCurrentCsv = async () => {
    if (!currentVersion) return;

    try {
      const result = await downloadPadronCsv({
        eventId: actualElectionId,
        padronVersionId: currentVersion.padronVersionId,
      }).unwrap();

      const blob = new Blob([result.content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (downloadError: any) {
      setError(getRequestErrorMessage(downloadError, "No se pudo descargar el padrón."));
    }
  };

  const handleExportStagingCsv = () => {
    if (!stagingVoters.length) return;

    const csvContent = [
      "carnet,habilitado",
      ...stagingVoters.map((voter) => `${voter.carnet},${voter.enabled ? "si" : "no"}`),
    ].join("\n");

    const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `staging-padron-${activeDraft?.importJobId ?? actualElectionId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveRecord = async (payload: { ci: string; enabled: boolean }) => {
    try {
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
          ? "Registro actualizado en el staging."
          : "Registro agregado al staging.",
      );
      await refetchVisiblePadronData();
    } catch (recordError: any) {
      throw new Error(getRequestErrorMessage(recordError, "No se pudo guardar el registro del padrón."));
    }
  };

  const handleToggleEnabled = async (voter: Voter, nextEnabled: boolean) => {
    try {
      setError(null);
      await updatePadronStagingEntry({
        eventId: actualElectionId,
        entryId: voter.id,
        enabled: nextEnabled,
      }).unwrap();
      await refetchVisiblePadronData();
    } catch (toggleError: any) {
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
      setSuccess("Registro eliminado del staging.");
      await refetchVisiblePadronData();
    } catch (deleteError: any) {
      setError(getRequestErrorMessage(deleteError, "No se pudo eliminar el registro del padrón."));
    }
  };

  const handleConfirmPadron = async () => {
    try {
      await confirmPadronStaging({ eventId: actualElectionId }).unwrap();
      setSuccess("Padrón confirmado correctamente. Ya puedes continuar a revisión.");
      setSummaryModalState("none");
      setObservationsOpen(false);
      await refetchWorkflowSummary();
    } catch (confirmError: any) {
      setError(getRequestErrorMessage(confirmError, "No se pudo confirmar la versión final del padrón."));
    }
  };

  const handleContinueAfterSummary = () => {
    setSummaryModalState("none");
  };

  const handleFinish = () => {
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

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-8 text-center text-4xl font-extrabold text-gray-900">
            {event?.name || "Cargando..."}
          </h1>

          {error ? (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{error}</p>
              <button type="button" onClick={() => setError(null)} className="font-semibold text-red-500">
                ×
              </button>
            </div>
          ) : null}

          {success ? (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <p>{success}</p>
              <button type="button" onClick={() => setSuccess(null)} className="font-semibold text-green-600">
                ×
              </button>
            </div>
          ) : null}

          <div className="mb-4">
            <ConfigStepsTabs
              currentStep={3}
              completedSteps={[
                ...(hasPositions ? [1] : []),
                ...(hasPartiesWithCandidates ? [2] : []),
                ...(isPadronReady ? [3] : []),
              ] as ConfigStep[]}
              onStepChange={handleGoToStep}
              canNavigate={(step) => step === 1 || step === 2 || step === 3}
            />
          </div>

          <p className="mb-6 text-gray-600">
            Paso 3 de 3: Sube un PDF o imagen del padrón, revisa el staging editable y confirma la versión final.
          </p>

          {baseLoading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 rounded-full border-4 border-[#459151] border-t-transparent animate-spin" />
              <p className="mt-4 text-gray-500">Cargando configuración del padrón...</p>
            </div>
          ) : activeDraft && stagingFile ? (
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
              onExport={handleExportStagingCsv}
              onConfirm={() => void handleConfirmPadron()}
            />
          ) : hasCurrentPadron && currentFile ? (
            <LoadedPadronView
              file={currentFile}
              voters={currentVoters}
              totalVoters={currentVotersData?.total ?? 0}
              validCount={Number(currentVersion?.totals.validCount ?? 0)}
              invalidCount={Number(currentVersion?.totals.invalidCount ?? 0)}
              page={page}
              totalPages={currentVotersData?.totalPages ?? 1}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              onSearchChange={setSearchTerm}
              onReplaceFile={handleReplaceFile}
              onDownloadCsv={() => void handleDownloadCurrentCsv()}
              onFinish={handleFinish}
              loading={fetchingCurrentVoters}
              downloading={downloadingCsv}
            />
          ) : (
            <PadronDropzone onFileSelect={(file) => void handleFileSelect(file)} disabled={uploadingSource} />
          )}
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
        title="Procesando padrón..."
        subtitle="El backend está leyendo el PDF o la imagen y preparando el staging editable."
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
        continueLabel="Ir al staging"
      />

      <PadronObservationsModal
        isOpen={observationsOpen}
        errors={activeDraft?.errors ?? []}
        onClose={() => setObservationsOpen(false)}
        onAddRecord={
          activeDraft
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
        isLoading={addingEntry || updatingEntry}
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
            <span className="font-semibold">{deleteCandidate?.carnet}</span> del staging?
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
