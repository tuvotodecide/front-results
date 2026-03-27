import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import ConfigStepsTabs from "./components/ConfigStepsTabs";
import PositionsTable from "./components/PositionsTable";
import PartiesTable from "./components/PartiesTable";
import LoadedPadronView from "./components/LoadedPadronView";
import {
  useGetVotingEventQuery,
  useGetVotingEventsQuery,
  useGetEventRolesQuery,
  useGetEventOptionsQuery,
  useGetPadronVersionsQuery,
  useGetPadronVotersQuery,
  useGetEventResultsQuery,
  useLazyDownloadPadronCsvQuery,
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
import { useWallet } from "../../hooks/useWallet";

const roleToPosition = (role: EventRole): Position => ({
  id: role.id,
  name: role.name,
  electionId: role.eventId,
  createdAt: role.createdAt ?? new Date().toISOString(),
});

const optionToParty = (option: VotingOption): PartyWithCandidates => ({
  id: option.id,
  electionId: option.eventId,
  name: option.name,
  colorHex: option.color,
  logoUrl: option.logoUrl,
  createdAt: option.createdAt ?? new Date().toISOString(),
  candidates: (option.candidates ?? []).map((candidate: OptionCandidate) => ({
    id: candidate.id,
    partyId: option.id,
    positionId: candidate.roleName,
    positionName: candidate.roleName,
    fullName: candidate.name,
    photoUrl: candidate.photoUrl,
  })),
});

const formatDateTime = (value?: string | null) => {
  if (!value) return "No definida";
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const validateScheduleForm = (
  form: { votingStart: string; votingEnd: string; resultsPublishAt: string },
  enforceWindowRule: boolean,
) => {
  if (!form.votingStart.trim() || !form.votingEnd.trim() || !form.resultsPublishAt.trim()) {
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

  if (enforceWindowRule && votingStart.getTime() - Date.now() < TWENTY_FOUR_HOURS_MS) {
    return "La fecha de inicio debe poder modificarse hasta 24 horas antes de iniciar.";
  }

  return null;
};

const canEditSchedule = (event?: {
  state?: string | null;
  status?: string | null;
  votingStart?: string | null;
}) => {
  if (!event) return false;

  const state = event.state ?? event.status ?? "DRAFT";
  if (state === "DRAFT") return true;
  if (state !== "PUBLISHED" || !event.votingStart) return false;

  return new Date(event.votingStart).getTime() - Date.now() >= TWENTY_FOUR_HOURS_MS;
};

const getInitial = (value?: string | null) =>
  String(value ?? "").trim().charAt(0).toUpperCase() || "?";

const getBallotDescription = (lifecycle: string) =>
  lifecycle === "RESULTS" || lifecycle === "RESULTS_PUBLISHED" || lifecycle === "CLOSED"
    ? "Conoce a los candidatos y partidos políticos que participaron en esta votación."
    : "Conoce a los candidatos y partidos políticos que participan en esta votación.";

const deriveLifecycle = (event?: {
  status?: string | null;
  votingStart?: string | null;
  votingEnd?: string | null;
  resultsPublishAt?: string | null;
}) => {
  if (!event) return "DRAFT";
  const now = Date.now();
  const start = event.votingStart ? new Date(event.votingStart).getTime() : null;
  const end = event.votingEnd ? new Date(event.votingEnd).getTime() : null;
  const resultsAt = event.resultsPublishAt ? new Date(event.resultsPublishAt).getTime() : null;

  if (resultsAt && now >= resultsAt) return "RESULTS";
  if (start && end && now >= start && now <= end) return "ACTIVE";
  if (end && now > end) return "CLOSED";
  if (start && now < start) return "PUBLISHED";
  return event.status ?? "DRAFT";
};

const StatusBadge: React.FC<{ state?: string }> = ({ state }) => {
  const styles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
    PUBLISHED: "bg-blue-100 text-blue-700 border-blue-200",
    ACTIVE: "bg-amber-100 text-amber-700 border-amber-200",
    CLOSED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    RESULTS: "bg-violet-100 text-violet-700 border-violet-200",
    RESULTS_PUBLISHED: "bg-violet-100 text-violet-700 border-violet-200",
  };

  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicada",
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
}> = ({
  title,
  lines,
  action,
  note,
}) => (
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
  const [activeTab, setActiveTab] = useState<ConfigStep>(1);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
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
  const { data: padronVersions = [], isLoading: loadingPadronVersions } =
    useGetPadronVersionsQuery(actualElectionId, {
      skip: !actualElectionId,
    });
  const { data: padronData, isLoading: loadingPadronVoters } =
    useGetPadronVotersQuery(
      { eventId: actualElectionId, page, limit: 20 },
      { skip: !actualElectionId },
    );
  const lifecycle = deriveLifecycle(event);
  const shouldShowResults = lifecycle === "RESULTS";
  const { data: resultsData } = useGetEventResultsQuery(actualElectionId, {
    skip: !actualElectionId || !shouldShowResults,
  });
  const [updateEventSchedule, { isLoading: updatingSchedule }] =
    useUpdateEventScheduleMutation();
  const [downloadPadronCsv, { isFetching: downloadingCsv }] =
    useLazyDownloadPadronCsvQuery();

  const {
    connectionState,
    transactionState,
    connectWallet,
    resetTransactionState,
    callUpdateSchedule,
  } = useWallet();

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
  const scheduleEditable = canEditSchedule(event);

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

  const handleDownloadCsv = async () => {
    if (!currentPadron) return;

    const result = await downloadPadronCsv({
      eventId: actualElectionId,
      padronVersionId: currentPadron.padronVersionId,
    }).unwrap();

    const blob = new Blob([result.content], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    );

    if (scheduleValidationError) {
      setScheduleError(scheduleValidationError);
      return;
    }

    try {
      const votingStart = new Date(scheduleForm.votingStart).toISOString();
      const votingEnd = new Date(scheduleForm.votingEnd).toISOString();
      const resultsPublishAt = new Date(scheduleForm.resultsPublishAt).toISOString();

      await callUpdateSchedule(
        actualElectionId,
        votingStart,
        votingEnd,
        resultsPublishAt,
      );

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
      if (error.message === 'tx_canceled') {
        return;
      }
      setScheduleError(getRequestErrorMessage(error, "No se pudo actualizar el horario."));
    }
  };

  const connectMetamask = () => {
    if (
      connectionState === 'connecting' ||
      transactionState === 'pending'
    ) {
      return;
    }
    connectWallet();
  }

  const renderButtonText = () => {
    switch (connectionState) {
      case 'disconnected':
        return 'Conectarse a MetaMask para guardar horarios';
      case 'connecting':
        return 'Conectando...';
      case 'notInstalled':
        return 'Instale la extensión MetaMask para guardar horarios';
      case 'connected':
        return updatingSchedule ? 'Guardando...' : 'Guardar horarios';
      default:
        return 'Conectarse a MetaMask para guardar horarios';
    }
  }

  const isUpdateButtonDisabled = () => {
    return (
      updatingSchedule ||
      connectionState === 'connecting' ||
      connectionState === 'notInstalled' ||
      transactionState === 'pending'
    );
  }

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
            <button
              type="button"
              onClick={() => navigate("/elections")}
              className="mb-4 text-sm font-medium text-[#459151] hover:underline"
            >
              Volver a mis votaciones
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{event?.name}</h1>
            <p className="mt-2 max-w-3xl text-gray-600">{event?.objective}</p>
            <div className="mt-4">
              <StatusBadge state={lifecycle} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TopInfoCard
            title="Horario de Votación"
            note={
              scheduleEditable
                ? "Puedes modificarlo mientras siga en borrador o si faltan al menos 24 horas para el inicio."
                : "El cronograma ya no puede modificarse porque la votación está muy próxima o ya comenzó."
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
              { label: "Desde", value: formatDateTime(event?.votingStart) },
              { label: "Hasta", value: formatDateTime(event?.votingEnd) },
              { label: "Resultados", value: formatDateTime(event?.resultsPublishAt) },
            ]}
          />
          <TopInfoCard
            title="Estado Actual"
            lines={[
              {
                label: "Estado",
                value:
                  lifecycle === "RESULTS"
                    ? "Resultados disponibles"
                    : lifecycle === "CLOSED"
                      ? "Finalizada"
                      : lifecycle === "ACTIVE"
                        ? "En votación"
                        : lifecycle === "PUBLISHED"
                          ? "Próxima"
                          : "Borrador",
              },
            ]}
          />
        </div>

        {scheduleSuccess ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {scheduleSuccess}
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
                onClick={() => navigate(`/elections/${actualElectionId}/public`)}
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
                fileName: currentPadron.fileName,
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
              onPageChange={setPage}
              onSearchChange={setSearchTerm}
              onDownloadCsv={handleDownloadCsv}
              loading={loadingPadronVoters}
              downloading={downloadingCsv}
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
              <p className="mt-1 text-gray-600">{getBallotDescription(lifecycle)}</p>
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
                      className="h-2"
                      style={{ backgroundColor: party.colorHex }}
                    />
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
                  onClick={() => navigate(`/elections/${item.id}/status`)}
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
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            El backend solo permite editar el cronograma en borrador o cuando faltan al menos 24
            horas para el inicio de la votación.
          </div>

          {scheduleError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {scheduleError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Inicio de votación</span>
              <input
                type="datetime-local"
                value={scheduleForm.votingStart}
                onChange={(event) => handleScheduleInputChange("votingStart", event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/15"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Fin de votación</span>
              <input
                type="datetime-local"
                value={scheduleForm.votingEnd}
                onChange={(event) => handleScheduleInputChange("votingEnd", event.target.value)}
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
                  handleScheduleInputChange("resultsPublishAt", event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#459151] focus:ring-2 focus:ring-[#459151]/15"
              />
            </label>
          </div>

          <p className="text-sm text-gray-500">
            El sistema no está enviando una notificación automática al padrón cuando este horario
            cambia. Si eso debe ser obligatorio, hay que agregarlo en backend.
          </p>

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
              onClick={connectionState === 'disconnected' ? connectMetamask : handleScheduleSave}
              disabled={isUpdateButtonDisabled()}
              className="rounded-lg bg-[#459151] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3a7a44] disabled:cursor-not-allowed disabled:opacity-60"
            >
              { renderButtonText() }
            </button>
          </div>
        </div>
      </Modal2>

      <Modal2
        isOpen={transactionState == 'canceled'}
        onClose={resetTransactionState}
        title='Operación cancelada'
        type='info'
        showClose
        closeOnEscape
      >
        Operación cancelada por el usuario. No se ha actualizado el horario.
      </Modal2>

      <Modal2
        isOpen={transactionState == 'error'}
        onClose={resetTransactionState}
        title='Operación fallida'
        type='error'
        showClose
        closeOnEscape
      >
        Operación fallida. No se ha actualizado el horario. Intenta nuevamente o contacta al soporte si el problema persiste.
      </Modal2>
    </div>
  );
};

export default ActiveElectionStatusPage;
