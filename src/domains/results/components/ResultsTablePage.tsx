"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import LocationSection from "@/features/results/components/LocationSection";
import Graphs from "@/features/results/components/Graphs";
import ImagesSection from "@/features/results/components/ImagesSection";
import {
  useGetElectoralTableByTableCodeQuery,
} from "@/store/electoralTables/electoralTablesEndpoints";
import {
  useLazyGetLiveResultsByLocationQuery,
  useLazyGetResultsByLocationQuery,
  type ResultsByLocationResponse,
} from "@/store/resultados/resultadosEndpoints";
import SimpleSearchBar from "@/components/SimpleSearchBar";
import StatisticsBars from "@/features/results/components/StatisticsBars";
import { useLazyGetBallotByTableCodeQuery } from "@/store/ballots/ballotsEndpoints";
import type { BallotType, ElectoralTableType } from "@/types";
import useElectionConfig from "@/hooks/useElectionConfig";
import {
  selectFilters,
  setCurrentTable,
} from "@/store/resultados/resultadosSlice";
import { getPartyColor } from "@/features/results/lib/partyColors";
import {
  useGetAttestationCasesByTableCodeQuery,
  useGetMostSupportedBallotByTableCodeQuery,
} from "@/store/attestations/attestationsEndpoints";
import Breadcrumb2 from "@/components/Breadcrumb2";
import { useGetDepartmentsQuery } from "@/store/departments/departmentsEndpoints";
import TablesSection from "@/features/results/components/TablesSection";
import { useCountedBallots } from "@/hooks/useCountedBallots";
import {
  getResultsLabels,
  type ResultsElectionType,
} from "@/features/results/lib/resultsLabels";
import useElectionId from "@/hooks/useElectionId";
import useAutoRefreshTick from "@/hooks/useAutoRefreshTick";
import { FIVE_MINUTES_MS } from "@/utils/electionAutoRefreshWindow";
import { buildResultsTableLink } from "@/utils/resultsTableLink";
import { usePublicResultsScope } from "@/hooks/usePublicResultsScope";
import { useBrowserSearchParams } from "@/shared/routing/browserLocation";
import BrowserNavLink from "@/shared/routing/BrowserNavLink";
import BrowserBackButton from "@/shared/routing/BrowserBackButton";

interface ResultsTablePageProps {
  tableCode?: string;
}

type ChartDatum = { name: string; value: number; color: string };

const toChartData = (data: ResultsByLocationResponse): ChartDatum[] =>
  (data.results ?? []).map((item) => {
    const partyColor = getPartyColor(item.partyId);
    const randomColor =
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0");
    return {
      name: item.partyId,
      value: item.totalVotes,
      color: partyColor || randomColor,
    };
  });

