"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Breadcrumb2 from "@/components/Breadcrumb2";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useGetDepartmentsQuery } from "@/store/departments/departmentsEndpoints";
import { selectFilterIds } from "@/store/resultados/resultadosSlice";
import {
  useLazyGetLiveResultsByLocationQuery,
  useLazyGetResultsByLocationQuery,
} from "@/store/resultados/resultadosEndpoints";
import Graphs from "@/features/results/components/Graphs";
import StatisticsBars from "@/features/results/components/StatisticsBars";
import TablesSection from "@/features/results/components/TablesSection";
import { getPartyColor } from "@/features/results/lib/partyColors";
import useElectionId from "@/hooks/useElectionId";
import useElectionConfig from "@/hooks/useElectionConfig";
import { selectAuth } from "@/store/auth/authSlice";
import { useMyContract } from "@/hooks/useMyContract";
import {
  getResultsLabels,
  type ResultsElectionType,
} from "@/features/results/lib/resultsLabels";
import useAutoRefreshTick from "@/hooks/useAutoRefreshTick";
import { useCountedBallots } from "@/hooks/useCountedBallots";
import { usePublicResultsScope } from "@/hooks/usePublicResultsScope";
import { useBrowserSearchParams } from "@/shared/routing/browserLocation";
import type { ResultsByLocationResponse } from "@/store/resultados/resultadosEndpoints";

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
      value: Number(item.totalVotes) || 0,
      color: partyColor || randomColor,
    };
  });

export default function GeneralResultsPage() {
  const electionId = useElectionId();
  const searchParams = useBrowserSearchParams();
  const [presidentialData, setPresidentialData] = useState<ChartDatum[]>([]);
  const [deputiesData, setDeputiesData] = useState<ChartDatum[]>([]);
  const [participation, setParticipation] = useState<ChartDatum[]>([]);

  useGetDepartmentsQuery({ limit: 100 });

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
  const electoralLocationId = searchParams.get("electoralLocation") || undefined;

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

  const { tables: tablesData } = useCountedBallots({
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
      ? getResultsByLocation
      : getLiveResultsByLocation;

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

          setDeputiesData(toChartData(data));
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

  return (
    <div className="outer-container min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl">
        <h1 className="mb-8 text-2xl font-bold text-gray-800 md:text-3xl">
          Resultados Generales
        </h1>
        <div className="inner-container rounded-lg border border-gray-200 bg-gray-50">
          <Breadcrumb2 />

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
          ) : !presidentialData.length &&
            !deputiesData.length &&
            (isLoading.president || isLoading.deputies) ? (
            <LoadingSkeleton fullScreen={false} />
          ) : (
            <>
              <div className="mb-4 rounded-lg border border-gray-200 p-4">
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
                    current: tablesData.length,
                    total: tablesData.length,
                  }}
                />
              </div>

              {presidentialData.length === 0 ? (
                <div className="rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-xl text-gray-600">
                    {shouldBlockForPublicScope
                      ? publicScope.reason || "Sin resultados disponibles"
                      : "Sin datos"}
                  </p>
                </div>
              ) : (
                <div className="flex w-full flex-wrap gap-4">
                  <div
                    data-cy="presidential-results"
                    className="basis-[min(420px,100%)] grow-3 shrink-0 overflow-hidden rounded-lg border border-gray-200"
                  >
                    <div className="p-4">
                      <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                        <span>{resultsLabels.primary}</span>
                        {isPreliminaryPhase && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-orange-700">
                            Preliminares
                          </span>
                        )}
                      </h3>
                      <Graphs data={presidentialData} />
                    </div>
                  </div>

                  {shouldRenderSecondaryResults && (
                    <div
                      data-cy="deputies-results"
                      className="basis-[min(420px,100%)] grow-3 shrink-0 overflow-hidden rounded-lg border border-gray-200"
                    >
                      <div className="p-4">
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
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tablesData.length > 0 && (
            <div className="mt-6 rounded-lg bg-gray-50 p-4 shadow-sm">
              <h3 className="mb-4 border-b border-gray-200 pb-3 text-xl font-bold text-gray-800">
                Mesas
              </h3>
              <TablesSection tables={tablesData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
