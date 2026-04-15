"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGetDepartmentsQuery } from "../../../store/departments/departmentsEndpoints";
import Breadcrumb2 from "../components/Breadcrumb2";
import { useSelector } from "react-redux";
import {
  selectFilterIds,
} from "../../../store/resultados/resultadosSlice";
import {
  useLazyGetLiveResultsByLocationQuery,
  useLazyGetResultsByLocationQuery,
} from "../../../store/resultados/resultadosEndpoints";
import Graphs from "../../../legacy-pages/Resultados/Graphs";
import StatisticsBars from "../../../legacy-pages/Resultados/StatisticsBars";
import TablesSection from "../components/TablesSection";
import { useSearchParams } from "../navigation/compat";
import { getDeterministicPartyColor } from "../../../legacy/resultados/partyColors";
import useElectionId from "../hooks/useElectionId";
import useElectionConfig from "../hooks/useElectionConfig";
import { selectAuth } from "../../../store/auth/authSlice";
import { useMyContract } from "../../../hooks/useMyContract";
import {
  getResultsLabels,
  type ResultsElectionType,
} from "../../../legacy/resultados/resultsLabels";
import useAutoRefreshTick from "../../../hooks/useAutoRefreshTick";
import { useCountedBallots } from "../../../hooks/useCountedBallots";
import { usePublicResultsScope } from "../hooks/usePublicResultsScope";

interface ResultVoteItem {
  partyId: string;
  totalVotes?: number;
}

const InlineLoadingBadge = ({ visible }: { visible: boolean }) =>
  visible ? (
    <span className="ml-2 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
      <span className="h-2 w-2 animate-pulse rounded-full bg-[#459151]" />
      Actualizando
    </span>
  ) : null;

const ResultsPanelSkeleton = () => (
  <div className="space-y-4">
    <div className="h-10 w-52 animate-pulse rounded bg-gray-200" />
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-4 animate-pulse rounded bg-gray-100"
          style={{ width: `${92 - index * 8}%` }}
        />
      ))}
    </div>
    <div className="h-56 animate-pulse rounded-lg bg-gray-100" />
  </div>
);

const ParticipationSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between gap-4">
      <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
    </div>
    <div className="h-4 animate-pulse rounded-full bg-gray-100" />
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-10 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  </div>
);

const TablesSectionSkeleton = () => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: 8 }).map((_, index) => (
      <div
        key={index}
        className="h-40 animate-pulse rounded-xl border border-gray-200 bg-white"
      />
    ))}
  </div>
);

// const combinedData = [
//   { name: 'Party A', value: 100, color: '#FF6384' },
//   { name: 'Party B', value: 200, color: '#36A2EB' },
//   { name: 'Party C', value: 150, color: '#FFCE56' },
//   { name: 'Party D', value: 80, color: '#4BC0C0' },
//   { name: 'Party E', value: 120, color: '#9966FF' },
//   { name: 'Party F', value: 90, color: '#FF9F40' },
//   { name: 'Party G', value: 60, color: '#FF6384' },
//   { name: 'Party H', value: 110, color: '#36A2EB' },
// ];

