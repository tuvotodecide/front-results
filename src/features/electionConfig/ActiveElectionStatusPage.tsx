import React, { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
} from "@/domains/votacion/navigation/compat-private";
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  EllipsisHorizontalIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import BallotPreview from "./components/BallotPreview";
import PositionsTable from "./components/PositionsTable";
import PartiesTable from "./components/PartiesTable";
import PhoneMockup from "./components/PhoneMockup";
import CreateNewsModal from "./components/CreateNewsModal";
import CreateNewsForm from "./components/CreateNewsForm";
import ElectionOfficialResultsView from "./components/ElectionOfficialResultsView";
import ParticipationAnalyticsModal from "./components/ParticipationAnalyticsModal";
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
  useGetParticipationAnalyticsQuery,
} from "../../store/votingEvents";
import type { PartyWithCandidates, Position, Voter } from "./types";
import type {
  EventRole,
  VotingOption,
  OptionCandidate,
} from "../../store/votingEvents/types";
import {
  selectActiveContext,
  selectTenantId,
  selectUserRole,
} from "../../store/auth/authSlice";
import { useSelector } from "react-redux";
import Modal2 from "../../components/Modal2";
import { PadronCheckModal } from "@/features/padronCheck";
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
import { getRuntimeEnv } from "@/shared/system/runtimeEnv";
import { useElectionTvdUsage } from "./data/useElectionTvdUsage";
import { publicElectionRepository } from "@/features/publicElectionDetail/data/PublicElectionRepository.api";
import type {
  Candidate,
  PublicElectionDetail,
} from "@/features/publicElectionDetail/types";

const SMART_CONTRACT_URL =
  getRuntimeEnv('VITE_PUBLIC_SMART_CONTRACT_URL', 'NEXT_PUBLIC_SMART_CONTRACT_URL');

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

