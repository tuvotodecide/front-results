"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import LocationSection from "@/features/results/components/LocationSection";
import {
  useGetBallotByTableCodeQuery,
  useGetBallotQuery,
} from "@/store/ballots/ballotsEndpoints";
import Graphs from "@/features/results/components/Graphs";
import StatisticsBars from "@/features/results/components/StatisticsBars";
import SimpleSearchBar from "@/components/SimpleSearchBar";
import { setCurrentBallot } from "@/store/resultados/resultadosSlice";
import { useGetAttestationsByBallotIdQuery } from "@/store/attestations/attestationsEndpoints";
import { getPartyColor } from "@/features/results/lib/partyColors";
import useElectionConfig from "@/hooks/useElectionConfig";
import useElectionId from "@/hooks/useElectionId";
import {
  getResultsLabels,
  type ResultsElectionType,
} from "@/features/results/lib/resultsLabels";
import { FIVE_MINUTES_MS } from "@/utils/electionAutoRefreshWindow";
import { publicEnv } from "@/shared/env/public";
import { useBrowserSearchParams } from "@/shared/routing/browserLocation";
import BrowserBackButton from "@/shared/routing/BrowserBackButton";

interface ResultsImagePageProps {
  id?: string;
}

type ChartDatum = { name: string; value: number; color: string };