const ResultadosGenerales3 = () => {
  const electionId = useElectionId();
  const [searchParams] = useSearchParams();
  // const [resultsData, setResultsData] = useState([]);
  const [presidentialData, setPresidentialData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [deputiesData, setDeputiesData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [participation, setParticipation] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  useGetDepartmentsQuery({
    limit: 100,
  });
  const [getResultsByLocation] = useLazyGetResultsByLocationQuery({});
  const [getLiveResultsByLocation] = useLazyGetLiveResultsByLocationQuery();
  const {
    election,
    hasActiveConfig,
    isVotingPeriod: isPreliminaryPhase,
    isResultsPeriod: isFinalPhase,
    isAutoRefreshWindow,
  } = useElectionConfig();
  const electionTypeFromUrl = searchParams.get("electionType");
  const resolvedElectionType: ResultsElectionType =
    electionTypeFromUrl === "municipal" ||
    electionTypeFromUrl === "departamental" ||
    electionTypeFromUrl === "presidential" ||
    electionTypeFromUrl === "mayor" ||
    electionTypeFromUrl === "governor"
      ? electionTypeFromUrl
      : election?.type || "presidential";
  const resultsLabels = getResultsLabels(resolvedElectionType);
  const filterIds = useSelector(selectFilterIds);
  const { user } = useSelector(selectAuth);
  const { status: contractStatus, contract } = useMyContract();
  const [isLoading, setIsLoading] = useState({
    president: true,
    deputies: true,
  });
  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const role = user?.role ?? "publico";
  const isRestrictedRole = role === "MAYOR" || role === "GOVERNOR";
  const territoryDepartmentId =
    contract?.territory.departmentId ?? user?.departmentId;
  const territoryMunicipalityId =
    contract?.territory.municipalityId ?? user?.municipalityId;
  const hasRestrictedScope =
    (role === "MAYOR" && !!territoryMunicipalityId) ||
    (role === "GOVERNOR" && !!territoryDepartmentId);
  const hasAnyFilterId = Boolean(
    filterIds.departmentId ||
      filterIds.provinceId ||
      filterIds.municipalityId ||
      filterIds.electoralSeatId ||
      filterIds.electoralLocationId,
  );
  const shouldDelayForContract =
    isRestrictedRole && contractStatus === "loading" && !hasRestrictedScope;
  const shouldBlockForMissingScope =
    isRestrictedRole && !hasRestrictedScope && !hasAnyFilterId;
  const electoralLocationId =
    searchParams.get("electoralLocation") || undefined;
  const publicScope = usePublicResultsScope({
    electionId: electionId ?? undefined,
    electionType: resolvedElectionType,
  });
  const shouldBlockForPublicScope =
    publicScope.isPublic && !publicScope.isLoading && !publicScope.isScopeValid;
  const refreshTick = useAutoRefreshTick({
    enabled:
      hasActiveConfig &&
      (isPreliminaryPhase || isFinalPhase) &&
      isAutoRefreshWindow &&
      !shouldDelayForContract &&
      !shouldBlockForMissingScope &&
      !shouldBlockForPublicScope,
    intervalMs: 5 * 60 * 1000,
  });

  const locationParams = useMemo(() => {
    const getParamId = (key: string) => searchParams.get(key) || "";
    const params = {
      department: filterIds.departmentId || getParamId("department"),
      province: filterIds.provinceId || getParamId("province"),
      municipality: filterIds.municipalityId || getParamId("municipality"),
      electoralSeat: filterIds.electoralSeatId || getParamId("electoralSeat"),
      electoralLocation:
        filterIds.electoralLocationId || getParamId("electoralLocation"),
    };

    if (role === "MAYOR") {
      if (territoryDepartmentId) {
        params.department = territoryDepartmentId;
      }
      if (territoryMunicipalityId) {
        params.municipality = territoryMunicipalityId;
      }
    } else if (role === "GOVERNOR" && territoryDepartmentId) {
      params.department = territoryDepartmentId;
    }

    return params;
  }, [
    filterIds.departmentId,
    filterIds.provinceId,
    filterIds.municipalityId,
    filterIds.electoralSeatId,
    filterIds.electoralLocationId,
    role,
    searchParams,
    territoryDepartmentId,
    territoryMunicipalityId,
  ]);

  const primaryElectionType = useMemo(() => {
    if (resolvedElectionType === "municipal" || resolvedElectionType === "mayor") {
      return "municipal";
    }
    if (resolvedElectionType === "departamental" || resolvedElectionType === "governor") {
      return "departamental";
    }
    return "presidential";
  }, [resolvedElectionType]);

  const secondaryElectionType = useMemo(() => {
    if (resolvedElectionType === "municipal" || resolvedElectionType === "mayor") {
      return "council";
    }
    if (resolvedElectionType === "departamental" || resolvedElectionType === "governor") {
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
    tables: tablesData,
    isLoading: tablesLoading,
  } = useCountedBallots({
    electionType: primaryElectionType,
    electionId: electionId ?? undefined,
    department: locationParams.department,
    province: locationParams.province,
    municipality: locationParams.municipality,
    electoralLocation: electoralLocationId,
    page: 1,
    limit: 200,
    isLiveMode: isPreliminaryPhase && !isFinalPhase,
    enablePolling: isAutoRefreshWindow,
    skip:
      !electoralLocationId ||
      !hasActiveConfig ||
      (!isPreliminaryPhase && !isFinalPhase) ||
      shouldDelayForContract ||
      shouldBlockForMissingScope ||
      shouldBlockForPublicScope,
  });

  // useEffect(() => {
  //   // console.log('Current config data:', configData);
  // }, [configData]);

  useEffect(() => {
    if (!hasActiveConfig || (!isPreliminaryPhase && !isFinalPhase)) {
      setPresidentialData([]);
      setDeputiesData([]);
      setParticipation([]);
      setIsLoading({ president: false, deputies: false });
      return;
    }

    if (shouldDelayForContract) {
      setPresidentialData([]);
      setDeputiesData([]);
      setParticipation([]);
      setIsLoading({ president: true, deputies: true });
      return;
    }

    if (shouldBlockForMissingScope) {
      setPresidentialData([]);
      setDeputiesData([]);
      setParticipation([]);
      setIsLoading({ president: false, deputies: false });
      return;
    }

    if (publicScope.isLoading) {
      setPresidentialData([]);
      setDeputiesData([]);
      setParticipation([]);
      setIsLoading({ president: true, deputies: true });
      return;
    }

    if (shouldBlockForPublicScope) {
      setPresidentialData([]);
      setDeputiesData([]);
      setParticipation([]);
      setIsLoading({ president: false, deputies: false });
      return;
    }

    const baseParams = {
      ...locationParams,
      electionId: electionId ?? undefined,
    };

    const fetcher = isFinalPhase
      ? getResultsByLocation // oficiales
      : getLiveResultsByLocation; // preliminares

    setPresidentialData([]);
    setDeputiesData([]);
    setParticipation([]);
    setIsLoading({ president: true, deputies: true });

    let isActive = true;
    fetchDebounceRef.current = setTimeout(() => {
      const primaryParams = {
        ...baseParams,
        electionType: primaryElectionType,
      };
      const secondaryParams = {
        ...baseParams,
        electionType: secondaryElectionType,
      };

      const presidentRequest = fetcher(primaryParams, true);
      const deputiesRequest = fetcher(secondaryParams, true);

      presidentRequest
        .unwrap()
        .then((data) => {
          if (!isActive) return;
          const formattedData = (data.results ?? []).map((item: ResultVoteItem) => {
            return {
              name: item.partyId,
              value: Number(item.totalVotes) || 0,
              color: getDeterministicPartyColor(item.partyId),
            };
          });
          setPresidentialData(formattedData);

          if (data.summary) {
            const participationData = [
              {
                name: "Válidos",
                value: data.summary.validVotes || 0,
                color: "#8cc689",
              },
              {
                name: "Nulos",
                value: data.summary.nullVotes || 0,
                color: "#81858e",
              },
              {
                name: "Blancos",
                value: data.summary.blankVotes || 0,
                color: "#f3f3ce",
              },
            ];
            setParticipation(participationData);
          } else {
            setParticipation([]);
          }
        })
        .catch((err) => {
          if (!isActive || err?.name === "AbortError") return;
          console.error("Error obteniendo resultados presidenciales:", err);
          setPresidentialData([]);
          setParticipation([]);
        })
        .finally(() => {
          if (isActive) {
            setIsLoading((prev) => ({ ...prev, president: false }));
          }
        });

      deputiesRequest
        .unwrap()
        .then((data) => {
          if (!isActive) return;
          const formattedData = (data.results ?? []).map((item: ResultVoteItem) => {
            return {
              name: item.partyId,
              value: Number(item.totalVotes) || 0,
              color: getDeterministicPartyColor(item.partyId),
            };
          });
          setDeputiesData(formattedData);
        })
        .catch((err) => {
          if (!isActive || err?.name === "AbortError") return;
          console.error("Error obteniendo resultados diputados:", err);
          setDeputiesData([]);
        })
        .finally(() => {
          if (isActive) {
            setIsLoading((prev) => ({ ...prev, deputies: false }));
          }
        });
    }, 400);

    return () => {
      isActive = false;
      if (fetchDebounceRef.current) {
        clearTimeout(fetchDebounceRef.current);
        fetchDebounceRef.current = null;
      }
    };
  }, [
    refreshTick,
    locationParams,
    electionId,
    election,
    hasActiveConfig,
    isPreliminaryPhase,
    isFinalPhase,
    shouldDelayForContract,
    shouldBlockForMissingScope,
    shouldBlockForPublicScope,
    publicScope.isLoading,
    primaryElectionType,
    secondaryElectionType,
    getResultsByLocation,
    getLiveResultsByLocation,
  ]);

  const isResultsRefreshing = isLoading.president || isLoading.deputies;
  const showParticipationSkeleton =
    isResultsRefreshing && participation.length === 0;
  const showPrimarySkeleton =
    isResultsRefreshing && presidentialData.length === 0;
  const showSecondarySkeleton =
    shouldRenderSecondaryResults &&
    isResultsRefreshing &&
    deputiesData.length === 0;
  const showTablesSection = tablesLoading || tablesData.length > 0;

  return (
    <div className="outer-container min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          Resultados Generales
        </h1>
        <div className="inner-container bg-gray-50 border border-gray-200 rounded-lg">
          <div className="">
            <Breadcrumb2 />
          </div>

          {election &&
          hasActiveConfig &&
          !isPreliminaryPhase &&
          !isFinalPhase ? (
            <div className="border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-xl text-gray-600 mb-4">
                Los resultados se habilitarán el:
              </p>
              <div className="mb-2">
                <p className="text-2xl text-gray-700 mb-1">
                  {new Date(
                    election.resultsStartDateBolivia,
                  ).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "America/La_Paz",
                  })}
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {new Date(
                    election.resultsStartDateBolivia,
                  ).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/La_Paz",
                  })}
                </p>
                <p className="text-sm text-gray-500 mt-1">(Hora de Bolivia)</p>
              </div>
            </div>
          ) : (
            <>
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span>Participación</span>
                  {isPreliminaryPhase && (
                    <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                      Resultados preliminares
                    </span>
                  )}
                  <InlineLoadingBadge visible={isResultsRefreshing} />
                </h3>
                {showParticipationSkeleton ? (
                  <ParticipationSkeleton />
                ) : (
                  <StatisticsBars
                    title="Distribución de votos"
                    voteData={participation}
                    processedTables={{ current: 1556, total: 2678 }}
                  />
                )}
              </div>
              <div className="w-full flex flex-wrap gap-4">
                <div
                  data-cy="presidential-results"
                  className="border border-gray-200 rounded-lg overflow-hidden basis-[min(420px,100%)] grow-3 shrink-0"
                >
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span>{resultsLabels.primary}</span>
                      {isPreliminaryPhase && (
                        <span className="text-xs font-semibold uppercase tracking-wide text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                          Preliminares
                        </span>
                      )}
                      <InlineLoadingBadge visible={isResultsRefreshing} />
                    </h3>

                    {showPrimarySkeleton ? (
                      <ResultsPanelSkeleton />
                    ) : presidentialData.length > 0 ? (
                      <Graphs data={presidentialData} />
                    ) : (
                      <div className="border border-gray-200 rounded-lg p-8 text-center">
                        <p className="text-xl text-gray-600">
                          {shouldBlockForPublicScope
                            ? publicScope.reason || "Sin resultados disponibles"
                            : "Sin datos"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {shouldRenderSecondaryResults && (
                  <div
                    data-cy="deputies-results"
                    className="border border-gray-200 rounded-lg overflow-hidden basis-[min(420px,100%)] grow-3 shrink-0"
                  >
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <span>{resultsLabels.secondary}</span>
                        {isPreliminaryPhase && (
                          <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                            Preliminares
                          </span>
                        )}
                        <InlineLoadingBadge visible={isResultsRefreshing} />
                      </h3>
                      {showSecondarySkeleton ? (
                        <ResultsPanelSkeleton />
                      ) : deputiesData.length > 0 ? (
                        <Graphs data={deputiesData} />
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                          Sin datos
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {showTablesSection && (
            <div className="bg-gray-50 rounded-lg shadow-sm p-4 mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200 flex items-center">
                <span>Mesas</span>
                <InlineLoadingBadge visible={tablesLoading} />
              </h3>
              {tablesLoading && tablesData.length === 0 ? (
                <TablesSectionSkeleton />
              ) : (
                <TablesSection tables={tablesData} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultadosGenerales3;