const copyTextToClipboard = async (text: string) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea fallback below.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
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
    RESULTS: "bg-green-100 text-green-700 border-green-200",
    RESULTS_PUBLISHED: "bg-green-100 text-green-700 border-green-200",
  };

  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicada",
    READY_FOR_REVIEW: "En revisión previa",
    OFFICIALLY_PUBLISHED: "Publicada oficialmente",
    PUBLICATION_EXPIRED: "Caducada",
    ACTIVE: "En votación",
    CLOSED: "Finalizada",
    RESULTS: "Resultados oficiales publicados",
    RESULTS_PUBLISHED: "Resultados oficiales publicados",
  };

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[state || "DRAFT"] || styles.DRAFT
      }`}
    >
      {labels[state || "DRAFT"] || state || "Borrador"}
    </span>
  );
};

type StatusMainTab = "dates" | "results" | "ballot" | "more";

type StatusMoreView =
  | "menu"
  | "padron"
  | "tvd"
  | "analytics"
  | "public-link"
  | "blockchain"
  | "kiosk"
  | "news";

const STATUS_TABS: Array<{ id: StatusMainTab; label: string }> = [
  { id: "dates", label: "Fechas" },
  { id: "results", label: "Resultados" },
  { id: "ballot", label: "Papeleta" },
  { id: "more", label: "Más" },
];

const MORE_OPTIONS: Array<{ id: StatusMoreView; label: string; description: string }> = [
  {
    id: "padron",
    label: "Padrón y participación",
    description: "Consulta habilitación y participación por carnet.",
  },
  {
    id: "tvd",
    label: "Uso $TVD",
    description: "Resumen económico mock de la votación.",
  },
  {
    id: "analytics",
    label: "Analíticas",
    description: "Participación, ausentismo y reporte.",
  },
  {
    id: "public-link",
    label: "Enlace público",
    description: "Copiar o abrir la votación pública.",
  },
  {
    id: "blockchain",
    label: "Verificación blockchain",
    description: "Contrato inteligente y guía de consulta.",
  },
  {
    id: "news",
    label: "Noticias",
    description: "Crear noticia o comunicado para votantes.",
  },
];

const getLifecycleDescription = (lifecycle: string, isReferendum: boolean) => {
  const subject = isReferendum ? "referéndum" : "elección";
  const descriptions: Record<string, string> = {
    ACTIVE: `La ${subject} está activa. Puedes consultar padrón, participación y enlace público.`,
    CLOSED: `La ${subject} finalizó. Revisa fechas, participación y resultados cuando estén disponibles.`,
    RESULTS: "Resultados oficiales publicados. Consulta la información pública y la trazabilidad del proceso.",
    RESULTS_PUBLISHED: "Resultados oficiales publicados. Consulta la información pública y la trazabilidad del proceso.",
    OFFICIALLY_PUBLISHED: `La ${subject} fue publicada oficialmente y espera el inicio de votación.`,
    PUBLISHED: `La ${subject} fue notificada y espera confirmación/publicación oficial.`,
    READY_FOR_REVIEW: `La ${subject} está en revisión previa.`,
    PUBLICATION_EXPIRED: `La ventana de publicación de la ${subject} venció.`,
  };

  return descriptions[lifecycle] ?? `Consulta el estado y la configuración de esta ${subject}.`;
};

const STATUS_TABS_UI: Array<{ id: StatusMainTab; label: string }> = [
  { id: "dates", label: "Fechas" },
  { id: "results", label: "Resultados" },
  { id: "ballot", label: "Papeleta" },
  { id: "more", label: "Mas" },
];

const MORE_OPTIONS_UI: Array<{
  id: Exclude<StatusMoreView, "menu">;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    id: "padron",
    label: "Padron y consulta",
    description: "Consulta si un CI ya voto.",
    icon: "CI",
  },
  {
    id: "tvd",
    label: "Uso $TVD",
    description: "Costo de esta votacion.",
    icon: "$",
  },
  {
    id: "analytics",
    label: "Analiticas",
    description: "Resultados y estadisticas.",
    icon: "%",
  },
  {
    id: "public-link",
    label: "Enlace publico",
    description: "Copiar enlace publico.",
    icon: "L",
  },
  {
    id: "blockchain",
    label: "Verificacion blockchain",
    description: "Integridad verificable.",
    icon: "B",
  },
  {
    id: "kiosk",
    label: "Punto presencial QR",
    description: "Acceso operativo para mesa presencial.",
    icon: "QR",
  },
  {
    id: "news",
    label: "Noticias",
    description: "Informacion relacionada.",
    icon: "N",
  },
];

const getLifecycleDescriptionUi = (
  lifecycle: string,
  isReferendum: boolean,
) => {
  const subject = isReferendum ? "referendum" : "eleccion";
  const descriptions: Record<string, string> = {
    ACTIVE: `La ${subject} esta activa. Consulta la informacion publica de esta votacion.`,
    CLOSED: "La votacion finalizo. Consulta la informacion publica de esta eleccion.",
    RESULTS: "La votacion finalizo. Consulta la informacion publica de esta eleccion.",
    RESULTS_PUBLISHED:
      "La votacion finalizo. Consulta la informacion publica de esta eleccion.",
    OFFICIALLY_PUBLISHED: `La ${subject} fue publicada oficialmente y espera el inicio de votacion.`,
    PUBLISHED: `La ${subject} fue notificada y espera confirmacion oficial.`,
    READY_FOR_REVIEW: `La ${subject} esta en revision previa.`,
    PUBLICATION_EXPIRED: `La ventana de publicacion de la ${subject} vencio.`,
  };

  return descriptions[lifecycle] ?? `Consulta el estado y la configuracion de esta ${subject}.`;
};

const CardShell: React.FC<{
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, children, action }) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const FieldRow: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="max-w-[65%] text-right text-sm font-medium text-gray-900">
      {value}
    </span>
  </div>
);

const StatusDateCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: string;
  action?: React.ReactNode;
}> = ({ label, value, icon, action }) => (
  <article className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-[#2E7D32]">
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="mt-2 text-base font-bold text-gray-900">{value}</div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  </article>
);

const MoreOptionButton: React.FC<{
  option: (typeof MORE_OPTIONS_UI)[number];
  onClick: () => void;
}> = ({ option, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-gray-50"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-xs font-bold text-gray-500">
      {option.icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-semibold text-gray-900">{option.label}</span>
      <span className="mt-0.5 block text-xs text-gray-500">{option.description}</span>
    </span>
    <ChevronRightIcon className="h-4 w-4 text-gray-300" aria-hidden="true" />
  </button>
);

const TvdAmountCard: React.FC<{
  label: string;
  amount: { tvd: string; bs: string };
}> = ({ label, amount }) => (
  <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-4 last:border-b-0">
    <p className="text-sm font-semibold text-gray-600">
      {label}
    </p>
    <div className="text-right">
      <p className="text-base font-bold text-gray-900">{amount.tvd}</p>
      <p className="mt-1 text-sm font-medium text-gray-500">{amount.bs}</p>
    </div>
  </div>
);

const abbreviateHash = (value: string) =>
  value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;

const formatAnalyticsStatus = (value?: string | null) => {
  const normalized = String(value ?? "").toUpperCase();
  const labels: Record<string, string> = {
    RESULTS_PUBLISHED: "Resultados publicados",
    RESULTS: "Resultados publicados",
    FINAL: "Resultados finales",
    CLOSED: "Votacion finalizada",
    ACTIVE: "Votacion activa",
    PUBLISHED: "Publicada",
  };

  return labels[normalized] ?? value ?? "-";
};

const colorPalette = [
  "#1e40af",
  "#059669",
  "#dc2626",
  "#7c3aed",
  "#0ea5e9",
  "#f59e0b",
  "#16a34a",
  "#f97316",
];

void PositionsTable;
void PartiesTable;
void getBallotDescription;
void STATUS_TABS;
void MORE_OPTIONS;
void getLifecycleDescription;

const ActiveElectionStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();
  const tenantId = useSelector(selectTenantId);
  const activeContext = useSelector(selectActiveContext);
  const userRole = useSelector(selectUserRole);
  const actualElectionId = electionId || "";
  const nowMs = useClientNow();
  const [activeStatusTab, setActiveStatusTab] = useState<StatusMainTab>("dates");
  const [activeMoreView, setActiveMoreView] = useState<StatusMoreView>("menu");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [tvdOperationsOpen, setTvdOperationsOpen] = useState(false);
  const [tvdCopyMessage, setTvdCopyMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [kioskMessage, setKioskMessage] = useState<string | null>(null);
  const [kioskError, setKioskError] = useState<string | null>(null);
  const [publicLinkMessage, setPublicLinkMessage] = useState<string | null>(null);
  const [publicLinkError, setPublicLinkError] = useState<string | null>(null);
  const [electionIdCopyMessage, setElectionIdCopyMessage] = useState<string | null>(null);
  const [newsMessage, setNewsMessage] = useState<string | null>(null);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isParticipationCheckModalOpen, setIsParticipationCheckModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [padronMessage, setPadronMessage] = useState<string | null>(null);
  const [padronError, setPadronError] = useState<string | null>(null);
  const [currentPadronActionVoterId, setCurrentPadronActionVoterId] = useState<string | null>(null);
  void currentPadronActionVoterId;
  const [publicElectionDetail, setPublicElectionDetail] =
    useState<PublicElectionDetail | null>(null);
  const [loadingPublicElectionDetail, setLoadingPublicElectionDetail] =
    useState(false);
  const [otherElectionsPage, setOtherElectionsPage] = useState(0);
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
  const normalizedUserRole = String(userRole ?? "").toUpperCase();
  const isGlobalAdminRole =
    normalizedUserRole === "ADMIN" || normalizedUserRole === "SUPERADMIN";
  const isTenantContextForEvent =
    activeContext?.type === "TENANT" &&
    Boolean(tenantId) &&
    (!event?.tenantId || String(event.tenantId) === String(tenantId));
  const canViewParticipationAnalytics =
    isGlobalAdminRole ||
    isTenantContextForEvent ||
    (normalizedUserRole === "TENANT_ADMIN" &&
      Boolean(event?.tenantId) &&
      String(event?.tenantId) === String(tenantId ?? ""));
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
  const shouldShowResults =
    lifecycle === "RESULTS" ||
    lifecycle === "RESULTS_PUBLISHED" ||
    lifecycle === "CLOSED";
  const { data: resultsData } = useGetEventResultsQuery(actualElectionId, {
    skip: !actualElectionId || !shouldShowResults,
  });
  const shouldLoadAnalytics =
    activeStatusTab === "more" &&
    activeMoreView === "analytics" &&
    canViewParticipationAnalytics;
  const {
    data: participationAnalytics,
    isFetching: loadingParticipationAnalytics,
    isError: participationAnalyticsError,
  } = useGetParticipationAnalyticsQuery(actualElectionId, {
    skip: !actualElectionId || !shouldLoadAnalytics,
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
  void positions;
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
  const otherElectionsPageSize = 3;
  const otherElectionsTotalPages = Math.max(
    1,
    Math.ceil(otherElections.length / otherElectionsPageSize),
  );
  const otherElectionPages = useMemo(() => {
    const pages = [];
    for (let index = 0; index < otherElections.length; index += otherElectionsPageSize) {
      pages.push(otherElections.slice(index, index + otherElectionsPageSize));
    }
    return pages;
  }, [otherElections]);
  void otherElectionsPage;
  void otherElectionPages;
  const scheduleEditable = canEditSchedule(event, nowMs);
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
  const publicElectionUrl = useMemo(() => {
    if (!actualElectionId) return "";
    const fallbackPath = `/votacion/elecciones/${actualElectionId}/publica`;
    const source = String(event?.publicUrl ?? event?.publicPath ?? "").trim() || fallbackPath;
    if (/^https?:\/\//i.test(source)) {
      return source;
    }
    const normalizedPath = source.startsWith("/") ? source : `/${source}`;
    return `${window.location.origin}${normalizedPath}`;
  }, [actualElectionId, event?.publicPath, event?.publicUrl]);
  const tvdUsage = useElectionTvdUsage(actualElectionId);
  const adminResultsRole = useMemo(
    () =>
      resultsData?.roles.find((role) => role.ranking.length > 0) ??
      null,
    [resultsData?.roles],
  );
  const optionColorByName = useMemo(() => {
    const colorMap = new Map<string, string>();
    options.forEach((option, index) => {
      colorMap.set(
        option.name,
        option.color || colorPalette[index % colorPalette.length] || "#2E7D32",
      );
    });
    return colorMap;
  }, [options]);
  const adminResultCandidates = useMemo<Candidate[]>(() => {
    if (!adminResultsRole) return [];

    const candidates = adminResultsRole.ranking.map((item, index) => ({
      id: item.optionId || `${item.optionName}-${index}`,
      name: item.optionName,
      party: item.optionName,
      colorHex:
        optionColorByName.get(item.optionName) ??
        colorPalette[index % colorPalette.length] ??
        "#2E7D32",
      votes: item.votes,
      percent: item.percentage,
    }));

    return candidates;
  }, [adminResultsRole, optionColorByName]);
  const publicResultCandidates = publicElectionDetail?.results?.candidates ?? [];
  const hasAdminResults = adminResultCandidates.length > 0;
  const hasPublicResults = publicResultCandidates.some(
    (candidate) => candidate.id !== "blank" && candidate.votes > 0,
  );
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
  void displayPadronFile;
  void displayPadronTotal;
  void displayPadronValidCount;
  void displayPadronInvalidCount;

  useEffect(() => {
    setOtherElectionsPage((current) =>
      Math.min(current, otherElectionsTotalPages - 1),
    );
  }, [otherElectionsTotalPages]);

  useEffect(() => {
    setScheduleForm({
      votingStart: event?.votingStart ? toLocalDateTimeValue(new Date(event.votingStart)) : "",
      votingEnd: event?.votingEnd ? toLocalDateTimeValue(new Date(event.votingEnd)) : "",
      resultsPublishAt: event?.resultsPublishAt
        ? toLocalDateTimeValue(new Date(event.resultsPublishAt))
        : "",
    });
  }, [event?.resultsPublishAt, event?.votingEnd, event?.votingStart]);

  useEffect(() => {
    let cancelled = false;

    const loadPublicElectionDetail = async () => {
      if (!actualElectionId || !shouldShowResults || activeStatusTab !== "results") {
        setPublicElectionDetail(null);
        return;
      }

      setLoadingPublicElectionDetail(true);
      try {
        const detail =
          await publicElectionRepository.getPublicElectionDetail(actualElectionId);
        if (!cancelled) {
          setPublicElectionDetail(detail);
        }
      } catch {
        if (!cancelled) {
          setPublicElectionDetail(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingPublicElectionDetail(false);
        }
      }
    };

    void loadPublicElectionDetail();

    return () => {
      cancelled = true;
    };
  }, [activeStatusTab, actualElectionId, shouldShowResults]);

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
      setPadronMessage("votante habilitado en el padrón vigente.");
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
  void handleEnableLimitedPadronVoter;

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

  const handleOpenPublicElection = () => {
    if (!publicElectionUrl) return;
    window.open(publicElectionUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyPublicElectionLink = async () => {
    if (!publicElectionUrl) return;

    setPublicLinkMessage(null);
    setPublicLinkError(null);

    try {
      const copied = await copyTextToClipboard(publicElectionUrl);
      if (!copied) {
        throw new Error("Clipboard unavailable");
      }
      setPublicLinkMessage("Enlace copiado.");
    } catch {
      setPublicLinkError("No se pudo copiar el enlace.");
    }
  };

  const handleCopyElectionId = async () => {
    if (!actualElectionId) return;

    const copied = await copyTextToClipboard(actualElectionId);
    setElectionIdCopyMessage(copied ? "ID copiado." : "No se pudo copiar el ID.");

    window.setTimeout(() => {
      setElectionIdCopyMessage(null);
    }, 2000);
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

      const copied = await copyTextToClipboard(absoluteUrl);
      if (!copied) {
        throw new Error("Clipboard unavailable");
      }
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
  void navigateToElection;

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
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
            {event?.name ?? "Detalle de votacion"}
          </h1>
          <StatusBadge state={lifecycle} />
          <p className="max-w-3xl text-sm leading-6 text-gray-500 sm:text-base">
            {getLifecycleDescriptionUi(lifecycle, isReferendum)}
          </p>
          <button
            type="button"
            onClick={handleCopyPublicElectionLink}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#2E7D32]"
          >
            <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
            Copiar enlace publico
          </button>
        </header>

        {kioskMessage || publicLinkMessage || newsMessage || scheduleSuccess || padronMessage ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {kioskMessage || publicLinkMessage || newsMessage || scheduleSuccess || padronMessage}
          </div>
        ) : null}

        {kioskError || publicLinkError || newsError || padronError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {kioskError || publicLinkError || newsError || padronError}
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

        <nav
          aria-label="Secciones del estado de la votación"
          className="relative border-b border-gray-200 bg-white"
        >
          <div className="flex w-full overflow-x-auto px-1" role="tablist">
            {STATUS_TABS_UI.map((tab) => {
              const isSelected =
                tab.id === "more"
                  ? activeStatusTab === "more" || isMoreMenuOpen
                  : activeStatusTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    if (tab.id === "more") {
                      setIsMoreMenuOpen((current) => !current);
                      return;
                    }

                    setActiveStatusTab(tab.id);
                    setIsMoreMenuOpen(false);
                  }}
                  className={
                    isSelected
                      ? "min-w-[88px] flex-1 border-b-2 border-[#2E7D32] px-2 py-3 text-center text-sm font-semibold text-[#2E7D32]"
                      : "min-w-[88px] flex-1 border-b-2 border-transparent px-2 py-3 text-center text-sm font-semibold text-gray-500 transition hover:text-gray-900"
                  }
                >
                  {tab.id === "more" ? (
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <EllipsisHorizontalIcon
                        className="h-4 w-4"
                        aria-hidden="true"
                        data-testid="more-tab-indicator"
                      />
                      {tab.label}
                    </span>
                  ) : (
                    tab.label
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {isMoreMenuOpen ? (
          <>
            <button
              type="button"
              aria-label="Cerrar opciones adicionales"
              className="fixed inset-0 z-40 bg-black/35 md:hidden"
              onClick={() => setIsMoreMenuOpen(false)}
            />
            <div
              role="dialog"
              aria-label="Opciones adicionales"
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white p-4 shadow-2xl md:absolute md:bottom-auto md:left-auto md:right-[max(1rem,calc((100vw-72rem)/2+1rem))] md:top-[13rem] md:w-[340px] md:rounded-3xl md:border md:border-gray-100 md:p-4"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 md:hidden" />
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                  Opciones adicionales
                </h2>
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  X
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {MORE_OPTIONS_UI.map((option) => (
                  <MoreOptionButton
                    key={option.id}
                    option={option}
                    onClick={() => {
                      setActiveMoreView(option.id);
                      setActiveStatusTab("more");
                      setIsMoreMenuOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        ) : null}

        {activeStatusTab === "dates" ? (
          <section role="tabpanel" className="space-y-5">
            <h2 className="text-xl font-bold text-gray-900">
              Fechas y estado de la eleccion
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <StatusDateCard
                icon="I"
                label="Inicio de votacion"
                value={formatDateTimeForUi(event?.votingStart)}
              />
              <StatusDateCard
                icon="C"
                label="Cierre de votacion"
                value={formatDateTimeForUi(event?.votingEnd)}
              />
              <StatusDateCard
                icon="R"
                label="Publicacion de resultados"
                value={formatDateTimeForUi(event?.resultsPublishAt)}
                action={
                  scheduleEditable ? (
                    <button
                      type="button"
                      onClick={() => setIsScheduleModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#459151] hover:text-[#2E6A38]"
                    >
                      <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                      Modificar horarios
                    </button>
                  ) : null
                }
              />
            </div>
          </section>
        ) : null}

        {activeStatusTab === "results" ? (
          <section role="tabpanel" className="space-y-5">
            {shouldShowResults && hasAdminResults ? (
              <ElectionOfficialResultsView
                candidates={adminResultCandidates}
                winnerCandidateId={adminResultsRole?.ranking[0]?.optionId ?? null}
                totalVotes={adminResultsRole?.total}
                isReferendum={isReferendum}
              />
            ) : shouldShowResults && hasPublicResults ? (
              <ElectionOfficialResultsView
                candidates={publicResultCandidates}
                winnerCandidateId={publicElectionDetail?.winnerCandidateId}
                totalVotes={publicElectionDetail?.results?.totalVotes}
                isReferendum={publicElectionDetail?.isReferendum ?? isReferendum}
              />
            ) : loadingPublicElectionDetail ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                <p className="font-semibold text-gray-800">Cargando resultados...</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                <p className="font-semibold text-gray-800">
                  No hay resultados oficiales para mostrar.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Cuando estén disponibles, aparecerán aquí sin cambiar de ruta.
                </p>
                {publicElectionUrl ? (
                  <button
                    type="button"
                    onClick={handleOpenPublicElection}
                    className="mt-4 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#459151]"
                  >
                    Abrir resultados públicos
                  </button>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        {activeStatusTab === "ballot" ? (
          <section role="tabpanel" className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Papeleta y opciones
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Vista previa en modo lectura para votantes.
              </p>
            </div>
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <PhoneMockup>
                <BallotPreview
                  parties={parties}
                  isReferendum={isReferendum}
                  question={event?.objective}
                />
              </PhoneMockup>
            </div>
          </section>
        ) : null}

        {activeStatusTab === "more" && activeMoreView !== "menu" ? (
          <section role="tabpanel" className="space-y-5">
            <div className="min-w-0">
              {activeMoreView === "padron" ? (
                <CardShell title="Padron y participacion">
                  <div className="space-y-5">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700">Buscar por carnet</span>
                      <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Ej. 1234567"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/15"
                      />
                    </label>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      {filteredVoters.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                            <tr>
                              <th scope="col" className="px-4 py-3">Carnet</th>
                              <th scope="col" className="px-4 py-3">Habilitado</th>
                              <th scope="col" className="px-4 py-3">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredVoters.map((voter, index) => {
                              const participated = voter.enabled && index % 2 === 0;
                              return (
                                <tr key={voter.id}>
                                  <td className="px-4 py-3 font-medium text-gray-900">{voter.carnet}</td>
                                  <td className="px-4 py-3">
                                    <span className={voter.enabled ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700" : "rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600"}>
                                      {voter.enabled ? "Si" : "No"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={participated ? "rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700" : "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"}>
                                      {participated ? "Votó" : "No votó"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <p className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-500">
                          No hay coincidencias en el padrón.
                        </p>
                      )}
                    </div>
                    {displayPadronTotalPages > 1 ? (
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setPage((current) => Math.max(1, current - 1))}
                          disabled={page <= 1}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        <span className="text-sm text-gray-500">Página {page} de {displayPadronTotalPages}</span>
                        <button
                          type="button"
                          onClick={() => setPage((current) => Math.min(displayPadronTotalPages, current + 1))}
                          disabled={page >= displayPadronTotalPages}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
                        >
                          Siguiente
                        </button>
                      </div>
                    ) : null}
                    {currentPadron ? (
                      <button
                        type="button"
                        onClick={() => void handleDownloadPadronPdf()}
                        disabled={downloadingPadronPdf}
                        className="w-full rounded-xl bg-[#2E7D32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#256b2b] disabled:opacity-60 sm:w-auto"
                      >
                        {downloadingPadronPdf ? "Descargando..." : "Descargar PDF"}
                      </button>
                    ) : null}
                  </div>
                </CardShell>
              ) : null}

              {activeMoreView === "analytics" ? (
                <CardShell title="Estadisticas">
                  {canViewParticipationAnalytics ? (
                    loadingParticipationAnalytics ? (
                      <p className="text-sm text-gray-500">Cargando estadisticas...</p>
                    ) : participationAnalyticsError ? (
                      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        No se pudieron cargar las estadisticas.
                      </p>
                    ) : participationAnalytics ? (
                      <div className="space-y-6">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <article className="rounded-2xl bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Habilitados</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{participationAnalytics.totalEnabled}</p>
                          </article>
                          <article className="rounded-2xl bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Participaron</p>
                            <p className="mt-2 text-3xl font-bold text-[#2E7D32]">{participationAnalytics.totalParticipated}</p>
                          </article>
                          <article className="rounded-2xl bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ausentismo</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{participationAnalytics.totalPending}</p>
                          </article>
                        </div>
                        <div className="grid gap-5 lg:grid-cols-[220px_1fr] lg:items-center">
                          <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full border-[18px] border-[#2E7D32] bg-white shadow-inner">
                            <span className="text-3xl font-bold text-gray-900">
                              {participationAnalytics.participationPercentage}%
                            </span>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                              <span className="h-3 w-3 rounded-full bg-[#2E7D32]" />
                              Participaron
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                              <span className="h-3 w-3 rounded-full bg-gray-200" />
                              Ausentes
                            </div>
                            <FieldRow label="Participacion" value={participationAnalytics.participationPercentage + "%"} />
                            <FieldRow label="Estado" value={formatAnalyticsStatus(participationAnalytics.status)} />
                            <FieldRow label="Fecha publicacion" value={formatDateTimeForUi(participationAnalytics.publishedAt)} />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAnalyticsModalOpen(true)}
                          className="w-full rounded-xl bg-[#2E7D32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#256b2b] sm:w-auto"
                        >
                          Descargar reporte
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Sin estadisticas disponibles.</p>
                    )
                  ) : (
                    <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                      Tu rol actual no tiene permisos para ver estadisticas.
                    </p>
                  )}
                </CardShell>
              ) : null}

              {activeMoreView === "public-link" ? (
                <CardShell title="Enlace público">
                  <div className="mx-auto flex w-full max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={handleCopyPublicElectionLink}
                      className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#459151]"
                    >
                      Copiar enlace
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenPublicElection}
                      className="rounded-lg bg-[#2E7D32] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#256b2b]"
                    >
                      Abrir votación pública
                    </button>
                  </div>
                </CardShell>
              ) : null}

              {activeMoreView === "kiosk" ? (
                <CardShell title="Punto presencial QR">
                  <div className="mx-auto w-full max-w-xl space-y-4">
                    <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      {presentialKioskEnabled
                        ? "El punto presencial está activo para generar enlaces QR."
                        : "El voto presencial con QR no está activado para esta elección."}
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleOpenKiosk}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#459151]"
                      >
                        Abrir punto QR
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCopyKioskLink()}
                        disabled={creatingKioskLink}
                        className="rounded-lg bg-[#2E7D32] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#256b2b] disabled:opacity-60"
                      >
                        {creatingKioskLink ? "Generando..." : "Copiar enlace QR"}
                      </button>
                    </div>
                  </div>
                </CardShell>
              ) : null}

              {activeMoreView === "blockchain" ? (
                <CardShell title="Integridad verificable">
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2E7D32]">
                        Integridad verificable
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-gray-900">
                        Contrato inteligente publico
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        Revisa el contrato publico en BaseScan para contrastar la informacion de la votacion y sus resultados.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                      <p className="font-semibold">Manual rapido en BaseScan</p>
                      <ol className="mt-3 list-decimal space-y-2 pl-5">
                        <li>Copiar ID de eleccion.</li>
                        <li>Abrir contrato inteligente.</li>
                        <li>Entrar a <strong>Contract &gt; Read Contract</strong>.</li>
                        <li>Buscar <strong>getVoteInfo</strong> y usar <strong>Query / Read</strong>.</li>
                        <li>Buscar <strong>getVoteResults</strong> para contrastar resultados.</li>
                      </ol>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => void handleCopyElectionId()}
                        className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-[#459151]"
                      >
                        Copiar ID
                      </button>
                      {SMART_CONTRACT_URL ? (
                        <a
                          href={SMART_CONTRACT_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-[#2E7D32] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#256b2b]"
                        >
                          Ver contrato inteligente
                        </a>
                      ) : (
                        <span className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-500">
                          Contrato no configurado
                        </span>
                      )}
                    </div>
                    {electionIdCopyMessage ? (
                      <p className="text-sm text-gray-500">{electionIdCopyMessage}</p>
                    ) : null}
                  </div>
                </CardShell>
              ) : null}

              {activeMoreView === "news" ? (
                <CardShell title="Noticias">
                  {canCreateNews ? (
                    <div className="space-y-4">
                      <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        Crea una noticia o comunicado para esta votación.
                      </p>
                      <CreateNewsForm onSubmit={handleCreateNews} isLoading={creatingNews} />
                    </div>
                  ) : (
                    <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                      Las noticias se habilitan cuando la votación está publicada, activa o finalizada.
                    </p>
                  )}
                </CardShell>
              ) : null}

              {activeMoreView === "tvd" ? (
                <CardShell title="Uso $TVD">
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-800">
                      {tvdUsage.closingNotice}
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-1 shadow-sm">
                      <TvdAmountCard label="Reservado" amount={tvdUsage.reserved} />
                      <TvdAmountCard label="Consumido" amount={tvdUsage.consumed} />
                      <TvdAmountCard label="Liberado/devuelto" amount={tvdUsage.released} />
                      <div className="flex items-start justify-between gap-4 py-4">
                        <p className="text-sm font-semibold text-gray-600">
                          Estado actual
                        </p>
                        <p className="text-right text-base font-bold text-gray-900">
                          {tvdUsage.currentStatus}
                        </p>
                      </div>
                    </div>
                    {tvdCopyMessage ? (
                      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {tvdCopyMessage}
                      </div>
                    ) : null}
                    <div className="rounded-xl border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setTvdOperationsOpen((current) => !current)}
                        aria-expanded={tvdOperationsOpen}
                        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left font-semibold text-gray-900"
                      >
                        Operaciones asociadas
                        <ChevronDownIcon
                          aria-hidden="true"
                          className={`h-5 w-5 text-gray-500 transition ${
                            tvdOperationsOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {tvdOperationsOpen ? (
                        <div className="space-y-3 border-t border-gray-200 p-4">
                          {tvdUsage.operations.map((operation) => (
                            <article key={operation.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900">{operation.type}</p>
                                  <p className="mt-1 text-sm text-gray-500">
                                    {operation.date} - {operation.amount} / {operation.amountBs}
                                  </p>
                                  <p className="mt-1 font-mono text-xs text-gray-500">
                                    {abbreviateHash(operation.txHash)}
                                  </p>
                                </div>
                                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                                  <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                    {operation.status}
                                  </span>
                                  <div className="flex flex-wrap gap-2 sm:justify-end">
                                    <button
                                      type="button"
                                      aria-label={`Copiar txHash ${operation.type}`}
                                      onClick={async () => {
                                        const copied = await copyTextToClipboard(operation.txHash);
                                        setTvdCopyMessage(
                                          copied
                                            ? "txHash copiado."
                                            : "No se pudo copiar el txHash.",
                                        );
                                      }}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-[#459151] hover:text-[#2E6A38]"
                                    >
                                      <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
                                      Copiar
                                    </button>
                                    <a
                                      href={operation.explorerUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      aria-label={`Abrir explorer ${operation.type}`}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E7D32] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#256b2b]"
                                    >
                                      <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                                      Explorer
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardShell>
              ) : null}
            </div>
          </section>
        ) : null}

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

      <PadronCheckModal
        isOpen={isParticipationCheckModalOpen}
        onClose={() => setIsParticipationCheckModalOpen(false)}
        eventId={actualElectionId}
        mode="participation"
      />
      {canViewParticipationAnalytics ? (
        <ParticipationAnalyticsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
          eventId={actualElectionId}
          canDownloadReport={canViewParticipationAnalytics}
        />
      ) : null}
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
