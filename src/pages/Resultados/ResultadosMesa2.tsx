import { useEffect, useState } from 'react';
import LocationSection from './LocationSection';
import Graphs from './Graphs';
import ImagesSection from './ImagesSection';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import {
  useGetElectoralTableByTableCodeQuery,
  useLazyGetElectoralTablesByElectoralLocationIdQuery,
} from '../../store/electoralTables/electoralTablesEndpoints';
import { useLazyGetResultsByLocationQuery } from '../../store/resultados/resultadosEndpoints';
import SimpleSearchBar from '../../components/SimpleSearchBar';
import StatisticsBars from './StatisticsBars';
import BackButton from '../../components/BackButton';
import { useLazyGetBallotByTableCodeQuery } from '../../store/ballots/ballotsEndpoints';
import { BallotType, ElectoralTableType } from '../../types';
import { useGetConfigurationStatusQuery } from '../../store/configurations/configurationsEndpoints';
import { setCurrentTable } from '../../store/resultados/resultadosSlice';
import { useDispatch, useSelector } from 'react-redux';
import { getPartyColor } from './partyColors';
import {
  useGetAttestationCasesByTableCodeQuery,
  useGetMostSupportedBallotByTableCodeQuery,
  useGetAttestationsQuery,
  useGetAttestationsByDepartmentIdQuery,
} from '../../store/attestations/attestationsEndpoints';
import Breadcrumb2 from '../../components/Breadcrumb2';
import { useGetDepartmentsQuery } from '../../store/departments/departmentsEndpoints';
import TablesSection from './TablesSection';
import { useMultipleBallots } from '../../hooks/useMultipleBallots';
import { ballotsToElectoralTables } from '../../utils/ballotToElectoralTable';
import { selectFilters, selectFilterIds } from '../../store/resultados/resultadosSlice';

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
  const { tableCode } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filters = useSelector(selectFilters);
  const filterIds = useSelector(selectFilterIds);
  
  const [getResultsByLocation] = useLazyGetResultsByLocationQuery({});
  const [getBallotsByTableCode] = useLazyGetBallotByTableCodeQuery({});
  const [getTablesByLocationId] =
    useLazyGetElectoralTablesByElectoralLocationIdQuery({});
  
  const [presidentialData, setPresidentialData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [deputiesData, setDeputiesData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [participation, setParticipation] = useState<
    Array<{ name: string; value: any; color: string }>
  >([]);
  const [otherTables, setOtherTables] = useState<ElectoralTableType[]>([]);
  const [filteredTables, setFilteredTables] = useState<ElectoralTableType[]>([]);
  const [images, setImages] = useState<BallotType[]>([]);
  const [showAllTables, setShowAllTables] = useState(false);
  const [showAllFilteredTables, setShowAllFilteredTables] = useState(false);
  const [attestedTables, setAttestedTables] = useState<ElectoralTableType[]>([]);
  const [uniqueBallotIds, setUniqueBallotIds] = useState<string[]>([]);
  const [departmentUniqueBallotIds, setDepartmentUniqueBallotIds] = useState<string[]>([]);
  
  const { data: configData } = useGetConfigurationStatusQuery();
  
  useGetDepartmentsQuery({
    limit: 100,
  });
  const { data: mostSupportedBallotData } =
    useGetMostSupportedBallotByTableCodeQuery(tableCode || '', {
      skip: !tableCode,
    });
  const { data: attestationCases } = useGetAttestationCasesByTableCodeQuery(
    tableCode || '',
    {
      skip: !tableCode,
    }
  );

  const {
    data: electoralTableData,
    // error: electoralTableError,
    isError: isElectoralTableError,
    isLoading: isElectoralTableLoading,
  } = useGetElectoralTableByTableCodeQuery(tableCode || '', {
    skip: !tableCode, // Skip the query if tableCode is falsy
  });

  // Get attestations when no specific table is selected
  const { data: attestationsData } = useGetAttestationsQuery(
    { limit: 20, page: 1 },
    { skip: !!tableCode } // Skip if tableCode exists (we're viewing a specific table)
  );

  // Get department-based attestations when department is selected
  const { data: departmentAttestationsData } = useGetAttestationsByDepartmentIdQuery(
    { 
      departmentId: filterIds.departmentId,
      support: true,
      page: 1,
      limit: 15
    },
    { 
      skip: !filterIds.departmentId || !!tableCode || filteredTables.length > 0
    }
  );

  // Get multiple ballots based on attestations
  const { ballots, loading: ballotsLoading, error: ballotsError } = useMultipleBallots(uniqueBallotIds);
  
  // Get multiple ballots for department-specific attestations
  const { 
    ballots: departmentBallots, 
    loading: departmentBallotsLoading, 
    error: departmentBallotsError 
  } = useMultipleBallots(departmentUniqueBallotIds);


  const handleSearch = (searchTerm: string) => {
    if (!searchTerm) return;
    navigate(`/resultados/mesa/${searchTerm}`);
    // console.log('Search term:', searchTerm);
    // Implement search functionality here
  };

  useEffect(() => {
    if (mostSupportedBallotData) {
      console.log('Most Supported Ballot Data:', mostSupportedBallotData);
    }
  }, [mostSupportedBallotData]);

  useEffect(() => {
    if (tableCode && electoralTableData) {
      getBallotsByTableCode(tableCode)
        .unwrap()
        .then((data) => {
          setImages(data);
          //console.log('Fetched ballots data:', data);
          // Process the fetched ballots data as needed
        });

      if (electoralTableData.electoralLocation) {
        getTablesByLocationId(electoralTableData.electoralLocation._id)
          .unwrap()
          .then((data) => {
            console.log('Fetched other tables data:', data);
            setOtherTables(
              data.filter(
                (table: ElectoralTableType) => table._id !== tableCode
              )
            );
            // Process the fetched tables data as needed
          });
      }

      // Only make API calls if results period is active
      if (!configData?.isResultsPeriod) {
        return;
      }

      getResultsByLocation({ tableCode, electionType: 'presidential' })
        .unwrap()
        .then((data) => {
          // console.log('Fetched presidential data:', data);
          const formattedData = data.results.map((item: any) => {
            // Get party color or generate random hex color if not found
            const partyColor = getPartyColor(item.partyId);
            const randomColor =
              '#' + Math.floor(Math.random() * 16777215).toString(16);
            return {
              name: item.partyId,
              value: item.totalVotes,
              color: partyColor || randomColor, // Use party color, then item color, then random as fallback
            };
          });
          setPresidentialData(formattedData);

          if (data.summary) {
            const participationData = [
              {
                name: 'Válidos',
                // value: data.summary?.validVotes || 0,
                value: data.summary.validVotes || 0,
                color: '#8cc689', // Green
              },
              {
                name: 'Nulos',
                // value: data.summary?.nullVotes || 0,
                value: data.summary.nullVotes || 0,
                color: '#81858e', // Red
              },
              {
                name: 'Blancos',
                // value: data.summary?.blankVotes || 0,
                value: data.summary.blankVotes || 0,
                color: '#f3f3ce', // Yellow
              },
            ];
            setParticipation(participationData);
          }
        });
      getResultsByLocation({ tableCode, electionType: 'deputies' })
        .unwrap()
        .then((data) => {
          // console.log('Fetched deputies data:', data);
          const formattedData = data.results.map((item: any) => {
            // Get party color or generate random hex color if not found
            const partyColor = getPartyColor(item.partyId);
            const randomColor =
              '#' + Math.floor(Math.random() * 16777215).toString(16);
            return {
              name: item.partyId,
              value: item.totalVotes,
              color: partyColor || randomColor, // Use party color, then item color, then random as fallback
            };
          });
          setDeputiesData(formattedData);
        });
    }
  }, [tableCode, electoralTableData, configData]);

  useEffect(() => {
    if (tableCode) {
      dispatch(setCurrentTable(tableCode));
    }
  }, [tableCode]);

  // Effect to handle territorial filters and get filtered tables
  useEffect(() => {
    const electoralLocationId = searchParams.get('electoralLocation');
    if (electoralLocationId) {
      getTablesByLocationId(electoralLocationId)
        .unwrap()
        .then((data) => {
          setFilteredTables(data);
        })
        .catch((error) => {
          console.error('Error fetching filtered tables:', error);
          setFilteredTables([]);
        });
    } else {
      setFilteredTables([]);
    }
  }, [searchParams, getTablesByLocationId]);

  // Effect to extract unique ballot IDs from general attestations
  // Only when no department is selected and no filtered tables
  useEffect(() => {
    if (attestationsData?.data && !tableCode && !filterIds.departmentId && filteredTables.length === 0) {
      // Get unique ballot IDs from attestations - try both ballotId and _id fields
      const validBallotIds = attestationsData.data
        .map((attestation: any) => attestation.ballotId || attestation._id)
        .filter((ballotId: any) => ballotId && ballotId !== undefined && ballotId !== null);
      
      const uniqueIds = Array.from(new Set(validBallotIds)).slice(0, 15); // Limit to 15 for performance

      setUniqueBallotIds(uniqueIds);
    } else {
      setUniqueBallotIds([]);
    }
  }, [attestationsData, tableCode, filterIds.departmentId, filteredTables.length]);

  // Effect to extract unique ballot IDs from department attestations
  useEffect(() => {
    if (departmentAttestationsData?.data && !tableCode && filteredTables.length === 0) {
      // Get unique ballot IDs from department attestations using _id field
      const allBallotIds = departmentAttestationsData.data.map((attestation: any) => attestation._id);
      const validBallotIds = allBallotIds.filter((ballotId: any) => ballotId && ballotId !== undefined && ballotId !== null);
      
      const uniqueIds = Array.from(new Set(validBallotIds)).slice(0, 15); // Limit to 15 for performance

      console.log('🎯 Department attestations corrected:', {
        totalAttestations: departmentAttestationsData.data.length,
        validBallotIds: validBallotIds.length,
        uniqueIds: uniqueIds.length,
        sampleIds: uniqueIds.slice(0, 3)
      });

      setDepartmentUniqueBallotIds(uniqueIds);
    } else {
      setDepartmentUniqueBallotIds([]);
    }
  }, [departmentAttestationsData, tableCode, filteredTables.length]);

  // Effect to process real ballot data and convert to ElectoralTableType
  useEffect(() => {
    // Determine which ballots to use: department-specific or general
    const ballotsToUse = departmentUniqueBallotIds.length > 0 ? departmentBallots : ballots;
    const isLoadingToUse = departmentUniqueBallotIds.length > 0 ? departmentBallotsLoading : ballotsLoading;
    const errorToUse = departmentUniqueBallotIds.length > 0 ? departmentBallotsError : ballotsError;
    const ballotIdsToCheck = departmentUniqueBallotIds.length > 0 ? departmentUniqueBallotIds : uniqueBallotIds;

    if (ballotsToUse.length > 0 && !isLoadingToUse && !errorToUse) {
      const convertedTables = ballotsToElectoralTables(ballotsToUse);
      setAttestedTables(convertedTables);
    } else if (errorToUse) {
      console.error('Error loading ballots');
      setAttestedTables([]);
    } else if (ballotIdsToCheck.length === 0) {
      setAttestedTables([]);
    }
  }, [
    ballots, ballotsLoading, ballotsError, uniqueBallotIds.length,
    departmentBallots, departmentBallotsLoading, departmentBallotsError, departmentUniqueBallotIds.length
  ]);

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
              <Breadcrumb2 />
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
                      ? 'max-h-[calc(3*10rem+2*0.75rem)] overflow-hidden'
                      : ''
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
                      onClick={() => setShowAllFilteredTables(!showAllFilteredTables)}
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
                      Use los filtros territoriales arriba o busque directamente por código de mesa
                    </p>
                    <SimpleSearchBar
                      className="w-full max-w-md"
                      onSearch={handleSearch}
                    />
                  </div>
                </div>

                {/* Attested tables section */}
                {(uniqueBallotIds.length > 0 || departmentUniqueBallotIds.length > 0 || filterIds.departmentId) && (
                  <div className="bg-gray-50 rounded-lg shadow-sm p-4 mt-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                      {filters.department 
                        ? `Mesas Atestiguadas - ${filters.department}`
                        : 'Mesas Atestiguadas'} {attestedTables.length > 0 && `(${attestedTables.length})`}
                    </h3>
                    {(departmentUniqueBallotIds.length > 0 ? departmentBallotsLoading : ballotsLoading) ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {Array.from({ length: Math.min(departmentUniqueBallotIds.length > 0 ? departmentUniqueBallotIds.length : uniqueBallotIds.length, 10) }).map((_, index) => (
                          <div key={index} className="border border-gray-300 rounded-lg p-4 animate-pulse">
                            <div className="text-center">
                              <div className="h-4 bg-gray-300 rounded w-16 mx-auto mb-2"></div>
                              <div className="h-6 bg-gray-300 rounded w-12 mx-auto mb-2"></div>
                              <div className="h-3 bg-gray-300 rounded w-20 mx-auto"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (departmentUniqueBallotIds.length > 0 ? departmentBallotsError : ballotsError) ? (
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
                        <p className="text-gray-600">Error al cargar mesas atestiguadas</p>
                      </div>
                    ) : attestedTables.length > 0 ? (
                      <TablesSection tables={attestedTables} />
                    ) : filterIds.departmentId && departmentUniqueBallotIds.length === 0 ? (
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
                          {departmentAttestationsData?.data ? 
                            `Se encontraron ${departmentAttestationsData.data.length} attestations para ${filters.department}, pero no contienen datos de ballots válidos` :
                            `No se encontraron mesas atestiguadas para ${filters.department}`
                          }
                        </p>
                        <p className="text-sm text-gray-500">
                          {departmentAttestationsData?.data ? 
                            'Los datos del backend necesitan ser corregidos para incluir ballotId válidos' :
                            'Intente seleccionar un departamento diferente o usar filtros territoriales más específicos'
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600">No hay mesas atestiguadas disponibles</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ) : isElectoralTableLoading ? (
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
          <div className="bg-white rounded-lg shadow-md py-16 px-8 border border-red-200">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-red-50 rounded-full p-4 mb-4">
                <svg
                  className="w-12 h-12 text-red-600"
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
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
                No se encontró la mesa "{tableCode}"
              </h1>
              <p className="text-lg text-gray-500 mb-8">
                Por favor, verifique el código e intente con una mesa diferente
              </p>
              <SimpleSearchBar
                className="w-full max-w-md"
                onSearch={handleSearch}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* Header Section */}
            <div className="bg-gray-800 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <BackButton className="text-white hover:text-gray-300" />
                  <div>
                    <h1 className="text-2xl md:text-3xl font-semibold">
                      {electoralTableData
                        ? `Mesa #${electoralTableData?.tableNumber}`
                        : 'No se encontró la mesa'}
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
                  {otherTables.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-6 mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        Otras mesas del Recinto
                      </h3>
                      <div
                        className={`flex flex-wrap gap-3 ${
                          !showAllTables
                            ? 'max-h-[calc(3*5.5rem+2*0.75rem)] overflow-hidden'
                            : ''
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
                  {configData &&
                  !configData.isResultsPeriod &&
                  configData.hasActiveConfig ? (
                    <div className="border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-xl text-gray-600 mb-4">
                        Los resultados se habilitarán el:
                      </p>
                      <div className="mb-2">
                        <p className="text-2xl text-gray-700 mb-1">
                          {new Date(
                            configData.config.resultsStartDateBolivia
                          ).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'America/La_Paz',
                          })}
                        </p>
                        <p className="text-3xl font-bold text-gray-800">
                          {new Date(
                            configData.config.resultsStartDateBolivia
                          ).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'America/La_Paz',
                          })}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          (Hora de Bolivia)
                        </p>
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
                          title='Distribución de votos'
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
                              Resultados Presidenciales
                            </h3>
                            <Graphs data={presidentialData} />
                          </div>
                        </div>
                        <div className="border border-gray-200 rounded-lg overflow-hidden basis-[min(420px,100%)] grow-3 shrink-0">
                          <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                              Resultados Diputados
                            </h3>
                            <Graphs data={deputiesData} />
                            {/* {selectedOption.id === 'images' && <ImagesSection />} */}
                          </div>
                        </div>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultadosMesa2;
