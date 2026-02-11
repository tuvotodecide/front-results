import { useEffect, useState } from "react";
import LocationSection from "./LocationSection";
import Graphs from "./Graphs";
import ImagesSection from "./ImagesSection";
import {
  useNavigate,
  useParams,
  Link,
  useSearchParams,
} from "react-router-dom";
import {
  useGetElectoralTableByTableCodeQuery,
  useLazyGetElectoralTablesByElectoralLocationIdQuery,
} from "../../store/electoralTables/electoralTablesEndpoints";
import {
  useLazyGetLiveResultsByLocationQuery,
  useLazyGetResultsByLocationQuery,
} from "../../store/resultados/resultadosEndpoints";
import SimpleSearchBar from "../../components/SimpleSearchBar";
import StatisticsBars from "./StatisticsBars";
import BackButton from "../../components/BackButton";
import { useLazyGetBallotByTableCodeQuery } from "../../store/ballots/ballotsEndpoints";
import { BallotType, ElectoralTableType } from "../../types";
import useElectionConfig from "../../hooks/useElectionConfig";
import { setCurrentTable } from "../../store/resultados/resultadosSlice";
import { useDispatch, useSelector } from "react-redux";
import { getPartyColor } from "./partyColors";
import {
  useGetAttestationCasesByTableCodeQuery,
  useGetMostSupportedBallotByTableCodeQuery,
} from "../../store/attestations/attestationsEndpoints";
import Breadcrumb2 from "../../components/Breadcrumb2";
import { useGetDepartmentsQuery } from "../../store/departments/departmentsEndpoints";
import TablesSection from "./TablesSection";
import { useCountedBallots } from "../../hooks/useCountedBallots";
import { getResultsLabels } from "./resultsLabels";
import {
  selectFilters,
  // selectFilterIds,
} from "../../store/resultados/resultadosSlice";
import useElectionId from "../../hooks/useElectionId";

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

