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
import PadronRecordModal from "./components/PadronRecordModal";
import CreateNewsModal from "./components/CreateNewsModal";
import {
  useAddCurrentPadronVoterMutation,
  useCreateEventNewsMutation,
  useEnableCurrentPadronVoterMutation,
  useGetVotingEventQuery,
  useGetVotingEventsQuery,
  useGetEventRolesQuery,
  useGetEventOptionsQuery,
  useGetPadronVersionsQuery,
  useGetPadronVotersQuery,
  useGetEventResultsQuery,
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
  areResultsAvailable,
  canEditElectionBeforeCutoff,
  canEditPadronInLimitedMode,
  formatDateTimeForUi,
  getPublishDeadlineMs,
  getOptionColors,
  hasDraftAlreadyStarted,
  hasVotingEnded,
  isAfterPublishCutoffBeforeVoting,
  isOfficiallyPublished,
  isDuringVotingWindow,
  stableCreatedAt,
  THIRTY_SIX_HOURS_MS,
  useClientNow,
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

const optionToParty = (option: VotingOption): PartyWithCandidates => ({
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
    positionName: candidate.roleName,
    fullName: candidate.name,
    photoUrl: candidate.photoUrl,
  })),
});

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const validateScheduleForm = (
  form: { votingStart: string; votingEnd: string; resultsPublishAt: string },
  enforceWindowRule: boolean,
  nowMs: number,
) => {
  if (
    !form.votingStart.trim() ||
    !form.votingEnd.trim() ||
    !form.resultsPublishAt.trim()
  ) {
    return "Debes completar las tres fechas para guardar el cronograma.";
  }

  const votingStart = new Date(form.votingStart);
  const votingEnd = new Date(form.votingEnd);
  const resultsPublishAt = new Date(form.resultsPublishAt);

  if (
    Number.isNaN(votingStart.getTime()) ||
    Number.isNaN(votingEnd.getTime()) ||
    Number.isNaN(resultsPublishAt.getTime())
  ) {
    return "Debes ingresar fechas válidas para guardar el cronograma.";
  }

  if (votingStart >= votingEnd) {
    return "La fecha de inicio debe ser anterior a la fecha de fin.";
  }

  if (resultsPublishAt <= votingEnd) {
    return "La publicación de resultados debe ser posterior al fin de la votación.";
  }

  if (
    enforceWindowRule &&
    votingStart.getTime() - nowMs < THIRTY_SIX_HOURS_MS
  ) {
    return "La fecha de inicio debe poder modificarse hasta 36 horas antes de iniciar.";
  }

  return null;
};

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

const getBallotDescription = (lifecycle: string) =>
  lifecycle === "RESULTS" ||
  lifecycle === "RESULTS_PUBLISHED" ||
  lifecycle === "CLOSED"
    ? "Conoce a los candidatos y partidos políticos que participaron en esta votación."
    : "Conoce a los candidatos y partidos políticos que participan en esta votación.";