export default function ResultsImagePage({
  id,
}: Readonly<ResultsImagePageProps>) {
  const router = useRouter();
  const electionId = useElectionId();
  const dispatch = useDispatch();
  const searchParams = useBrowserSearchParams();
  const {
    election,
    hasActiveConfig,
    isVotingPeriod: isPreliminaryPhase,
    isResultsPeriod: isFinalPhase,
    isAutoRefreshWindow,
  } = useElectionConfig();

  const electionTypeFromUrl = searchParams.get("electionType");
  const currentSearch = searchParams.toString();
  const resultsImageBackTarget = currentSearch
    ? `/resultados/imagen?${currentSearch}`
    : "/resultados/imagen";
  const resolvedElectionType: ResultsElectionType =
    electionTypeFromUrl === "municipal" ||
    electionTypeFromUrl === "departamental" ||
    electionTypeFromUrl === "presidential" ||
    electionTypeFromUrl === "mayor" ||
    electionTypeFromUrl === "governor"
      ? electionTypeFromUrl
      : election?.type || "presidential";

  const resultsLabels = getResultsLabels(resolvedElectionType);

  const { data: currentItem, isError: isBallotError } = useGetBallotQuery(id!, {
    skip: !id,
    pollingInterval: isAutoRefreshWindow ? FIVE_MINUTES_MS : 0,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skipPollingIfUnfocused: true,
  });

  const { data: attestationsData } = useGetAttestationsByBallotIdQuery(id!, {
    skip: !id,
    pollingInterval: isAutoRefreshWindow ? FIVE_MINUTES_MS : 0,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skipPollingIfUnfocused: true,
  });

  const { data: tableBallots } = useGetBallotByTableCodeQuery(
    {
      tableCode: currentItem?.tableCode || "",
      electionId: currentItem?.electionId || electionId || undefined,
    },
    {
      skip: !currentItem?.tableCode,
      pollingInterval: isAutoRefreshWindow ? FIVE_MINUTES_MS : 0,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      skipPollingIfUnfocused: true,
    },
  );

  const handleSearch = (searchTerm: string) => {
    const term = (searchTerm || "").trim();
    if (!term) return;

    const query = searchParams.toString();
    const nextUrl = query
      ? `/resultados/imagen/${term}?${query}`
      : `/resultados/imagen/${term}`;

    router.push(nextUrl);
  };

  const [presidentialData, setPresidentialData] = useState<ChartDatum[]>([]);
  const [deputiesData, setDeputiesData] = useState<ChartDatum[]>([]);
  const [participation, setParticipation] = useState<ChartDatum[]>([]);

  const shouldRenderSecondaryResults =
    resolvedElectionType === "municipal" ||
    resolvedElectionType === "mayor" ||
    resolvedElectionType === "departamental" ||
    resolvedElectionType === "governor" ||
    deputiesData.length > 0;

  const { attestationsInFavor, attestationsAgainst } = useMemo(() => {
    if (!attestationsData) {
      return { attestationsInFavor: 0, attestationsAgainst: 0 };
    }

    const inFavor = attestationsData.filter(
      (attestation: { support: boolean }) => attestation.support === true,
    ).length;
    const totalBallotsForTable = tableBallots?.length ?? 0;
    const against = Math.max(totalBallotsForTable - 1, 0);

    return { attestationsInFavor: inFavor, attestationsAgainst: against };
  }, [attestationsData, tableBallots]);

  useEffect(() => {
    if (!currentItem) return;

    const partyVotes = currentItem?.votes?.parties?.partyVotes ?? [];
    const formattedPresidentialData = partyVotes.map((item) => {
      const partyColor = getPartyColor(item.partyId);
      const randomColor =
        "#" + Math.floor(Math.random() * 16777215).toString(16);
      return {
        name: item.partyId,
        value: Number(item.votes ?? 0),
        color: partyColor || randomColor,
      };
    });
    setPresidentialData(formattedPresidentialData);

    const deputiesVotes = currentItem?.votes?.deputies?.partyVotes ?? [];
    const formattedDeputiesData = deputiesVotes.map((item) => {
      const partyColor = getPartyColor(item.partyId);
      const randomColor =
        "#" + Math.floor(Math.random() * 16777215).toString(16);
      return {
        name: item.partyId,
        value: Number(item.votes ?? 0),
        color: partyColor || randomColor,
      };
    });
    setDeputiesData(formattedDeputiesData);

    const validVotes = Number(currentItem?.votes?.parties?.validVotes ?? 0);
    const nullVotes = Number(currentItem?.votes?.parties?.nullVotes ?? 0);
    const blankVotes = Number(currentItem?.votes?.parties?.blankVotes ?? 0);

    setParticipation([
      { name: "Válidos", value: validVotes, color: "#8cc689" },
      { name: "Nulos", value: nullVotes, color: "#81858e" },
      { name: "Blancos", value: blankVotes, color: "#f3f3ce" },
    ]);
  }, [currentItem]);

  useEffect(() => {
    if (id) {
      dispatch(setCurrentBallot(id));
    }
  }, [dispatch, id]);

  return (
    <div className="outer-container min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl">
        <h1 className="mb-8 text-2xl font-bold text-gray-800 md:text-3xl">
          Resultados por Imagen
        </h1>

        {!id ? (
          <div className="rounded-lg border border-gray-200 bg-white px-8 py-16 shadow-md">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-4">
                <svg
                  className="h-12 w-12 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h1 className="mb-4 text-2xl font-semibold text-gray-700 md:text-3xl">
                Introduzca el ID de la imagen
              </h1>
              <p className="mb-8 text-gray-500">
                Busque los resultados por ID de imagen específico
              </p>
              <SimpleSearchBar className="w-full max-w-md" onSearch={handleSearch} />
            </div>
          </div>
        ) : isBallotError ? (
          <div
            data-cy="ballot-not-found"
            className="rounded-lg border border-red-200 bg-white px-8 py-16 shadow-md"
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-red-50 p-4">
                <svg
                  className="h-12 w-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="mb-4 text-2xl font-semibold text-gray-700 md:text-3xl">
                No se encontró la imagen "{id}"
              </h1>
              <p className="mb-8 text-lg text-gray-500">
                Por favor, verifique el ID e intente con una imagen diferente
              </p>
              <SimpleSearchBar className="w-full max-w-md" onSearch={handleSearch} />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-md">
            <div className="rounded-t-lg bg-gray-800 p-6 text-white">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <BrowserBackButton
                    className="flex-shrink-0 text-white hover:text-gray-300"
                    to={resultsImageBackTarget}
                  />
                  <div className="min-w-0 flex-1">
                    <h1 className="break-words text-2xl font-semibold md:text-3xl">
                      Imagen {id}
                    </h1>
                    <p className="mt-1 break-words text-gray-300">
                      Codigo mesa: {currentItem?.tableCode || ""}
                    </p>
                  </div>
                </div>
                <SimpleSearchBar
                  className="w-full lg:ml-auto lg:w-auto lg:shrink-1"
                  onSearch={handleSearch}
                />
              </div>
            </div>

            <div className="inner-container">
              <div className="flex flex-row flex-wrap gap-4">
                <div className="mb-4 basis-[450px] grow-2 shrink-1 rounded-lg border border-gray-200 p-6">
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                    Ubicación
                  </h3>
                  <LocationSection
                    department={currentItem?.location?.department || ""}
                    province={currentItem?.location?.province || ""}
                    municipality={currentItem?.location?.municipality || ""}
                    electoralLocation={
                      currentItem?.location?.electoralLocationName || ""
                    }
                    electoralSeat={currentItem?.location?.electoralSeat || ""}
                  />
                </div>
                <div className="mb-4 basis-[300px] grow-1 shrink-0 rounded-lg border border-gray-200 p-6">
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                    Datos Mesa
                  </h3>
                  <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                    <div className="flex min-w-0 flex-shrink-0 items-start gap-3">
                      <div className="min-w-0">
                        <h3 className="mb-1 text-sm font-medium uppercase tracking-wide text-gray-600">
                          Numero de mesa
                        </h3>
                        <p className="break-words text-base font-normal leading-relaxed text-gray-900">
                          {currentItem?.tableNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-shrink-0 items-start gap-3">
                      <div className="min-w-0">
                        <h3 className="mb-1 text-sm font-medium uppercase tracking-wide text-gray-600">
                          Codigo de mesa
                        </h3>
                        <p className="break-words text-base font-normal leading-relaxed text-gray-900">
                          {currentItem?.tableCode || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  {currentItem?.hasObservation && (
                    <div className="mt-5 border-t border-amber-100 pt-4">
                      <h3 className="mb-1 text-sm font-medium uppercase tracking-wide text-amber-700">
                        Observación:
                      </h3>
                      <p className="text-sm font-semibold text-amber-800">
                        {currentItem.observationText}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4 flex flex-row flex-wrap gap-4">
                <div className="basis-[450px] grow-2 shrink-1 rounded-lg border border-gray-200 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-800">
                    Atestiguamientos
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-r-lg border-l-4 border-green-500 bg-green-50 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="mb-1 text-sm font-medium text-green-800">
                            A favor
                          </h4>
                          <p className="text-3xl font-bold text-green-900">
                            {attestationsInFavor}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-r-lg border-l-4 border-red-500 bg-red-50 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="mb-1 text-sm font-medium text-red-800">
                            En contra
                          </h4>
                          <p className="text-3xl font-bold text-red-900">
                            {attestationsAgainst}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 border-t border-gray-100 pt-4">
                    <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-700">
                      Detalle de Testigos
                    </h4>
                    <div className="custom-scrollbar max-h-[300px] space-y-2 overflow-y-auto pr-2">
                      {attestationsData && attestationsData.length > 0 ? (
                        attestationsData.map((att) => (
                          <div
                            key={att._id}
                            className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 transition-colors hover:bg-white"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${
                                  att.support ? "bg-green-500" : "bg-red-500"
                                }`}
                              >
                                {"U"}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  {`Usuario #${att._id.slice(-4)}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(att.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                                  att.support
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {att.support ? "Validado" : "Rechazado"}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="py-4 text-center text-sm italic text-gray-400">
                          No hay registros detallados disponibles.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="basis-[300px] grow-1 shrink-1 rounded-lg border border-gray-200 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-800">
                    Contratos Inteligentes
                  </h3>
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-gray-700">
                      Acciones disponibles
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {currentItem?.image && (
                        <a
                          data-cy="ipfs-image-link"
                          href={`https://ipfs.io/ipfs/${currentItem.image.replace(
                            "ipfs://",
                            "",
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center text-sm font-medium text-slate-700 no-underline rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100"
                        >
                          Imagen
                        </a>
                      )}
                      {currentItem?.ipfsUri && (
                        <a
                          data-cy="link-metadata"
                          href={currentItem.ipfsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center text-sm font-medium text-slate-700 no-underline rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100"
                        >
                          Metadata
                        </a>
                      )}
                      {currentItem?.recordId && (
                        <a
                          data-cy="link-nft"
                          href={`${publicEnv.baseNftUrl}${currentItem.recordId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center text-sm font-medium text-slate-700 no-underline rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100"
                        >
                          NFT
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {election && hasActiveConfig && !isPreliminaryPhase && !isFinalPhase ? (
                <div className="rounded-lg border border-gray-200 p-8 text-center">
                  <p className="mb-4 text-xl text-gray-600">
                    Los resultados se habilitarán el:
                  </p>
                  <div className="mb-2">
                    <p className="mb-1 text-2xl text-gray-700">
                      {new Date(election.resultsStartDateBolivia).toLocaleDateString(
                        "es-ES",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          timeZone: "America/La_Paz",
                        },
                      )}
                    </p>
                    <p className="text-3xl font-bold text-gray-800">
                      {new Date(election.resultsStartDateBolivia).toLocaleTimeString(
                        "es-ES",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "America/La_Paz",
                        },
                      )}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">(Hora de Bolivia)</p>
                  </div>
                </div>
              ) : presidentialData.length === 0 ? (
                <div className="rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-xl text-gray-600">Sin datos</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 rounded-lg border border-gray-200 p-6">
                    <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                      <span>Participación</span>
                      {isPreliminaryPhase && (
                        <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-orange-700">
                          Resultados preliminares
                        </span>
                      )}
                    </h3>
                    <StatisticsBars
                      title="Distribución de votos"
                      voteData={participation}
                      processedTables={{
                        current: currentItem?.tableCode ? 1 : 0,
                        total: currentItem?.tableCode ? Math.max(tableBallots?.length ?? 1, 1) : 0,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                        <span>{resultsLabels.primary}</span>
                        {isPreliminaryPhase && (
                          <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-orange-700">
                            Preliminares
                          </span>
                        )}
                      </h3>
                      <Graphs data={presidentialData} />
                    </div>

                    {shouldRenderSecondaryResults && (
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                          <span>{resultsLabels.secondary}</span>
                          {isPreliminaryPhase && (
                            <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-orange-700">
                              Preliminares
                            </span>
                          )}
                        </h3>
                        {deputiesData.length > 0 ? (
                          <Graphs data={deputiesData} />
                        ) : (
                          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
                            Sin datos
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