export default function ResultsTablePage({
  tableCode,
}: Readonly<ResultsTablePageProps>) {
  const router = useRouter();
  const electionId = useElectionId();
  const dispatch = useDispatch();
  const searchParams = useBrowserSearchParams();
  const filters = useSelector(selectFilters);

  const [getResultsByLocation] = useLazyGetResultsByLocationQuery();
  const [getLiveResultsByLocation] = useLazyGetLiveResultsByLocationQuery();
  const [getBallotsByTableCode] = useLazyGetBallotByTableCodeQuery();

  const [presidentialData, setPresidentialData] = useState<ChartDatum[]>([]);
  const [deputiesData, setDeputiesData] = useState<ChartDatum[]>([]);
  const [participation, setParticipation] = useState<ChartDatum[]>([]);
  const [otherTables, setOtherTables] = useState<ElectoralTableType[]>([]);
  const [filteredTables, setFilteredTables] = useState<ElectoralTableType[]>([]);
  const [images, setImages] = useState<BallotType[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [showAllTables, setShowAllTables] = useState(false);
  const [showAllFilteredTables, setShowAllFilteredTables] = useState(false);

  const {
    election,
    hasActiveConfig,
    isVotingPeriod: isPreliminaryPhase,
    isResultsPeriod: isFinalPhase,
    isAutoRefreshWindow,
  } = useElectionConfig();

  const electionTypeFromUrl = searchParams.get("electionType");
  const currentSearch = searchParams.toString();
  const resultsMesaBackTarget = currentSearch
    ? `/resultados/mesa?${currentSearch}`
    : "/resultados/mesa";
  const resolvedElectionId = electionId ?? undefined;
  const resolvedElectionType: ResultsElectionType =
    electionTypeFromUrl === "municipal" ||
    electionTypeFromUrl === "departamental" ||
    electionTypeFromUrl === "presidential" ||
    electionTypeFromUrl === "mayor" ||
    electionTypeFromUrl === "governor"
      ? electionTypeFromUrl
      : election?.type || "presidential";
  const searchElectoralLocationId =
    searchParams.get("electoralLocation") || undefined;
  const resultsContext = useMemo(
    () => ({
      electionId: resolvedElectionId,
      electionType: resolvedElectionType,
      departmentId: searchParams.get("department"),
      provinceId: searchParams.get("province"),
      municipalityId: searchParams.get("municipality"),
      electoralSeatId: searchParams.get("electoralSeat"),
      electoralLocationId: searchParams.get("electoralLocation"),
    }),
    [resolvedElectionId, resolvedElectionType, searchParams],
  );

  const publicScope = usePublicResultsScope({
    electionId: resolvedElectionId,
    electionType: resolvedElectionType,
  });
  const shouldBlockForPublicScope =
    !tableCode &&
    publicScope.isPublic &&
    !publicScope.isLoading &&
    !publicScope.isScopeValid;

  const primaryElectionType = useMemo(() => {
    if (resolvedElectionType === "municipal" || resolvedElectionType === "mayor") {
      return "municipal";
    }
    if (
      resolvedElectionType === "departamental" ||
      resolvedElectionType === "governor"
    ) {
      return "departamental";
    }
    return "presidential";
  }, [resolvedElectionType]);

  const secondaryElectionType = useMemo(() => {
    if (resolvedElectionType === "municipal" || resolvedElectionType === "mayor") {
      return "council";
    }
    if (
      resolvedElectionType === "departamental" ||
      resolvedElectionType === "governor"
    ) {
      return "assembly";
    }
    return "deputies";
  }, [resolvedElectionType]);

  const shouldRenderSecondaryResults =
    resolvedElectionType === "municipal" ||
    resolvedElectionType === "mayor" ||
    resolvedElectionType === "departamental" ||
    resolvedElectionType === "governor" ||
    deputiesData.length > 0;

  const {
    tables: countedTables,
    isLoading: countedBallotsLoading,
    isError: countedBallotsError,
    total: countedBallotsTotal,
  } = useCountedBallots({
    electionType: primaryElectionType,
    electionId: resolvedElectionId,
    department: filters.department,
    province: filters.province,
    municipality: filters.municipality,
    electoralLocation: searchElectoralLocationId,
    page: 1,
    limit: 20,
    isLiveMode: isPreliminaryPhase && !isFinalPhase,
    enablePolling: isAutoRefreshWindow,
    skip:
      !!tableCode ||
      !hasActiveConfig ||
      (!isPreliminaryPhase && !isFinalPhase) ||
      shouldBlockForPublicScope,
  });

  const resultsLabels = getResultsLabels(resolvedElectionType);
  const refreshTick = useAutoRefreshTick({
    enabled:
      hasActiveConfig &&
      (isPreliminaryPhase || isFinalPhase) &&
      isAutoRefreshWindow,
    intervalMs: FIVE_MINUTES_MS,
  });

  useGetDepartmentsQuery({ limit: 100 });

  const { data: mostSupportedBallotData } =
    useGetMostSupportedBallotByTableCodeQuery(
      { tableCode: tableCode || "", electionId: resolvedElectionId },
      {
        skip: !tableCode,
        pollingInterval: isAutoRefreshWindow ? FIVE_MINUTES_MS : 0,
        refetchOnFocus: true,
        refetchOnReconnect: true,
        skipPollingIfUnfocused: true,
      },
    );

  const { data: attestationCases } = useGetAttestationCasesByTableCodeQuery(
    { tableCode: tableCode || "", electionId: resolvedElectionId },
    {
      skip: !tableCode,
      pollingInterval: isAutoRefreshWindow ? FIVE_MINUTES_MS : 0,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      skipPollingIfUnfocused: true,
    },
  );

  const {
    data: electoralTableData,
    isError: isElectoralTableError,
    isLoading: isElectoralTableLoading,
    isFetching: isElectoralTableFetching,
  } = useGetElectoralTableByTableCodeQuery(tableCode || "", {
    skip: !tableCode,
  });

  const currentElectoralLocationId =
    electoralTableData?.electoralLocation?._id || undefined;

  const { tables: otherCountedTables } = useCountedBallots({
    electionType: primaryElectionType,
    electionId: resolvedElectionId,
    electoralLocation: currentElectoralLocationId,
    page: 1,
    limit: 200,
    isLiveMode: isPreliminaryPhase && !isFinalPhase,
    enablePolling: isAutoRefreshWindow,
    skip:
      !tableCode ||
      !currentElectoralLocationId ||
      !hasActiveConfig ||
      (!isPreliminaryPhase && !isFinalPhase) ||
      shouldBlockForPublicScope,
  });

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm) return;

    router.push(buildResultsTableLink(searchTerm, resultsContext));
  };

  useEffect(() => {
    if (!tableCode || !resolvedElectionId) return;

    getBallotsByTableCode({ tableCode, electionId: resolvedElectionId })
      .unwrap()
      .then((data: BallotType[]) => {
        setImages(data);
      })
      .catch((err) => {
        console.error("Error obteniendo actas:", err);
        setImages([]);
      });
  }, [tableCode, resolvedElectionId, getBallotsByTableCode]);

  useEffect(() => {
    if (!tableCode || !resolvedElectionId) return;

    if (!hasActiveConfig || (!isPreliminaryPhase && !isFinalPhase)) {
      setPresidentialData([]);
      setDeputiesData([]);
      setParticipation([]);
      setResultsLoading(false);
      return;
    }

    if (publicScope.isLoading) {
      setPresidentialData([]);
      setDeputiesData([]);
      setParticipation([]);
      setResultsLoading(true);
      return;
    }

    if (shouldBlockForPublicScope) {
      setPresidentialData([]);
      setDeputiesData([]);
      setParticipation([]);
      setResultsLoading(false);
      return;
    }

    const fetcher = isFinalPhase
      ? getResultsByLocation
      : getLiveResultsByLocation;

    let isActive = true;
    setResultsLoading(true);
    setPresidentialData([]);
    setDeputiesData([]);
    setParticipation([]);

    const presidentialPromise = fetcher({
      tableCode,
      electionType: primaryElectionType,
      electionId: resolvedElectionId,
    })
      .unwrap()
      .then((data) => {
        if (!isActive) return;
        setPresidentialData(toChartData(data));

        if (data.summary) {
          setParticipation([
            { name: "Válidos", value: data.summary.validVotes || 0, color: "#8cc689" },
            { name: "Nulos", value: data.summary.nullVotes || 0, color: "#81858e" },
            { name: "Blancos", value: data.summary.blankVotes || 0, color: "#f3f3ce" },
          ]);
        } else {
          setParticipation([]);
        }
      })
      .catch((err) => {
        if (!isActive) return;
        console.error("Error obteniendo resultados del bloque principal:", err);
        setPresidentialData([]);
        setParticipation([]);
      });

    const deputiesPromise = fetcher({
      tableCode,
      electionType: secondaryElectionType,
      electionId: resolvedElectionId,
    })
      .unwrap()
      .then((data) => {
        if (!isActive) return;
        setDeputiesData(toChartData(data));
      })
      .catch((err) => {
        if (!isActive) return;
        console.error("Error obteniendo resultados del bloque secundario:", err);
        setDeputiesData([]);
      });

    Promise.allSettled([presidentialPromise, deputiesPromise]).finally(() => {
      if (isActive) {
        setResultsLoading(false);
      }
    });

    return () => {
      isActive = false;
    };
  }, [
    refreshTick,
    tableCode,
    electoralTableData,
    resolvedElectionId,
    primaryElectionType,
    secondaryElectionType,
    hasActiveConfig,
    isPreliminaryPhase,
    isFinalPhase,
    isAutoRefreshWindow,
    publicScope.isLoading,
    shouldBlockForPublicScope,
    getResultsByLocation,
    getLiveResultsByLocation,
  ]);

  useEffect(() => {
    if (!tableCode) {
      setOtherTables([]);
      return;
    }

    setOtherTables(
      otherCountedTables.filter(
        (table: ElectoralTableType) =>
          !!table.tableCode && table.tableCode !== tableCode,
      ),
    );
  }, [otherCountedTables, tableCode]);

  useEffect(() => {
    if (tableCode) {
      dispatch(setCurrentTable(tableCode));
    }
  }, [dispatch, tableCode]);

  useEffect(() => {
    if (!searchElectoralLocationId) {
      setFilteredTables([]);
      return;
    }

    setFilteredTables(countedTables);
  }, [countedTables, searchElectoralLocationId]);

  return (
    <div className="outer-container min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl">
        <h1 className="mb-8 text-2xl font-bold text-gray-800 md:text-3xl">
          Resultados por Mesa
        </h1>

        {!tableCode ? (
          <div className="inner-container rounded-lg border border-gray-200 bg-gray-50">
            <Breadcrumb2 autoOpen={false} />

            {filteredTables.length > 0 ? (
              <div className="mt-6 rounded-lg bg-gray-50 p-4 shadow-sm">
                <h3 className="mb-4 border-b border-gray-200 pb-3 text-xl font-bold text-gray-800">
                  Mesas encontradas ({filteredTables.length})
                </h3>
                <div
                  className={`grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${
                    !showAllFilteredTables && filteredTables.length > 15
                      ? "max-h-[calc(3*10rem+2*0.75rem)] overflow-hidden"
                      : ""
                  }`}
                >
                  {filteredTables.map((table) => (
                    <BrowserNavLink
                      key={table._id}
                      href={buildResultsTableLink(table.tableCode, resultsContext)}
                      className="block rounded-lg border border-gray-300 p-4 transition-all duration-200 hover:border-blue-400 hover:bg-gray-50 hover:shadow-md"
                    >
                      <div className="text-center">
                        <div className="mb-1 text-sm font-medium uppercase tracking-wide text-gray-600">
                          Mesa
                        </div>
                        <div className="mb-2 text-lg font-semibold text-gray-900">
                          #{table.tableNumber}
                        </div>
                        <div
                          className="break-words text-xs text-gray-500"
                          title={table.tableCode}
                        >
                          {table.tableCode}
                        </div>
                      </div>
                    </BrowserNavLink>
                  ))}
                </div>
                {filteredTables.length > 15 && (
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllFilteredTables(!showAllFilteredTables)}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900"
                    >
                      {showAllFilteredTables ? "Mostrar menos" : `Mostrar todas (${filteredTables.length} mesas)`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mt-6 rounded-lg border border-gray-200 bg-white px-8 py-16 shadow-md">
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
                      Buscar Mesa Electoral
                    </h1>
                    <p className="mb-8 text-gray-500">
                      Use los filtros territoriales arriba o busque directamente por código de mesa
                    </p>
                    <SimpleSearchBar className="w-full max-w-md" onSearch={handleSearch} />
                  </div>
                </div>

                {hasActiveConfig && (isPreliminaryPhase || isFinalPhase) && (
                  <div className="mt-6 rounded-lg bg-gray-50 p-4 shadow-sm">
                    <h3 className="mb-4 border-b border-gray-200 pb-3 text-xl font-bold text-gray-800">
                      {(() => {
                        const modeLabel = isPreliminaryPhase ? "Preliminares" : "Finales";
                        if (filters.municipality) {
                          return `Mesas con Resultados ${modeLabel} - ${filters.municipality}`;
                        }
                        if (filters.province) {
                          return `Mesas con Resultados ${modeLabel} - ${filters.province}`;
                        }
                        if (filters.department) {
                          return `Mesas con Resultados ${modeLabel} - ${filters.department}`;
                        }
                        return `Mesas con Resultados ${modeLabel}`;
                      })()}{" "}
                      {countedBallotsTotal > 0 && `(${countedBallotsTotal})`}
                    </h3>
                    {(() => {
                      if (countedBallotsLoading) {
                        return (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {Array.from({ length: 10 }).map((_, index) => (
                              <div
                                key={index}
                                className="animate-pulse rounded-lg border border-gray-300 p-4"
                              >
                                <div className="text-center">
                                  <div className="mx-auto mb-2 h-4 w-16 rounded bg-gray-300"></div>
                                  <div className="mx-auto mb-2 h-6 w-12 rounded bg-gray-300"></div>
                                  <div className="mx-auto h-3 w-20 rounded bg-gray-300"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      if (countedBallotsError) {
                        return (
                          <div className="py-8 text-center">
                            <p className="text-gray-600">
                              Error al cargar mesas con resultados
                            </p>
                          </div>
                        );
                      }

                      if (countedTables.length > 0) {
                        return <TablesSection tables={countedTables} />;
                      }

                      return (
                        <div className="py-8 text-center">
                          <p className="mb-2 text-gray-600">
                            {shouldBlockForPublicScope
                              ? publicScope.reason ||
                                "No hay mesas con resultados disponibles"
                              : "No hay mesas con resultados disponibles"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {shouldBlockForPublicScope
                              ? "Seleccione un territorio habilitado para esta elección."
                              : isPreliminaryPhase
                                ? "Aún no se han procesado actas para esta ubicación."
                                : "Los resultados finales aún no están disponibles."}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        ) : isElectoralTableLoading || isElectoralTableFetching ? (
          <div className="rounded-lg border border-gray-200 bg-white shadow-md">
            <div className="rounded-t-lg bg-gray-800 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 animate-pulse rounded bg-gray-600"></div>
                  <div>
                    <div className="mb-2 h-8 w-32 animate-pulse rounded bg-gray-600"></div>
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-700"></div>
                  </div>
                </div>
                <div className="h-10 w-64 animate-pulse rounded bg-gray-600"></div>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4 flex flex-row flex-wrap gap-4">
                <div className="basis-[450px] grow-2 shrink-1 rounded-lg border border-gray-200 p-6">
                  <div className="mb-4 h-6 w-24 animate-pulse rounded bg-gray-300"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200"></div>
                  </div>
                </div>
                <div className="basis-[300px] grow-1 shrink-1 rounded-lg border border-gray-200 p-6">
                  <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-300"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : isElectoralTableError ? (
          <div className="rounded-lg border border-gray-200 bg-white shadow-md">
            <div className="rounded-t-lg bg-gray-800 p-6 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <BrowserBackButton
                    className="text-white hover:text-gray-300"
                    to={resultsMesaBackTarget}
                  />
                  <div>
                    <h1 className="text-2xl font-semibold md:text-3xl">
                      Mesa {tableCode}
                    </h1>
                    <p className="mt-1 text-gray-300">
                      Datos geográficos no disponibles
                    </p>
                  </div>
                </div>
                <SimpleSearchBar className="ml-auto shrink-1" onSearch={handleSearch} />
              </div>
            </div>

            <div className="inner-container">
              {images.length > 0 ? (
                <div className="mt-4 rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                    Imágenes de Actas
                  </h3>
                  <ImagesSection
                    images={images}
                    mostSupportedBallot={mostSupportedBallotData}
                    attestationCases={attestationCases?.ballots || []}
                    electionId={resolvedElectionId}
                    electionType={resolvedElectionType}
                  />
                </div>
              ) : (
                <div className="px-8 py-16 text-center">
                  <h2 className="mb-2 text-xl font-semibold text-gray-700">
                    No se encontraron datos detallados para la mesa "{tableCode}"
                  </h2>
                  <p className="text-gray-500">
                    La mesa electoral no tiene información geográfica registrada ni actas disponibles.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-md">
            <div className="rounded-t-lg bg-gray-800 p-6 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <BrowserBackButton
                    className="text-white hover:text-gray-300"
                    to={resultsMesaBackTarget}
                  />
                  <div>
                    <h1 className="text-2xl font-semibold md:text-3xl">
                      {electoralTableData
                        ? `Mesa #${electoralTableData?.tableNumber}`
                        : "No se encontró la mesa"}
                    </h1>
                    {electoralTableData?.tableCode && (
                      <p className="mt-1 text-gray-300">
                        Código: {electoralTableData.tableCode}
                      </p>
                    )}
                  </div>
                </div>
                <SimpleSearchBar className="ml-auto shrink-1" onSearch={handleSearch} />
              </div>
            </div>

            <div className="inner-container">
              {electoralTableData && (
                <>
                  <div className="mb-4 flex flex-row flex-wrap gap-4">
                    <div className="basis-[450px] grow-2 shrink-1 rounded-lg border border-gray-200 p-6">
                      <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                        Ubicacion
                      </h3>
                      <LocationSection
                        department={electoralTableData?.department?.name}
                        province={electoralTableData?.province?.name}
                        municipality={electoralTableData?.municipality?.name}
                        electoralLocation={electoralTableData?.electoralLocation?.name}
                        electoralSeat={electoralTableData?.electoralSeat?.name}
                      />
                    </div>
                    <div className="basis-[300px] grow-1 shrink-1 rounded-lg border border-gray-200 p-6">
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
                              {electoralTableData?.tableNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex min-w-0 flex-shrink-0 items-start gap-3">
                          <div className="min-w-0">
                            <h3 className="mb-1 text-sm font-medium uppercase tracking-wide text-gray-600">
                              Codigo de mesa
                            </h3>
                            <p className="break-words text-base font-normal leading-relaxed text-gray-900">
                              {electoralTableData?.tableCode}
                            </p>
                          </div>
                        </div>
                        <div className="flex w-full min-w-0 items-start gap-3">
                          <div className="min-w-0 w-full">
                            <h3 className="mb-1 text-sm font-medium uppercase tracking-wide text-gray-600">
                              Direccion
                            </h3>
                            <p className="break-words text-base font-normal leading-relaxed text-gray-900">
                              {electoralTableData?.electoralLocation?.address}
                            </p>
                          </div>
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
                  ) : resultsLoading ? (
                    <div className="rounded-lg border border-gray-200 p-8 text-center">
                      <div className="inline-flex items-center gap-3 text-gray-600">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        <span>Cargando resultados...</span>
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
                          Participación
                        </h3>
                        <StatisticsBars
                          title="Distribución de votos"
                          voteData={participation}
                          processedTables={{
                            current: electoralTableData ? 1 : 0,
                            total: otherTables.length + (electoralTableData ? 1 : 0),
                          }}
                        />
                      </div>
                      <div className="flex w-full flex-wrap gap-4">
                        <div className="basis-[min(420px,100%)] grow-3 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                          <div className="p-4">
                            <h3 className="mb-4 text-lg font-semibold text-gray-800">
                              {resultsLabels.primary}
                            </h3>
                            <Graphs data={presidentialData} />
                          </div>
                        </div>
                        {shouldRenderSecondaryResults && (
                          <div className="basis-[min(420px,100%)] grow-3 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                            <div className="p-4">
                              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                                {resultsLabels.secondary}
                              </h3>
                              {deputiesData.length > 0 ? (
                                <Graphs data={deputiesData} />
                              ) : (
                                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
                                  Sin datos
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="mt-4 rounded-lg border border-gray-200 p-4">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                  Imagenes
                </h3>
                <ImagesSection
                  images={images}
                  mostSupportedBallot={mostSupportedBallotData}
                  attestationCases={attestationCases?.ballots || []}
                  electionId={resolvedElectionId}
                  electionType={resolvedElectionType}
                />
              </div>

              {otherTables.length > 0 && (
                <div className="mb-4 rounded-lg border border-gray-200 p-6">
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                    Otras mesas del Recinto
                  </h3>
                  <div
                    className={`flex flex-wrap gap-3 ${
                      !showAllTables
                        ? "max-h-[calc(3*5.5rem+2*0.75rem)] overflow-hidden"
                        : ""
                    }`}
                  >
                    {otherTables.map((table) => (
                      <BrowserNavLink
                        key={table._id}
                        href={buildResultsTableLink(table.tableCode, resultsContext)}
                        className="block w-[calc(20%-0.6rem)] min-w-[120px] flex-shrink-0 rounded-lg border border-gray-300 p-4 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50"
                      >
                        <div className="text-center">
                          <div className="mb-1 text-sm font-medium uppercase tracking-wide text-gray-600">
                            Mesa
                          </div>
                          <div className="mb-2 text-lg font-semibold text-gray-900">
                            #{table.tableNumber}
                          </div>
                          <div
                            className="truncate break-words text-xs text-gray-500"
                            title={table.tableCode}
                          >
                            {table.tableCode}
                          </div>
                        </div>
                      </BrowserNavLink>
                    ))}
                  </div>
                  {otherTables.length > 15 && (
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={() => setShowAllTables(!showAllTables)}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900"
                      >
                        {showAllTables ? "Mostrar menos" : `Mostrar todas (${otherTables.length} mesas)`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {otherTables.length === 0 && shouldBlockForPublicScope && (
                <div className="mb-4 rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-gray-600">
                    {publicScope.reason || "Seleccione un territorio habilitado para esta elección."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
