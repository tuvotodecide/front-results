import React, { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
} from "@/domains/votacion/navigation/compat-private";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import ConfigStepsTabs from "./components/ConfigStepsTabs";
import PositionsTable from "./components/PositionsTable";
import PartiesTable from "./components/PartiesTable";
import LoadedPadronView from "./components/LoadedPadronView";
import CreateNewsModal from "./components/CreateNewsModal";
import {
  useCreateEventNewsMutation,
  useEnableCurrentPadronVoterMutation,
  useGetPadronStagingQuery,
  useGetPadronWorkflowSummaryQuery,
  useGetVotingEventQuery,
  useGetVotingEventsQuery,
  useGetEventRolesQuery,
  useGetEventOptionsQuery,
  useGetPadronVotersQuery,
  useGetEventResultsQuery,
  useLazyDownloadPadronPdfQuery,
  useCreatePresentialSessionMutation,
  useUpdateEventScheduleMutation,
} from "../../store/votingEvents";
import type { ConfigStep, PartyWithCandidates, Position, Voter } from "./types";
import type {
  EventRole,
  VotingOption,
  OptionCandidate,
} from "../../store/votingEvents/types";
import { selectTenantId } from "../../store/auth/authSlice";
import { useSelector } from "react-redux";
import Modal2 from "../../components/Modal2";
import { getRequestErrorMessage } from "./requestErrorMessage";
import {
  addMinutesToLocalDateTime,
  areResultsAvailable,
  canEditElectionBeforeCutoff,
  canEditPadronInLimitedMode,
  formatDateTimeForUi,
  getMinimumLocalDateTime,
  getOptionColors,
  hasDraftAlreadyStarted,
  hasVotingEnded,
  isAfterPublishCutoffBeforeVoting,
  isOfficiallyPublished,
  isDuringVotingWindow,
  PRE_PUBLICATION_CUTOFF_HOURS,
  PRE_PUBLICATION_CUTOFF_MS,
  REFERENDUM_OPTION_LABEL,
  stableCreatedAt,
  toLocalDateTimeValue,
  useClientNow,
  validateScheduleFieldErrors,
} from "./renderUtils";
import {
  buildPresentialKioskPath,
  DEFAULT_KIOSK_STATION_ID,
} from "@/domains/votacion/kiosk/constants";

const roleToPosition = (role: EventRole): Position => ({
  id: role.id,
  name: role.name,
  electionId: role.eventId,
  createdAt: stableCreatedAt(role.createdAt),
});

const optionToParty = (
  option: VotingOption,
  isReferendum = false,
): PartyWithCandidates => ({
  id: option.id,
  electionId: option.eventId,
  name: option.name,
  colorHex: option.color,
  colors: getOptionColors(option),
  logoUrl: option.logoUrl,
  createdAt: stableCreatedAt(option.createdAt),
  candidates: (option.candidates ?? []).map((candidate: OptionCandidate) => ({
    id: candidate.id,
    partyId: option.id,
    positionId: candidate.roleName,
    positionName: isReferendum ? REFERENDUM_OPTION_LABEL : candidate.roleName,
    fullName: candidate.name,
    photoUrl: candidate.photoUrl,
  })),
});

const canEditSchedule = (event?: {
  state?: string | null;
  status?: string | null;
  publishDeadline?: string | null;
  votingStart?: string | null;
  votingEnd?: string | null;
  resultsPublishAt?: string | null;
  canEditPadronInLimitedMode?: boolean;
}, nowMs?: number | null) => {
  return canEditElectionBeforeCutoff(event, nowMs);
};

const getInitial = (value?: string | null) =>
  String(value ?? "")
    .trim()
    .charAt(0)
    .toUpperCase() || "?";

const getBallotDescription = (lifecycle: string, isReferendum: boolean) =>
  isReferendum
    ? lifecycle === "RESULTS" ||
      lifecycle === "RESULTS_PUBLISHED" ||
      lifecycle === "CLOSED"
      ? "Conoce las opciones que participaron en este referéndum."
      : "Conoce las opciones disponibles en este referéndum."
    : lifecycle === "RESULTS" ||
        lifecycle === "RESULTS_PUBLISHED" ||
        lifecycle === "CLOSED"
      ? "Conoce a los candidatos y partidos políticos que participaron en esta votación."
      : "Conoce a los candidatos y partidos políticos que participan en esta votación.";