const ResultadosMesa2 = () => {
  const electionId = useElectionId();
  const { tableCode } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filters = useSelector(selectFilters);
  // const filterIds = useSelector(selectFilterIds);

  const [getResultsByLocation] = useLazyGetResultsByLocationQuery();
  const [getLiveResultsByLocation] = useLazyGetLiveResultsByLocationQuery();
  const [getBallotsByTableCode] = useLazyGetBallotByTableCodeQuery();
  const [getTablesByLocationId] =
    useLazyGetElectoralTablesByElectoralLocationIdQuery();

  const [presidentialData, setPresidentialData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [deputiesData, setDeputiesData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  console.log(deputiesData);
  const [participation, setParticipation] = useState<
    Array<{ name: string; value: any; color: string }>
  >([]);
  const [otherTables, setOtherTables] = useState<ElectoralTableType[]>([]);
  const [filteredTables, setFilteredTables] = useState<ElectoralTableType[]>(
    [],
  );
  const [images, setImages] = useState<BallotType[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [showAllTables, setShowAllTables] = useState(false);
  const [showAllFilteredTables, setShowAllFilteredTables] = useState(false);

  const {
    election,
    hasActiveConfig,
    isVotingPeriod: isPreliminaryPhase,
    isResultsPeriod: isFinalPhase,
  } = useElectionConfig();

  // Hook para obtener las mesas que cuentan en resultados (consistente con by-location)
  const {
    tables: countedTables,
    isLoading: countedBallotsLoading,
    isError: countedBallotsError,
    total: countedBallotsTotal,
  } = useCountedBallots({
    electionType: election?.type ?? "presidential",
    electionId: electionId ?? undefined,
    department: filters.department,
    province: filters.province,
    municipality: filters.municipality,
    page: 1,
    limit: 20,
    isLiveMode: isPreliminaryPhase && !isFinalPhase,
    skip:
      !!tableCode || !hasActiveConfig || (!isPreliminaryPhase && !isFinalPhase),
  });
  const resultsLabels = getResultsLabels(election?.type);

  useGetDepartmentsQuery({
    limit: 100,
  });
  const { data: mostSupportedBallotData } =
    useGetMostSupportedBallotByTableCodeQuery(
      { tableCode: tableCode || "", electionId: electionId ?? undefined },
      { skip: !tableCode },
    );
  const { data: attestationCases } = useGetAttestationCasesByTableCodeQuery(
    { tableCode: tableCode || "", electionId: electionId ?? undefined },
    { skip: !tableCode },
  );

  const {
    data: electoralTableData,
    // error: electoralTableError,
    isError: isElectoralTableError,
    isLoading: isElectoralTableLoading,
    isFetching: isElectoralTableFetching,
  } = useGetElectoralTableByTableCodeQuery(tableCode || "", {
    skip: !tableCode, // Skip the query if tableCode is falsy
  });

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm) return;
    navigate(`/resultados/mesa/${searchTerm}`);
    // console.log('Search term:', searchTerm);
    // Implement search functionality here
  };

  // Cargar actas por tableCode (independiente de electoralTableData)
  useEffect(() => {
    if (!tableCode || !electionId) return;
    getBallotsByTableCode({ tableCode, electionId })
      .unwrap()
      .then((data: any) => {
        setImages(data);
      })
      .catch((err) => {
        console.error("Error obteniendo actas:", err);
        setImages([]);
      });
  }, [tableCode, electionId, getBallotsByTableCode]);

  useEffect(() => {
    if (!tableCode || !electoralTableData) return;

    if (electoralTableData.electoralLocation) {
      getTablesByLocationId(electoralTableData.electoralLocation._id)
        .unwrap()
        .then((data) => {
          setOtherTables(
            data.filter((table: ElectoralTableType) => table._id !== tableCode),
          );
        })
        .catch((err) => {
          console.error("Error obteniendo otras mesas:", err);
          setOtherTables([]);
        });
    }

    if (!hasActiveConfig || (!isPreliminaryPhase && !isFinalPhase)) {
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
      electionType: election?.type ?? "presidential",
      electionId: electionId ?? undefined,
    })
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
            value: item.totalVotes,
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
          setParticipation(participationData);
        } else {
          setParticipation([]);
        }
      })
      .catch((err) => {
        if (!isActive) return;
        console.error("Error obteniendo resultados presidenciales:", err);
        setPresidentialData([]);
        setParticipation([]);
      });

    const deputiesPromise = fetcher({
      tableCode,
      electionType: election?.type ?? "deputies",
      electionId: electionId ?? undefined,
    })
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
            value: item.totalVotes,
            color: partyColor || randomColor,
          };
        });
        setDeputiesData(formattedData);
      })
      .catch((err) => {
        if (!isActive) return;
        console.error("Error obteniendo resultados diputados:", err);
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
    tableCode,
    electoralTableData,
    electionId,
    election,
    hasActiveConfig,
    isPreliminaryPhase,
    isFinalPhase,
    getBallotsByTableCode,
    getTablesByLocationId,
    getResultsByLocation,
    getLiveResultsByLocation,
  ]);

  useEffect(() => {
    if (tableCode) {
      dispatch(setCurrentTable(tableCode));
    }
  }, [tableCode]);

  // Effect to handle territorial filters and get filtered tables
  useEffect(() => {
    const electoralLocationId = searchParams.get("electoralLocation");
    if (electoralLocationId) {
      getTablesByLocationId(electoralLocationId)
        .unwrap()
        .then((data) => {
          setFilteredTables(data);
        })
        .catch((error) => {
          console.error("Error fetching filtered tables:", error);
          setFilteredTables([]);
        });
    } else {
      setFilteredTables([]);
    }
  }, [searchParams, getTablesByLocationId]);

  return (
    <div className="outer-container min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          Resultados por Mesa
        </h1>

        {!tableCode ? (
          <div className="inner-container bg-gray-50 border border-gray-200 rounded-lg">
             {/* Territorial Filters Section */}
             <div className="">
              <Breadcrumb2 autoOpen={false} />
             </div>

            {/* Tables List Section */}
            {filteredTables.length > 0 ? (
              <div className="bg-gray-50 rounded-lg shadow-sm p-4 mt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                  Mesas encontradas ({filteredTables.length})
                </h3>
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 ${
                    !showAllFilteredTables && filteredTables.length > 15
                      ? "max-h-[calc(3*10rem+2*0.75rem)] overflow-hidden"
                      : ""
                  }`}
                >
                  {filteredTables.map((table) => (
                    <Link
                      key={table._id}
                      to={`/resultados/mesa/${table.tableCode}`}
                      className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 hover:border-blue-400 hover:shadow-md transition-all duration-200 block"
                    >
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                          Mesa
                        </div>
                        <div className="text-lg font-semibold text-gray-900 mb-2">
                          #{table.tableNumber}
                        </div>
                        <div
                          className="text-xs text-gray-500 break-words"
                          title={table.tableCode}
                        >
                          {table.tableCode}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {filteredTables.length > 15 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() =>
                        setShowAllFilteredTables(!showAllFilteredTables)
                      }
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                    >
                      {showAllFilteredTables ? (
                        <>
                          Mostrar menos
                          <svg
                            className="ml-2 w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </>
                      ) : (
                        <>
                          Mostrar todas ({filteredTables.length} mesas)
                          <svg
                            className="ml-2 w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Search section */}
                <div className="bg-white rounded-lg shadow-md py-16 px-8 border border-gray-200 mt-6">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-100 rounded-full p-4 mb-4">
                      <svg
                        className="w-12 h-12 text-gray-600"
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
                    <h1 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
                      Buscar Mesa Electoral
                    </h1>
                    <p className="text-gray-500 mb-8">
                      Use los filtros territoriales arriba o busque directamente
                      por código de mesa
                    </p>
                    <SimpleSearchBar
                      className="w-full max-w-md"
                      onSearch={handleSearch}
                    />
                  </div>
                </div>

                {/* Mesas que cuentan en resultados */}
                {hasActiveConfig && (isPreliminaryPhase || isFinalPhase) && (
                  <div className="bg-gray-50 rounded-lg shadow-sm p-4 mt-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                      {(() => {
                        const modeLabel = isPreliminaryPhase
                          ? "Preliminares"
                          : "Finales";
                        if (filters.municipality) {
                          return `Mesas con Resultados ${modeLabel} - ${filters.municipality}`;
                        } else if (filters.province) {
                          return `Mesas con Resultados ${modeLabel} - ${filters.province}`;
                        } else if (filters.department) {
                          return `Mesas con Resultados ${modeLabel} - ${filters.department}`;
                        } else {
                          return `Mesas con Resultados ${modeLabel}`;
                        }
                      })()}{" "}
                      {countedBallotsTotal > 0 && `(${countedBallotsTotal})`}
                    </h3>
                    {(() => {
                      if (countedBallotsLoading) {
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {Array.from({ length: 10 }).map((_, index) => (
                              <div
                                key={index}
                                className="border border-gray-300 rounded-lg p-4 animate-pulse"
                              >
                                <div className="text-center">
                                  <div className="h-4 bg-gray-300 rounded w-16 mx-auto mb-2"></div>
                                  <div className="h-6 bg-gray-300 rounded w-12 mx-auto mb-2"></div>
                                  <div className="h-3 bg-gray-300 rounded w-20 mx-auto"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      if (countedBallotsError) {
                        return (
                          <div className="text-center py-8">
                            <div className="bg-red-50 rounded-full p-4 mb-4 inline-block">
                              <svg
                                className="w-8 h-8 text-red-600"
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
                        <div className="text-center py-8">
                          <div className="bg-amber-50 rounded-full p-4 mb-4 inline-block">
                            <svg
                              className="w-8 h-8 text-amber-600"
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
                          <p className="text-gray-600 mb-2">
                            No hay mesas con resultados disponibles
                          </p>
                          <p className="text-sm text-gray-500">
                            {isPreliminaryPhase
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
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* Header Skeleton */}
            <div className="bg-gray-800 p-6 rounded-t-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-600 rounded animate-pulse"></div>
                  <div>
                    <div className="h-8 bg-gray-600 rounded w-32 animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-10 bg-gray-600 rounded w-64 animate-pulse"></div>
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="p-6">
              <div className="flex flex-row flex-wrap gap-4 mb-4">
                <div className="border border-gray-200 rounded-lg p-6 basis-[450px] grow-2 shrink-1">
                  <div className="h-6 bg-gray-300 rounded w-24 animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-6 basis-[300px] grow-1 shrink-1">
                  <div className="h-6 bg-gray-300 rounded w-32 animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 mb-4">
                <div className="h-6 bg-gray-300 rounded w-28 animate-pulse mb-4"></div>
                <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="w-full flex flex-wrap gap-4">
                <div className="border border-gray-200 rounded-lg p-4 basis-[min(420px,100%)] grow-3 shrink-0">
                  <div className="h-6 bg-gray-300 rounded w-48 animate-pulse mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 basis-[min(420px,100%)] grow-3 shrink-0">
                  <div className="h-6 bg-gray-300 rounded w-44 animate-pulse mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ) : isElectoralTableError ? (
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* Header con info básica del tableCode */}
            <div className="bg-gray-800 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <BackButton
                    className="text-white hover:text-gray-300"
                    to="/resultados/mesa"
                  />
                  <div>
                    <h1 className="text-2xl md:text-3xl font-semibold">
                      Mesa {tableCode}
                    </h1>
                    <p className="text-gray-300 mt-1">
                      Datos geográficos no disponibles
                    </p>
                  </div>
                </div>
                <SimpleSearchBar
                  className="shrink-1 ml-auto"
                  onSearch={handleSearch}
                />
              </div>
            </div>

            <div className="inner-container">
              {/* Mostrar imágenes de actas si existen */}
              {images.length > 0 ? (
                <div className="border border-gray-200 rounded-lg p-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    Imágenes de Actas
                  </h3>
                  <ImagesSection
                    images={images}
                    mostSupportedBallot={mostSupportedBallotData}
                    attestationCases={attestationCases?.ballots || []}
                  />
                </div>
              ) : (
                <div className="py-16 px-8 text-center">
                  <div className="bg-amber-50 rounded-full p-4 mb-4 inline-block">
                    <svg
                      className="w-12 h-12 text-amber-600"
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
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">
                    No se encontraron datos detallados para la mesa "{tableCode}
                    "
                  </h2>
                  <p className="text-gray-500">
                    La mesa electoral no tiene información geográfica registrada
                    ni actas disponibles.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* Header Section */}
            <div className="bg-gray-800 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <BackButton
                    className="text-white hover:text-gray-300"
                    to="/resultados/mesa"
                  />
                  <div>
                    <h1 className="text-2xl md:text-3xl font-semibold">
                      {electoralTableData
                        ? `Mesa #${electoralTableData?.tableNumber}`
                        : "No se encontró la mesa"}
                    </h1>
                    {electoralTableData?.tableCode && (
                      <p className="text-gray-300 mt-1">
                        Código: {electoralTableData.tableCode}
                      </p>
                    )}
                  </div>
                </div>
                <SimpleSearchBar
                  className="shrink-1 ml-auto"
                  onSearch={handleSearch}
                />
              </div>
            </div>

            {/* Content */}
            <div className="inner-container">
              {electoralTableData && (
                <>
                  <div className="flex flex-row flex-wrap gap-4 mb-4">
                    <div className="border border-gray-200 rounded-lg p-6 basis-[450px] grow-2 shrink-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        Ubicacion
                      </h3>
                      <LocationSection
                        department={electoralTableData?.department?.name}
                        province={electoralTableData?.province?.name}
                        municipality={electoralTableData?.municipality?.name}
                        electoralLocation={
                          electoralTableData?.electoralLocation?.name
                        }
                        electoralSeat={electoralTableData?.electoralSeat?.name}
                      />
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6 basis-[300px] grow-1 shrink-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        Datos Mesa
                      </h3>
                      <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                        <div className="flex items-start gap-3 min-w-0 flex-shrink-0">
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                              Numero de mesa
                            </h3>
                            <p className="text-base font-normal text-gray-900 leading-relaxed break-words">
                              {electoralTableData?.tableNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 min-w-0 flex-shrink-0">
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                              Codigo de mesa
                            </h3>
                            <p className="text-base font-normal text-gray-900 leading-relaxed break-words">
                              {electoralTableData?.tableCode}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 min-w-0 w-full">
                          <div className="min-w-0 w-full">
                            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                              Direccion
                            </h3>
                            <p className="text-base font-normal text-gray-900 leading-relaxed break-words">
                              {electoralTableData?.electoralLocation?.address}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
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
                        <p className="text-sm text-gray-500 mt-1">
                          (Hora de Bolivia)
                        </p>
                      </div>
                    </div>
                  ) : resultsLoading ? (
                    <div className="border border-gray-200 rounded-lg p-8 text-center">
                      <div className="inline-flex items-center gap-3 text-gray-600">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        <span>Cargando resultados...</span>
                      </div>
                    </div>
                  ) : presidentialData.length === 0 ? (
                    <div className="border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-xl text-gray-600">Sin datos</p>
                    </div>
                  ) : (
                    <>
                      <div className="border border-gray-200 rounded-lg p-6 mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          Participación
                        </h3>
                        <StatisticsBars
                          title="Distribución de votos"
                          voteData={participation}
                          processedTables={{ current: 1556, total: 2678 }}
                          totalTables={456}
                          totalVoters={1547}
                          totalActs={596}
                          totalWitnesses={500}
                        />
                      </div>
                      <div className="w-full flex flex-wrap gap-4">
                        <div className="border border-gray-200 rounded-lg overflow-hidden basis-[min(420px,100%)] grow-3 shrink-0">
                          <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                              {resultsLabels.primary}
                            </h3>
                            <Graphs data={presidentialData} />
                          </div>
                        </div>
                        {/* <div className="border border-gray-200 rounded-lg overflow-hidden basis-[min(420px,100%)] grow-3 shrink-0">
                          <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                              {resultsLabels.secondary}
                            </h3>
                            <Graphs data={deputiesData} />
                           
                          </div>
                        </div> */}
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="border border-gray-200 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  Imagenes
                </h3>
                <ImagesSection
                  images={images}
                  mostSupportedBallot={mostSupportedBallotData}
                  attestationCases={attestationCases?.ballots || []}
                />
              </div>
              {otherTables.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-6 mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
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
                      <Link
                        key={table._id}
                        to={`/resultados/mesa/${table.tableCode}`}
                        className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 block flex-shrink-0 w-[calc(20%-0.6rem)] min-w-[120px]"
                      >
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                            Mesa
                          </div>
                          <div className="text-lg font-semibold text-gray-900 mb-2">
                            #{table.tableNumber}
                          </div>
                          <div
                            className="text-xs text-gray-500 break-words truncate"
                            title={table.tableCode}
                          >
                            {table.tableCode}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {otherTables.length > 15 && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setShowAllTables(!showAllTables)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                      >
                        {showAllTables ? (
                          <>
                            Mostrar menos
                            <svg
                              className="ml-2 w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </>
                        ) : (
                          <>
                            Mostrar todas ({otherTables.length} mesas)
                            <svg
                              className="ml-2 w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultadosMesa2;