const getPadronDisplayName = (sourceType?: string | null) => {
  if (sourceType === "PDF_IMPORT") {
    return "Documento PDF confirmado";
  }
  if (sourceType === "IMAGE_IMPORT") {
    return "Imagen confirmada";
  }
  return "Padrón confirmado";
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
    PUBLICATION_EXPIRED: "Publicación vencida",
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

type RecordModalState = { open: false } | { open: true; mode: "create" };

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
  const [recordModal, setRecordModal] = useState<RecordModalState>({ open: false });
  const [currentPadronActionVoterId, setCurrentPadronActionVoterId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    votingStart: "",
    votingEnd: "",
    resultsPublishAt: "",
  });

  const { data: event, isLoading: loadingEvent } = useGetVotingEventQuery(
    actualElectionId,
    {
      skip: !actualElectionId,
    },
  );
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
  const { data: padronVersions = [], isLoading: loadingPadronVersions, refetch: refetchPadronVersions } =
    useGetPadronVersionsQuery(actualElectionId, {
      skip: !actualElectionId,
    });
  const { data: padronData, isLoading: loadingPadronVoters, refetch: refetchPadronVoters } =
    useGetPadronVotersQuery(
      { eventId: actualElectionId, page, limit: 20 },
      { skip: !actualElectionId },
    );
  const lifecycle = deriveLifecycle(event, nowMs);
  const shouldShowResults = lifecycle === "RESULTS";
  const { data: resultsData } = useGetEventResultsQuery(actualElectionId, {
    skip: !actualElectionId || !shouldShowResults,
  });
  const [updateEventSchedule, { isLoading: updatingSchedule }] =
    useUpdateEventScheduleMutation();
  const [createPresentialSession, { isLoading: creatingKioskLink }] =
    useCreatePresentialSessionMutation();
  const [createEventNews, { isLoading: creatingNews }] =
    useCreateEventNewsMutation();
  const [addCurrentPadronVoter, { isLoading: addingCurrentPadronVoter }] =
    useAddCurrentPadronVoterMutation();
  const [enableCurrentPadronVoter] = useEnableCurrentPadronVoterMutation();

  const positions = useMemo(() => roles.map(roleToPosition), [roles]);
  const parties = useMemo(() => options.map(optionToParty), [options]);
  const currentPadron =
    padronVersions.find((item) => item.isCurrent) ?? padronVersions[0];
  const voters: Voter[] = useMemo(
    () =>
      (padronData?.voters ?? []).map((voter, index) => ({
        id: voter.id,
        rowNumber: index + 1 + (page - 1) * 20,
        carnet: voter.carnetNorm,
        fullName: voter.fullName ?? "-",
        enabled: voter.enabled,
        status: "valid",
      })),
    [padronData?.voters, page],
  );

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
  const votingPadronLimitedMode = canEditPadronInLimitedMode(event, nowMs);
  const postCutoffReadOnly = isAfterPublishCutoffBeforeVoting(event, nowMs);
  const publishDeadlineMs = getPublishDeadlineMs(event);

  useEffect(() => {
    setScheduleForm({
      votingStart: toDateTimeLocalValue(event?.votingStart),
      votingEnd: toDateTimeLocalValue(event?.votingEnd),
      resultsPublishAt: toDateTimeLocalValue(event?.resultsPublishAt),
    });
  }, [event?.resultsPublishAt, event?.votingEnd, event?.votingStart]);

  const loading =
    loadingEvent ||
    loadingRoles ||
    loadingOptions ||
    loadingPadronVersions ||
    loadingPadronVoters;

  const handleSaveLimitedPadronRecord = async (payload: { ci: string; enabled: boolean }) => {
    if (!actualElectionId) return;

    try {
      setPadronError(null);
      setCurrentPadronActionVoterId("__create__");
      await addCurrentPadronVoter({
        eventId: actualElectionId,
        carnet: payload.ci,
        enabled: true,
      }).unwrap();
      setRecordModal({ open: false });
      setPadronMessage("Votante habilitado agregado al padrón vigente.");
      await Promise.all([refetchPadronVoters(), refetchPadronVersions()]);
    } catch (error: any) {
      throw new Error(
        getRequestErrorMessage(error, "No se pudo agregar el votante al padrón vigente."),
      );
    } finally {
      setCurrentPadronActionVoterId(null);
    }
  };

  const handleEnableLimitedPadronVoter = async (voter: Voter) => {
    if (!actualElectionId || voter.enabled) return;

    try {
      setPadronError(null);
      setCurrentPadronActionVoterId(voter.id);
      await enableCurrentPadronVoter({
        eventId: actualElectionId,
        voterId: voter.id,
      }).unwrap();
      setPadronMessage("Votante habilitado en el padrón vigente.");
      await Promise.all([refetchPadronVoters(), refetchPadronVersions()]);
    } catch (error: any) {
      setPadronError(
        getRequestErrorMessage(error, "No se pudo habilitar el votante en el padrón vigente."),
      );
    } finally {
      setCurrentPadronActionVoterId(null);
    }
  };

  const handleOpenKiosk = () => {
    if (!actualElectionId) return;

    const path = buildPresentialKioskPath(actualElectionId, {
      stationId: DEFAULT_KIOSK_STATION_ID,
      eventName: event?.name ?? "Punto presencial",
    });

    window.open(path, "_blank", "noopener,noreferrer");
  };

  const handleCopyKioskLink = async () => {
    if (!actualElectionId) return;

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

    const scheduleValidationError = validateScheduleForm(
      scheduleForm,
      (event?.state ?? event?.status ?? "DRAFT") !== "DRAFT",
      nowMs ?? new Date().getTime(),
    );

    if (scheduleValidationError) {
      setScheduleError(scheduleValidationError);
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
      await createEventNews({
        eventId: actualElectionId,
        data: payload,
      }).unwrap();
      setNewsError(null);
      setNewsMessage("Noticia publicada correctamente para los votantes del padrón actual.");
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
    return updatingSchedule;
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
            <div className="mt-4">
              <StatusBadge state={lifecycle} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TopInfoCard
            title="Horario de Votación"
            note={
              officialPublicationLocked
                ? "La publicación oficial ya fue confirmada. El cronograma queda bloqueado y solo se mantiene la gestión limitada de padrón."
                : scheduleEditable
                ? "Puedes modificar el cronograma hasta el límite de publicación oficial. La fecha de inicio debe seguir quedando al menos 36 horas adelante."
                : "El cronograma ya no puede modificarse porque el límite de publicación oficial ya pasó o la votación ya comenzó."
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
                label: "Límite de publicación",
                value: publishDeadlineMs ? formatDateTimeForUi(new Date(publishDeadlineMs).toISOString()) : 'No definido',
              },
              {
                label: "Resultados",
                value: formatDateTimeForUi(event?.resultsPublishAt),
              },
            ]}
          />
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-800">Estado actual</h3>
            </div>
            <StatusBadge state={lifecycle} />
          </div>
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
                Abrir kiosco
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
        </div>

        {canCreateNews ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>La publicación oficial ya notificó a los votantes del padrón actual.</span>
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
            Mientras siga abierta esta etapa, puedes ajustar la configuración, el cronograma, las planchas, los candidatos y el padrón.
          </div>
        ) : null}

        {postCutoffReadOnly ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            Ya faltan menos de 24 horas para el inicio. La elección queda en solo lectura hasta que comience la votación.
          </div>
        ) : null}

        {lifecycle === "PUBLICATION_EXPIRED" ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            El plazo para confirmar la publicación oficial ya venció. La elección queda bloqueada y ya no debe seguir editándose.
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
                  Ya se publicaron los resultados de esta votación.
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
            onStepChange={setActiveTab}
          />

          {activeTab === 1 && <PositionsTable positions={positions} readOnly />}
          {activeTab === 2 && <PartiesTable parties={parties} readOnly />}
          {activeTab === 3 && currentPadron && (
            <LoadedPadronView
              file={{
                fileName: getPadronDisplayName(currentPadron.sourceType),
                uploadedAt: currentPadron.uploadedAt || currentPadron.createdAt,
                totalRecords: currentPadron.totalRecords,
                validCount: currentPadron.validCount,
                invalidCount: currentPadron.invalidCount,
              }}
              voters={filteredVoters}
              totalVoters={padronData?.total ?? 0}
              validCount={currentPadron.validCount}
              invalidCount={currentPadron.invalidCount}
              page={page}
              totalPages={padronData?.totalPages ?? 1}
              pageSize={20}
              searchValue={searchTerm}
              onPageChange={setPage}
              onSearchChange={setSearchTerm}
              onAddRecord={
                votingPadronLimitedMode
                  ? () => {
                      setPadronError(null);
                      setPadronMessage(null);
                      setRecordModal({ open: true, mode: "create" });
                    }
                  : undefined
              }
              onEnableVoter={
                votingPadronLimitedMode
                  ? (voter) => void handleEnableLimitedPadronVoter(voter)
                  : undefined
              }
              enablingVoterId={currentPadronActionVoterId}
              addRecordLabel="Agregar habilitado"
              loading={loadingPadronVoters}
              readOnly
            />
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Papeleta Electoral
              </h2>
              <p className="mt-1 text-gray-600">
                {getBallotDescription(lifecycle)}
              </p>
            </div>

            {parties.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
                No hay planchas configuradas todavía.
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-2">
                {parties.map((party) => (
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Inicio de votación
              </span>
              <input
                type="datetime-local"
                value={scheduleForm.votingStart}
                onChange={(event) =>
                  handleScheduleInputChange("votingStart", event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/15"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Fin de votación
              </span>
              <input
                type="datetime-local"
                value={scheduleForm.votingEnd}
                onChange={(event) =>
                  handleScheduleInputChange("votingEnd", event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/15"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Publicación de resultados
              </span>
              <input
                type="datetime-local"
                value={scheduleForm.resultsPublishAt}
                onChange={(event) =>
                  handleScheduleInputChange(
                    "resultsPublishAt",
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/15"
              />
            </label>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Cambiar horarios actualiza el cronograma visible de la elección. La revisión previa y la publicación oficial siguen siendo pasos separados, y la fecha de inicio debe seguir quedando al menos 36 horas adelante.
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

      <PadronRecordModal
        isOpen={recordModal.open}
        mode="create"
        enabledLocked
        enabledHelperText="En esta etapa solo se permite agregar nuevos votantes ya habilitados."
        isLoading={addingCurrentPadronVoter}
        onClose={() => setRecordModal({ open: false })}
        onSubmit={handleSaveLimitedPadronRecord}
      />

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
