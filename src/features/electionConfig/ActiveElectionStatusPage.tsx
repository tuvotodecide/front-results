import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "../../store/votingEvents";
import type { ConfigStep, PartyWithCandidates, Position, Voter } from "./types";
import type {
  EventRole,
  VotingOption,
  OptionCandidate,
} from "../../store/votingEvents/types";
import { selectTenantId } from "../../store/auth/authSlice";
import { useSelector } from "react-redux";

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
  candidates: option.candidates.map((candidate: OptionCandidate) => ({
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
  if (end && now > end) return "FINISHED";
  if (start && now < start) return "PUBLISHED";
  return event.status ?? "DRAFT";
};

const StatusBadge: React.FC<{ state?: string }> = ({ state }) => {
  const styles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
    PUBLISHED: "bg-blue-100 text-blue-700 border-blue-200",
    ACTIVE: "bg-amber-100 text-amber-700 border-amber-200",
    FINISHED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    RESULTS: "bg-violet-100 text-violet-700 border-violet-200",
  };

  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicada",
    ACTIVE: "En votación",
    FINISHED: "Finalizada",
    RESULTS: "Resultados disponibles",
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

const TopInfoCard: React.FC<{ title: string; lines: Array<{ label: string; value: string }> }> = ({
  title,
  lines,
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
    <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
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
  const [downloadPadronCsv, { isFetching: downloadingCsv }] =
    useLazyDownloadPadronCsvQuery();

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
            lines={[
              { label: "Desde", value: formatDateTime(event?.votingStart) },
              { label: "Hasta", value: formatDateTime(event?.votingEnd) },
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
                    : lifecycle === "FINISHED"
                      ? "Finalizada"
                      : lifecycle === "ACTIVE"
                        ? "En votación"
                        : lifecycle === "PUBLISHED"
                          ? "Próxima / publicada"
                          : "Borrador",
              },
              { label: "Resultados", value: formatDateTime(event?.resultsPublishAt) },
            ]}
          />
        </div>

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
            <p className="mt-4 text-sm text-violet-800">
              Total registrado:{" "}
              <span className="font-bold">
                {resultsData.roles.reduce((sum, role) => sum + Number(role.total || 0), 0)}
              </span>
            </p>
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
              <p className="mt-1 text-gray-600">
                Conoce a los candidatos y partidos políticos que participan en
                esta elección.
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
                            {party.name.charAt(0)}
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
                                {candidate.fullName.charAt(0)}
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
    </div>
  );
};

export default ActiveElectionStatusPage;