const getPadronDisplayName = (sourceType?: string | null) => {
  if (sourceType === "PDF_IMPORT" || sourceType === "IMAGE_IMPORT") {
    return "Padrón";
  }
  return "Padrón";
};

const deriveLifecycle = (event?: {
  status?: string | null;
  state?: string | null;
  votingStart?: string | null;
  votingEnd?: string | null;
  resultsPublishAt?: string | null;
  publishDeadline?: string | null;
}, nowMs?: number | null) => {
  if (!event) return "DRAFT";
  const state = event.state ?? event.status ?? "DRAFT";
  if (state === "PUBLICATION_EXPIRED") return "PUBLICATION_EXPIRED";
  if (state === "READY_FOR_REVIEW") return "READY_FOR_REVIEW";
  if (nowMs === null || nowMs === undefined) return state;
  if (areResultsAvailable(event, nowMs)) return "RESULTS";
  if (isDuringVotingWindow(event, nowMs)) return "ACTIVE";
  if (hasVotingEnded(event, nowMs)) return "CLOSED";
  if (state === "OFFICIALLY_PUBLISHED") return "OFFICIALLY_PUBLISHED";
  if (state === "PUBLISHED") return "PUBLISHED";
  return state;
};

const StatusBadge: React.FC<{ state?: string }> = ({ state }) => {
  const styles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
    PUBLISHED: "bg-blue-100 text-blue-700 border-blue-200",
    READY_FOR_REVIEW: "bg-cyan-100 text-cyan-700 border-cyan-200",
    OFFICIALLY_PUBLISHED: "bg-blue-100 text-blue-700 border-blue-200",
    PUBLICATION_EXPIRED: "bg-red-100 text-red-700 border-red-200",
    ACTIVE: "bg-amber-100 text-amber-700 border-amber-200",
    CLOSED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    RESULTS: "bg-violet-100 text-violet-700 border-violet-200",
    RESULTS_PUBLISHED: "bg-violet-100 text-violet-700 border-violet-200",
  };

  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicada",
    READY_FOR_REVIEW: "En revisión previa",
    OFFICIALLY_PUBLISHED: "Publicada oficialmente",
    PUBLICATION_EXPIRED: "Caducada",
    ACTIVE: "En votación",
    CLOSED: "Finalizada",
    RESULTS: "Resultados disponibles",
    RESULTS_PUBLISHED: "Resultados publicados",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${
        styles[state || "DRAFT"] || styles.DRAFT
      }`}
    >
      {labels[state || "DRAFT"] || state || "Borrador"}
    </span>
  );
};

const TopInfoCard: React.FC<{
  title: string;
  lines: Array<{ label: string; value: string }>;
  action?: React.ReactNode;
  note?: string;
}> = ({ title, lines, action, note }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
    <div className="mb-3 flex items-start justify-between gap-4">
      <div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {note ? <p className="mt-1 text-xs text-gray-500">{note}</p> : null}
      </div>
      {action}
    </div>
    <div className="space-y-2 text-sm text-gray-600">
      {lines.map((line) => (
        <p key={`${line.label}-${line.value}`}>
          <span className="font-semibold text-gray-800">{line.label}:</span>{" "}
          <span>{line.value}</span>
        </p>
      ))}
    </div>
  </div>
);

const ActiveElectionStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();
  const tenantId = useSelector(selectTenantId);
  const actualElectionId = electionId || "";
  const nowMs = useClientNow();
  const [activeTab, setActiveTab] = useState<ConfigStep>(1);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [kioskMessage, setKioskMessage] = useState<string | null>(null);
  const [kioskError, setKioskError] = useState<string | null>(null);
  const [newsMessage, setNewsMessage] = useState<string | null>(null);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [padronMessage, setPadronMessage] = useState<string | null>(null);
  const [padronError, setPadronError] = useState<string | null>(null);
  const [currentPadronActionVoterId, setCurrentPadronActionVoterId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    votingStart: "",
    votingEnd: "",
    resultsPublishAt: "",
  });
  const minimumVotingStartValue = getMinimumLocalDateTime(
    PRE_PUBLICATION_CUTOFF_MS,
    nowMs ?? Date.now(),
  );

  const { data: event, isLoading: loadingEvent } = useGetVotingEventQuery(
    actualElectionId,
    {
      skip: !actualElectionId,
    },
  );
  const limitedModeByEvent = canEditPadronInLimitedMode(event, nowMs);
  const { data: events = [] } = useGetVotingEventsQuery(
    tenantId ? { tenantId } : undefined,
    {
      skip: !tenantId,
    },
  );
  const { data: roles = [], isLoading: loadingRoles } = useGetEventRolesQuery(
    actualElectionId,
    {
      skip: !actualElectionId,
    },
  );
  const { data: options = [], isLoading: loadingOptions } =
    useGetEventOptionsQuery(actualElectionId, {
      skip: !actualElectionId,
    });
  const {
    data: workflowSummary,
    isLoading: loadingPadronWorkflowSummary,
    refetch: refetchPadronWorkflowSummary,
  } = useGetPadronWorkflowSummaryQuery(actualElectionId, {
      skip: !actualElectionId,
    });
  const shouldUsePublishedPadronSnapshot = Boolean(
    event &&
      (isOfficiallyPublished(event) ||
        isDuringVotingWindow(event, nowMs) ||
        hasVotingEnded(event, nowMs) ||
        areResultsAvailable(event, nowMs)),
  );
  const activeWorkflowDraft =
    limitedModeByEvent || shouldUsePublishedPadronSnapshot
      ? null
      : workflowSummary?.activeDraft ?? null;
  const { data: padronData, isLoading: loadingPadronVoters, refetch: refetchPadronVoters } =
    useGetPadronVotersQuery(
      { eventId: actualElectionId, page, limit: 20 },
      { skip: !actualElectionId || Boolean(activeWorkflowDraft) },
    );
  const {
    data: stagingData,
    isLoading: loadingPadronStaging,
  } = useGetPadronStagingQuery(
    { eventId: actualElectionId, page, limit: 20 },
    {
      skip: !actualElectionId || !activeWorkflowDraft,
    },
    );
  const lifecycle = deriveLifecycle(event, nowMs);
  const isReferendum = Boolean(event?.isReferendum);
  const referendumQuestion = isReferendum
    ? String(event?.objective || event?.name || "").trim()
    : "";
  const shouldShowResults = lifecycle === "RESULTS";
  const { data: resultsData } = useGetEventResultsQuery(actualElectionId, {
    skip: !actualElectionId || !shouldShowResults,
  });
  const [updateEventSchedule, { isLoading: updatingSchedule }] =
    useUpdateEventScheduleMutation();
  const [createPresentialSession, { isLoading: creatingKioskLink }] =
    useCreatePresentialSessionMutation();
  const [downloadPadronPdf] = useLazyDownloadPadronPdfQuery();
  const [createEventNews, { isLoading: creatingNews }] =
    useCreateEventNewsMutation();
  const [enableCurrentPadronVoter] = useEnableCurrentPadronVoterMutation();
  const [downloadingPadronPdf, setDownloadingPadronPdf] = useState(false);

  const positions = useMemo(() => roles.map(roleToPosition), [roles]);
  const parties = useMemo(
    () => options.map((option) => optionToParty(option, isReferendum)),
    [isReferendum, options],
  );
  const currentPadron = workflowSummary?.currentVersion ?? null;
  const voters: Voter[] = useMemo(() => {
    if (activeWorkflowDraft) {
      return (stagingData?.data ?? []).map((entry, index) => ({
        id: entry.id,
        rowNumber: index + 1 + (page - 1) * 20,
        carnet: entry.ci,
        fullName: entry.hasIdentity ? "Con identidad verificada" : "Sin identidad verificada",
        enabled: entry.enabled,
        hasIdentity: entry.hasIdentity,
        status: "valid",
      }));
    }

    return (padronData?.voters ?? []).map((voter, index) => ({
      id: voter.id,
      rowNumber: index + 1 + (page - 1) * 20,
      carnet: voter.carnetNorm,
      fullName: voter.fullName ?? "-",
      enabled: voter.enabled,
      hasIdentity: true,
      status: "valid",
    }));
  }, [activeWorkflowDraft, padronData?.voters, page, stagingData?.data]);

  const filteredVoters = useMemo(
    () =>
      searchTerm.trim()
        ? voters.filter(
            (voter) =>
              voter.carnet.toLowerCase().includes(searchTerm.toLowerCase()) ||
              voter.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
          )
        : voters,
    [searchTerm, voters],
  );

  const otherElections = useMemo(
    () => events.filter((item) => item.id !== actualElectionId),
    [events, actualElectionId],
  );
  const scheduleEditable = canEditSchedule(event, nowMs);
  const fullElectionEditingEnabled = canEditElectionBeforeCutoff(event, nowMs);
  const officialPublicationLocked = isOfficiallyPublished(event);
  const canCreateNews =
    lifecycle === "OFFICIALLY_PUBLISHED" ||
    lifecycle === "ACTIVE" ||
    lifecycle === "CLOSED" ||
    lifecycle === "RESULTS" ||
    lifecycle === "RESULTS_PUBLISHED";
  const votingPadronLimitedMode = limitedModeByEvent;
  const allowPostPublicationPadronEnable =
    event?.allowPostPublicationPadronEnable !== false;
  const canEnableExistingLimitedPadronVoters =
    votingPadronLimitedMode && allowPostPublicationPadronEnable;
  const postCutoffReadOnly = isAfterPublishCutoffBeforeVoting(event, nowMs);
  const presentialKioskEnabled = Boolean(event?.presentialKioskEnabled);
  const scheduleFieldErrors = useMemo(
    () =>
      validateScheduleFieldErrors(scheduleForm, {
        nowMs: nowMs ?? Date.now(),
        minimumStartLeadMs: PRE_PUBLICATION_CUTOFF_MS,
        minimumStartMessage: `La fecha de inicio debe quedar al menos ${PRE_PUBLICATION_CUTOFF_HOURS} horas por delante para conservar la ventana de modificación y publicación oficial.`,
      }),
    [nowMs, scheduleForm],
  );
  const hasScheduleFieldErrors = Object.keys(scheduleFieldErrors).length > 0;
  const currentPublishDeadlineLabel = formatDateTimeForUi(event?.publishDeadline);
  const displayPadronFile = activeWorkflowDraft
    ? {
        fileName:
          "Borrador de padrón",
        uploadedAt:
          activeWorkflowDraft.processedAt ??
          activeWorkflowDraft.updatedAt ??
          activeWorkflowDraft.createdAt ??
          new Date().toISOString(),
        totalRecords: Number(activeWorkflowDraft.summary.stagingCount ?? 0),
        validCount: Number(activeWorkflowDraft.summary.enabledCount ?? 0),
        invalidCount:
          Number(activeWorkflowDraft.summary.invalidCount ?? 0) +
          Number(activeWorkflowDraft.summary.duplicateCount ?? 0),
      }
    : currentPadron
      ? {
          fileName: getPadronDisplayName(currentPadron.sourceType),
          uploadedAt: currentPadron.createdAt ?? new Date().toISOString(),
          totalRecords:
            Number(currentPadron.totals.validCount ?? 0) +
            Number(currentPadron.totals.invalidCount ?? 0),
          validCount: Number(currentPadron.totals.validCount ?? 0),
          invalidCount: Number(currentPadron.totals.invalidCount ?? 0),
        }
      : null;
  const displayPadronTotal = activeWorkflowDraft
    ? Number(stagingData?.total ?? activeWorkflowDraft.summary.stagingCount ?? 0)
    : Number(padronData?.total ?? 0);
  const displayPadronTotalPages = activeWorkflowDraft
    ? Number(stagingData?.totalPages ?? 1)
    : Number(padronData?.totalPages ?? 1);
  const displayPadronValidCount = activeWorkflowDraft
    ? Number(activeWorkflowDraft.summary.enabledCount ?? 0)
    : Number(currentPadron?.totals.validCount ?? 0);
  const displayPadronInvalidCount = activeWorkflowDraft
    ? Number(activeWorkflowDraft.summary.invalidCount ?? 0) +
      Number(activeWorkflowDraft.summary.duplicateCount ?? 0)
    : Number(currentPadron?.totals.invalidCount ?? 0);

  useEffect(() => {
    if (isReferendum && activeTab === 1) {
      setActiveTab(2);
    }
  }, [activeTab, isReferendum]);

  useEffect(() => {
    setScheduleForm({
      votingStart: event?.votingStart ? toLocalDateTimeValue(new Date(event.votingStart)) : "",
      votingEnd: event?.votingEnd ? toLocalDateTimeValue(new Date(event.votingEnd)) : "",
      resultsPublishAt: event?.resultsPublishAt
        ? toLocalDateTimeValue(new Date(event.resultsPublishAt))
        : "",
    });
  }, [event?.resultsPublishAt, event?.votingEnd, event?.votingStart]);

  const loading =
    loadingEvent ||
    loadingRoles ||
    loadingOptions ||
    loadingPadronWorkflowSummary ||
    loadingPadronVoters ||
    loadingPadronStaging;

  const handleEnableLimitedPadronVoter = async (voter: Voter) => {
    if (!actualElectionId || voter.enabled) return;
    if (!canEnableExistingLimitedPadronVoters) {
      setPadronError(
        "La habilitación manual desde la tabla está desactivada para esta votación.",
      );
      return;
    }

    try {
      setPadronError(null);
      setCurrentPadronActionVoterId(voter.id);
      await enableCurrentPadronVoter({
        eventId: actualElectionId,
        voterId: voter.id,
      }).unwrap();
      setPadronMessage("Votante habilitado en el padrón vigente.");
      await Promise.all([refetchPadronVoters(), refetchPadronWorkflowSummary()]);
    } catch (error: any) {
      setPadronError(
        getRequestErrorMessage(error, "No se pudo habilitar el votante en el padrón vigente."),
      );
    } finally {
      setCurrentPadronActionVoterId(null);
    }
  };

  const handleDownloadPadronPdf = async () => {
    if (!actualElectionId || !currentPadron) return;

    try {
      setPadronError(null);
      setDownloadingPadronPdf(true);
      const result = await downloadPadronPdf({
        eventId: actualElectionId,
        padronVersionId: currentPadron.padronVersionId,
      }).unwrap();
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setPadronError(
        getRequestErrorMessage(error, "No se pudo descargar el padrón en PDF."),
      );
    } finally {
      setDownloadingPadronPdf(false);
    }
  };

  const handleOpenKiosk = () => {
    if (!actualElectionId) return;
    if (!presentialKioskEnabled) {
      setKioskError("El voto presencial con QR no está activado para esta elección.");
      return;
    }

    const path = buildPresentialKioskPath(actualElectionId, {
      stationId: DEFAULT_KIOSK_STATION_ID,
      eventName: event?.name ?? "Punto presencial",
    });

    window.open(path, "_blank", "noopener,noreferrer");
  };

  const handleCopyKioskLink = async () => {
    if (!actualElectionId) return;
    if (!presentialKioskEnabled) {
      setKioskError("El voto presencial con QR no está activado para esta elección.");
      return;
    }

    setKioskError(null);
    setKioskMessage(null);

    try {
      const created = await createPresentialSession({
        eventId: actualElectionId,
        data: {
          stationId: DEFAULT_KIOSK_STATION_ID,
          regenerateKioskAccessToken: true,
        },
      }).unwrap();

      if (!created.kioskAccessToken) {
        setKioskError(
          "No se pudo generar un enlace nuevo para el punto presencial.",
        );
        return;
      }

      const path = buildPresentialKioskPath(actualElectionId, {
        stationId: created.stationId,
        kioskToken: created.kioskAccessToken,
        eventName: event?.name ?? "Punto presencial",
      });
      const absoluteUrl = `${window.location.origin}${path}`;

      await navigator.clipboard.writeText(absoluteUrl);
      setKioskMessage("Enlace del punto presencial copiado.");
    } catch (error: any) {
      setKioskError(
        getRequestErrorMessage(
          error,
          "No se pudo generar el enlace del punto presencial.",
        ),
      );
    }
  };

  const handleScheduleInputChange = (
    key: "votingStart" | "votingEnd" | "resultsPublishAt",
    value: string,
  ) => {
    setScheduleForm((current) => ({ ...current, [key]: value }));
    setScheduleError(null);
    setScheduleSuccess(null);
  };

  const handleScheduleSave = async () => {
    if (!scheduleEditable || !actualElectionId) return;

    if (hasScheduleFieldErrors) {
      setScheduleError(
        scheduleFieldErrors.votingStart ??
          scheduleFieldErrors.votingEnd ??
          scheduleFieldErrors.resultsPublishAt ??
          "Corrige las fechas antes de guardar el cronograma.",
      );
      return;
    }

    try {
      const votingStart = new Date(scheduleForm.votingStart).toISOString();
      const votingEnd = new Date(scheduleForm.votingEnd).toISOString();
      const resultsPublishAt = new Date(
        scheduleForm.resultsPublishAt,
      ).toISOString();

      await updateEventSchedule({
        eventId: actualElectionId,
        data: {
          votingStart,
          votingEnd,
          resultsPublishAt,
        },
      }).unwrap();

      setScheduleSuccess("Horario actualizado correctamente.");
      setScheduleError(null);
      setIsScheduleModalOpen(false);
    } catch (error: any) {
      setScheduleError(
        getRequestErrorMessage(error, "No se pudo actualizar el horario."),
      );
    }
  };

  const handleCreateNews = async (payload: {
    title: string;
    body: string;
    link?: string;
    imageUrl?: string;
  }) => {
    if (!actualElectionId) return;

    try {
      const result = await createEventNews({
        eventId: actualElectionId,
        data: payload,
      }).unwrap();
      setNewsError(null);
      setNewsMessage(
        result.imageUrl
          ? "Noticia publicada correctamente con imagen."
          : "Noticia publicada correctamente para los votantes del padrón actual.",
      );
      setIsNewsModalOpen(false);
    } catch (error: any) {
      const message = getRequestErrorMessage(error, "No se pudo publicar la noticia.");
      setNewsMessage(null);
      setNewsError(message);
      throw new Error(message);
    }
  };

  const renderButtonText = () => {
    return updatingSchedule ? "Guardando..." : "Guardar horarios";
  };

  const isUpdateButtonDisabled = () => {
    return updatingSchedule || hasScheduleFieldErrors;
  };

  const navigateToElection = (targetEvent: {
    id: string;
    status?: string | null;
    state?: string | null;
    votingStart?: string | null;
  }) => {
    const targetStatus = targetEvent.status ?? targetEvent.state;

    if (hasDraftAlreadyStarted(targetEvent, nowMs) || targetStatus === "PUBLICATION_EXPIRED") {
      return;
    }

    if (targetStatus === "DRAFT") {
      navigate(`/votacion/elecciones/${targetEvent.id}/config/cargos`);
      return;
    }

    if (targetStatus === "READY_FOR_REVIEW" || targetStatus === "PUBLISHED") {
      navigate(`/votacion/elecciones/${targetEvent.id}/config/review`);
      return;
    }

    navigate(`/votacion/elecciones/${targetEvent.id}/status`);
  };

  if (!actualElectionId) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">ID de elección no válido.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#459151] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">
            Cargando información de la votación...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{event?.name}</h1>
            <p className="mt-2 max-w-3xl text-gray-600">{event?.objective}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TopInfoCard
            title="Horario de Votación"
            note={
              officialPublicationLocked
                ? "La publicación oficial ya fue confirmada."
                : scheduleEditable
                ? "Puedes modificar el cronograma hasta el límite de publicación oficial. "
                : "Ya no puede modificarse porque el límite de publicación oficial ya pasó o la votación ya comenzó."
            }
            action={
              scheduleEditable ? (
                <button
                  type="button"
                  onClick={() => {
                    setScheduleError(null);
                    setScheduleSuccess(null);
                    setIsScheduleModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#459151]/20 bg-[#EFF7F0] px-3 py-2 text-sm font-medium text-[#2E6A38] transition-colors hover:bg-[#E4F3E7]"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Modificar horarios
                </button>
              ) : null
            }
            lines={[
              { label: "Desde", value: formatDateTimeForUi(event?.votingStart) },
              { label: "Hasta", value: formatDateTimeForUi(event?.votingEnd) },
              {
                label: "Resultados",
                value: formatDateTimeForUi(event?.resultsPublishAt),
              },
            ]}
          />
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-800">Estado actual</h3>
            </div>
            <div className="flex justify-center">
              <StatusBadge state={lifecycle} />
            </div>
          </div>
          {presentialKioskEnabled ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800">Punto presencial</h3>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleOpenKiosk}
                  className="inline-flex items-center justify-center rounded-lg bg-[#459151] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3a7a44]"
                >
                  Abrir página QR
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopyKioskLink()}
                  disabled={creatingKioskLink}
                  className="inline-flex items-center justify-center rounded-lg border border-[#459151]/25 bg-white px-4 py-2.5 text-sm font-semibold text-[#2E6A38] transition hover:bg-[#EFF7F0] disabled:opacity-60"
                >
                  {creatingKioskLink ? "Preparando enlace..." : "Copiar enlace"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {canCreateNews ? (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-gray-900">¿Quieres informar algo?</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewsError(null);
                  setNewsMessage(null);
                  setIsNewsModalOpen(true);
                }}
                className="inline-flex items-center justify-center rounded-lg bg-[#459151] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3a7a44]"
              >
                Crear noticia
              </button>
            </div>
          </div>
        ) : null}

        {kioskMessage ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {kioskMessage}
          </div>
        ) : null}

        {kioskError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {kioskError}
          </div>
        ) : null}

        {newsMessage ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {newsMessage}
          </div>
        ) : null}

        {newsError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {newsError}
          </div>
        ) : null}

        {fullElectionEditingEnabled ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            {isReferendum
              ? "Mientras siga abierta esta etapa, puedes ajustar la configuración, el cronograma, las opciones y el padrón."
              : "Mientras siga abierta esta etapa, puedes ajustar la configuración, el cronograma, las planchas, los candidatos y el padrón."}
          </div>
        ) : null}

        {postCutoffReadOnly ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            Ya faltan menos de {PRE_PUBLICATION_CUTOFF_HOURS} horas para el inicio. {isReferendum ? "El referéndum" : "La elección"} queda en solo lectura hasta que comience la votación.
          </div>
        ) : null}

        {lifecycle === "PUBLICATION_EXPIRED" ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            El plazo para confirmar la publicación oficial ya venció. {isReferendum ? "El referéndum" : "La elección"} queda bloqueado y ya no debe seguir editándose.
          </div>
        ) : null}

        {scheduleSuccess ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {scheduleSuccess}
          </div>
        ) : null}

        {padronMessage ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {padronMessage}
          </div>
        ) : null}

        {padronError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {padronError}
          </div>
        ) : null}

        {shouldShowResults && resultsData && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-violet-900">
                  Resultados disponibles
                </h2>
                <p className="mt-1 text-sm text-violet-700">
                  {isReferendum
                    ? "Ya se publicaron los resultados de este referéndum."
                    : "Ya se publicaron los resultados de esta votación."}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate(`/votacion/elecciones/${actualElectionId}/publica`)
                }
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Ver resultados
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <ConfigStepsTabs
            currentStep={activeTab}
            completedSteps={[1, 2, 3]}
            isReferendum={isReferendum}
            onStepChange={setActiveTab}
          />

          {activeTab === 1 &&
            (isReferendum ? (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-800">
                  El referéndum ya tiene su estructura lista.
                </p>
              </div>
            ) : (
              <PositionsTable positions={positions} readOnly />
            ))}
          {activeTab === 2 && <PartiesTable parties={parties} readOnly isReferendum={isReferendum} />}
          {activeTab === 3 && displayPadronFile && (
            <LoadedPadronView
              file={displayPadronFile}
              voters={filteredVoters}
              totalVoters={displayPadronTotal}
              validCount={displayPadronValidCount}
              invalidCount={displayPadronInvalidCount}
              page={page}
              totalPages={displayPadronTotalPages}
              pageSize={20}
              searchValue={searchTerm}
              onPageChange={setPage}
              onSearchChange={setSearchTerm}
              onEnableVoter={
                canEnableExistingLimitedPadronVoters
                  ? (voter) => void handleEnableLimitedPadronVoter(voter)
                  : undefined
              }
              onDownloadPdf={currentPadron ? () => void handleDownloadPadronPdf() : undefined}
              downloadingPdf={downloadingPadronPdf}
              enablingVoterId={currentPadronActionVoterId}
              loading={activeWorkflowDraft ? loadingPadronStaging : loadingPadronVoters}
              readOnly
            />
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full space-y-5">
            <div>
              {isReferendum ? (
                <>
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Referéndum
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-900">
                    {referendumQuestion || "Referéndum"}
                  </h2>
                </>
              ) : (
                <h2 className="text-2xl font-bold text-gray-900">
                  Papeleta Electoral
                </h2>
              )}
              <p className="mt-1 text-gray-600">
                {getBallotDescription(lifecycle, isReferendum)}
              </p>
            </div>

            {parties.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
                {isReferendum
                  ? "No hay opciones configuradas todavía."
                  : "No hay planchas configuradas todavía."}
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-2">
                {parties.map((party, index) => (
                  <div
                    key={party.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div
                      className="grid h-2"
                      style={{ gridTemplateColumns: `repeat(${getOptionColors(party).length}, minmax(0, 1fr))` }}
                    >
                      {getOptionColors(party).map((color, index) => (
                        <span key={`${party.id}-${color}-${index}`} style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <div className="p-6">
                      {isReferendum ? (
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Opción {index + 1}
                            </p>
                            <h3 className="mt-1 text-xl font-semibold text-gray-800">
                              {party.name}
                            </h3>
                          </div>
                          <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 pb-5 border-b border-gray-200">
                            {party.logoUrl ? (
                              <img
                                src={party.logoUrl}
                                alt={party.name}
                                className="h-16 w-16 rounded-xl object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                {getInitial(party.name)}
                              </div>
                            )}
                            <h3 className="text-xl font-semibold text-gray-800">
                              {party.name}
                            </h3>
                          </div>

                          <div className="space-y-5 pt-5">
                            {party.candidates.map((candidate) => (
                              <div
                                key={candidate.id}
                                className="flex items-center gap-4"
                              >
                                {candidate.photoUrl ? (
                                  <img
                                    src={candidate.photoUrl}
                                    alt={candidate.fullName}
                                    className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                                  />
                                ) : (
                                  <div className="h-16 w-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                    {getInitial(candidate.fullName)}
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                                    {candidate.positionName}
                                  </p>
                                  <p className="text-xl font-semibold text-gray-800">
                                    {candidate.fullName}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {otherElections.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Otras votaciones
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {otherElections.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => navigateToElection(item)}
                  className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-[#459151] hover:shadow-md"
                >
                  <div className="mb-2">
                    <StatusBadge state={item.status} />
                  </div>
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{item.objective}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal2
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setScheduleError(null);
        }}
        title="Modificar horarios"
        size="lg"
      >
        <div className="space-y-5">
          {scheduleError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {scheduleError}
            </div>
          ) : null}

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Límite para modificar y publicar oficialmente</p>
            <p className="mt-1">
              La elección solo puede seguir modificándose y publicándose hasta {currentPublishDeadlineLabel}. La nueva fecha de inicio debe quedar al menos {PRE_PUBLICATION_CUTOFF_HOURS} horas por delante.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Inicio de votación
              </span>
              <input
                type="datetime-local"
                value={scheduleForm.votingStart}
                min={minimumVotingStartValue}
                onChange={(event) =>
                  handleScheduleInputChange("votingStart", event.target.value)
                }
                className={`w-full rounded-lg px-4 py-3 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-[#459151]/15 ${
                  scheduleFieldErrors.votingStart
                    ? "border border-red-300 bg-red-50 focus:border-red-400"
                    : "border border-gray-300 focus:border-[#459151]"
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">
                Debe quedar al menos {PRE_PUBLICATION_CUTOFF_HOURS} horas adelante.
              </p>
              {scheduleFieldErrors.votingStart ? (
                <p className="mt-1 text-sm text-red-600">{scheduleFieldErrors.votingStart}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Fin de votación
              </span>
              <input
                type="datetime-local"
                value={scheduleForm.votingEnd}
                min={scheduleForm.votingStart || minimumVotingStartValue}
                onChange={(event) =>
                  handleScheduleInputChange("votingEnd", event.target.value)
                }
                className={`w-full rounded-lg px-4 py-3 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-[#459151]/15 ${
                  scheduleFieldErrors.votingEnd
                    ? "border border-red-300 bg-red-50 focus:border-red-400"
                    : "border border-gray-300 focus:border-[#459151]"
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">
                Debe ser posterior al inicio configurado.
              </p>
              {scheduleFieldErrors.votingEnd ? (
                <p className="mt-1 text-sm text-red-600">{scheduleFieldErrors.votingEnd}</p>
              ) : null}
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Publicación de resultados
              </span>
              <input
                type="datetime-local"
                value={scheduleForm.resultsPublishAt}
                min={addMinutesToLocalDateTime(
                  scheduleForm.votingEnd,
                  1,
                  scheduleForm.votingStart || minimumVotingStartValue,
                )}
                onChange={(event) =>
                  handleScheduleInputChange(
                    "resultsPublishAt",
                    event.target.value,
                  )
                }
                className={`w-full rounded-lg px-4 py-3 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-[#459151]/15 ${
                  scheduleFieldErrors.resultsPublishAt
                    ? "border border-red-300 bg-red-50 focus:border-red-400"
                    : "border border-gray-300 focus:border-[#459151]"
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">
                Debe publicarse al menos 1 minuto después del cierre.
              </p>
              {scheduleFieldErrors.resultsPublishAt ? (
                <p className="mt-1 text-sm text-red-600">{scheduleFieldErrors.resultsPublishAt}</p>
              ) : null}
            </label>
          </div>


          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleScheduleSave}
              disabled={isUpdateButtonDisabled()}
              className="rounded-lg bg-[#459151] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3a7a44] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {renderButtonText()}
            </button>
          </div>
        </div>
      </Modal2>
      <CreateNewsModal
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        onSubmit={handleCreateNews}
        isLoading={creatingNews}
      />

    </div>
  );
};

export default ActiveElectionStatusPage;
