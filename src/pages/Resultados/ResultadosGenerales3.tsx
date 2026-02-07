import { useEffect, useMemo, useRef, useState } from "react";
import { useGetDepartmentsQuery } from "../../store/departments/departmentsEndpoints";
import Breadcrumb2 from "../../components/Breadcrumb2";
import { useSelector } from "react-redux";
import {
  selectFilters,
  selectFilterIds,
} from "../../store/resultados/resultadosSlice";
import {
  useLazyGetLiveResultsByLocationQuery,
  useLazyGetResultsByLocationQuery,
} from "../../store/resultados/resultadosEndpoints";
import Graphs from "./Graphs";
import StatisticsBars from "./StatisticsBars";
import TablesSection from "./TablesSection";
import { useLazyGetElectoralTablesByElectoralLocationIdQuery } from "../../store/electoralTables/electoralTablesEndpoints";
import { useSearchParams } from "react-router-dom";
import { ElectoralTableType } from "../../types";
import { getPartyColor } from "./partyColors";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import useElectionId from "../../hooks/useElectionId";
import useElectionConfig from "../../hooks/useElectionConfig";
import { selectAuth } from "../../store/auth/authSlice";
import { useMyContract } from "../../hooks/useMyContract";
import { getResultsLabels } from "./resultsLabels";

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
    Array<{ name: string; value: any; color: string }>
  >([]);
  const [validTables, setValidTables] = useState<
    Array<{ name: string; value: any; color: string }>
  >([]);
  const [tablesData, setTablesData] = useState<ElectoralTableType[]>([]);
  useGetDepartmentsQuery({
    limit: 100,
  });
  const [getResultsByLocation] = useLazyGetResultsByLocationQuery({});
  const [getLiveResultsByLocation] = useLazyGetLiveResultsByLocationQuery();
  const [getTablesByLocationId] =
    useLazyGetElectoralTablesByElectoralLocationIdQuery();
  const { election, hasActiveConfig, isVotingPeriod: isPreliminaryPhase, isResultsPeriod: isFinalPhase } = useElectionConfig();
  const resultsLabels = getResultsLabels(election?.type);
  const filters = useSelector(selectFilters);
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

  const locationParams = useMemo(() => {
    const params = {
      department: filterIds.departmentId || filters.department || "",
      province: filterIds.provinceId || filters.province || "",
      municipality: filterIds.municipalityId || filters.municipality || "",
      electoralSeat: filterIds.electoralSeatId || filters.electoralSeat || "",
      electoralLocation:
        filterIds.electoralLocationId || filters.electoralLocation || "",
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
    filters.department,
    filters.province,
    filters.municipality,
    filters.electoralSeat,
    filters.electoralLocation,
    role,
    territoryDepartmentId,
    territoryMunicipalityId,
  ]);

  // useEffect(() => {
  //   // console.log('Current config data:', configData);
  // }, [configData]);

  useEffect(() => {
    if (!hasActiveConfig || (!isPreliminaryPhase && !isFinalPhase)) {
      setPresidentialData([]);
      setDeputiesData([]);
      setParticipation([]);
      setValidTables([]);
      setIsLoading({ president: false, deputies: false });
      return;
    }

    if (shouldDelayForContract) {
      setPresidentialData([]);
      setDeputiesData([]);
      setParticipation([]);
      setValidTables([]);
      setIsLoading({ president: true, deputies: true });
      return;
    }

    if (shouldBlockForMissingScope) {
      setPresidentialData([]);
      setDeputiesData([]);
      setParticipation([]);
      setValidTables([]);
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
    setValidTables([]);
    setIsLoading({ president: true, deputies: true });

    let isActive = true;
    fetchDebounceRef.current = setTimeout(() => {
      // Tipo de elecciÃ³n (municipal, departamental, presidential)
      const presidentRequest = fetcher({
        ...baseParams,
        electionType: election?.type ?? "presidential",
      }, true);
      const deputiesRequest = fetcher({
        ...baseParams,
        // electionType: election?.type ?? "deputies",
        electionType: "deputies",
      }, true);

      presidentRequest
        .unwrap()
        .then((data) => {
          if (!isActive) return;
          const formattedData = (data.results ?? []).map((item: any) => {
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
            const validTableData = [
              {
                name: "Atestiguados",
                value: data.summary.tablesProcessed ?? 0,
                color: "#8cc689",
              },
              {
                name: "No atestiguados",
                value:
                  (data.summary.totalTables ?? 0) -
                  (data.summary.tablesProcessed ?? 0),
                color: "#81858e",
              },
            ];
            setParticipation(participationData);
            setValidTables(validTableData);
          } else {
            setParticipation([]);
            setValidTables([]);
          }
        })
        .catch((err) => {
          if (!isActive || err?.name === "AbortError") return;
          console.error("Error obteniendo resultados presidenciales:", err);
          setPresidentialData([]);
          setParticipation([]);
          setValidTables([]);
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
          const formattedData = (data.results ?? []).map((item: any) => {
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
    locationParams,
    electionId,
    election,
    hasActiveConfig,
    isPreliminaryPhase,
    isFinalPhase,
    shouldDelayForContract,
    shouldBlockForMissingScope,
    getResultsByLocation,
    getLiveResultsByLocation,
  ]);

  useEffect(() => {
    const electoralLocationId = searchParams.get("electoralLocation");
    if (electoralLocationId) {
      getTablesByLocationId(electoralLocationId)
        .unwrap()
        .then((data) => {
          setTablesData(data);
        })
        .catch((err) => {
          console.error("Error obteniendo mesas:", err);
          setTablesData([]);
        });
    } else {
      setTablesData([]);
    }
  }, [searchParams, getTablesByLocationId]);

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
          ) : !presidentialData.length &&
            !deputiesData.length &&
            (isLoading.president || isLoading.deputies) ? (
            <LoadingSkeleton />
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
                </h3>
                <StatisticsBars
                  title="Distribución de votos"
                  voteData={participation}
                  processedTables={{ current: 1556, total: 2678 }}
                />
                <StatisticsBars
                  title="Mesas atestiguadas"
                  voteData={validTables}
                  processedTables={{ current: 1556, total: 2678 }}
                />
              </div>
              {presidentialData.length === 0 ? (
                <div className="border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-xl text-gray-600">Sin datos</p>
                </div>
              ) : (
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
                      </h3>

                      <Graphs data={presidentialData} />
                    </div>
                  </div>
                  {deputiesData.length > 0 && (
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
                        </h3>
                        <Graphs data={deputiesData} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tablesData.length > 0 && (
            <div className="bg-gray-50 rounded-lg shadow-sm p-4 mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                Mesas
              </h3>
              <TablesSection tables={tablesData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultadosGenerales3;
