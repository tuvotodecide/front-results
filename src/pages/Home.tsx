import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGetConfigurationStatusQuery } from "../store/configurations/configurationsEndpoints";
import {
  useLazyGetResultsByLocationQuery,
  useLazyGetLiveResultsByLocationQuery,
} from "../store/resultados/resultadosEndpoints";
import { useSelector } from "react-redux";
import { selectFilters } from "../store/resultados/resultadosSlice";
import { selectAuth, selectIsLoggedIn } from "../store/auth/authSlice";
import { getPartyColor } from "./Resultados/partyColors";
import StatisticsBars from "./Resultados/StatisticsBars";
import Graphs from "./Resultados/Graphs";
import tuvotoDecideImage from "../assets/tuvotodecide.webp";
import { ElectionStatusType } from "../types";

interface ElectionResultsData {
  electionId: string;
  electionName: string;
  electionType: string;
  resultsData: Array<{ name: string; value: number; color: string }>;
  participationData: Array<{ name: string; value: any; color: string }>;
  isPreliminary: boolean;
}

// Component to display results for a single election
const ElectionResultsCard: React.FC<{
  election: ElectionStatusType;
  resultsData: Array<{ name: string; value: number; color: string }>;
  participationData: Array<{ name: string; value: any; color: string }>;
}> = ({ election, resultsData, participationData }) => {
  const isPreliminary = election.isVotingPeriod;
  const electionTypeLabel = election.type === "municipal"
    ? "Municipales"
    : election.type === "departamental"
      ? "Departamentales"
      : "Presidenciales";

  return (
    <div className="space-y-6">
      {/* Election Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
        <h3 className="text-lg font-bold">{election.name}</h3>
        <p className="text-sm text-blue-100">Elecciones {electionTypeLabel}</p>
        {isPreliminary && (
          <span className="inline-block mt-2 text-xs font-semibold uppercase tracking-wide text-orange-200 bg-orange-600 px-2 py-0.5 rounded-full">
            Resultados preliminares
          </span>
        )}
      </div>

      {/* Participation */}
      {participationData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                ></path>
              </svg>
              Participación Electoral
            </h4>
          </div>
          <div className="p-4">
            <StatisticsBars
              title="Distribución de Votos"
              voteData={participationData}
              processedTables={{ current: 0, total: 0 }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {resultsData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg
                className="w-5 h-5 text-blue-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
              Resultados {electionTypeLabel}
            </h4>
          </div>
          <div className="p-4">
            <Graphs data={resultsData} />
          </div>
        </div>
      )}
    </div>
  );
};

const Home: React.FC = () => {
  const [electionResults, setElectionResults] = useState<Map<string, ElectionResultsData>>(new Map());
  const [loading, setLoading] = useState(false);

  const { data: configData } = useGetConfigurationStatusQuery();
  const [getResultsByLocation] = useLazyGetResultsByLocationQuery();
  const [getLiveResultsByLocation] = useLazyGetLiveResultsByLocationQuery();
  const filters = useSelector(selectFilters);
  const auth = useSelector(selectAuth);
  const isLoggedIn = useSelector(selectIsLoggedIn);

  // Filter elections based on user role
  const visibleElections = useMemo(() => {
    if (!configData?.elections) return [];

    const elections = configData.elections.filter(e => e.isActive);

    // Not logged in or SUPERADMIN: show all elections
    if (!isLoggedIn || auth.user?.role === "SUPERADMIN") {
      return elections;
    }

    // MAYOR: show only municipal elections
    if (auth.user?.role === "MAYOR") {
      return elections.filter(e => e.type === "municipal");
    }

    // GOVERNOR: show only departmental elections
    if (auth.user?.role === "GOVERNOR") {
      return elections.filter(e => e.type === "departamental");
    }

    // Default: show all
    return elections;
  }, [configData?.elections, isLoggedIn, auth.user?.role]);

  // Get location filters based on user role
  const getLocationFilters = useMemo(() => {
    const baseFilters = { ...filters };

    if (isLoggedIn && auth.user) {
      // MAYOR: filter by their municipality
      if (auth.user.role === "MAYOR" && auth.user.municipalityId) {
        return { ...baseFilters, municipalityId: auth.user.municipalityId };
      }
      // GOVERNOR: filter by their department
      if (auth.user.role === "GOVERNOR" && auth.user.departmentId) {
        return { ...baseFilters, departmentId: auth.user.departmentId };
      }
    }

    return baseFilters;
  }, [filters, isLoggedIn, auth.user]);

  const hasActiveConfig = visibleElections.length > 0;
  const showResultsPeriod = visibleElections.some(e => e.isVotingPeriod || e.isResultsPeriod);

  // Fetch results for all visible elections
  useEffect(() => {
    if (!hasActiveConfig || !showResultsPeriod) {
      setElectionResults(new Map());
      return;
    }

    const fetchAllResults = async () => {
      setLoading(true);
      const resultsMap = new Map<string, ElectionResultsData>();

      for (const election of visibleElections) {
        if (!election.isVotingPeriod && !election.isResultsPeriod) {
          continue;
        }

        const params = {
          ...getLocationFilters,
          electionType: election.type,
          electionId: election.id,
        };

        const fetcher = election.isResultsPeriod
          ? getResultsByLocation
          : getLiveResultsByLocation;

        try {
          const data = await fetcher(params).unwrap();

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

          let participationData: Array<{ name: string; value: any; color: string }> = [];
          if (data.summary) {
            participationData = [
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
          }

          resultsMap.set(election.id, {
            electionId: election.id,
            electionName: election.name,
            electionType: election.type,
            resultsData: formattedData,
            participationData,
            isPreliminary: election.isVotingPeriod,
          });
        } catch (error) {
          console.log(`Error obteniendo resultados para ${election.name}:`, error);
        }
      }

      setElectionResults(resultsMap);
      setLoading(false);
    };

    fetchAllResults();
  }, [
    visibleElections,
    getLocationFilters,
    hasActiveConfig,
    showResultsPeriod,
    getResultsByLocation,
    getLiveResultsByLocation,
  ]);

  // Get the first election for waiting message
  const firstWaitingElection = visibleElections.find(e => !e.isVotingPeriod && !e.isResultsPeriod);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br bg-[#459151] text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              Tu voto decide
            </h1>
            <p className="mt-3 text-lg sm:text-xl text-blue-100">
              Plataforma para el control electoral
            </p>
            // <p className="mt-2 text-sm sm:text-base font-medium text-blue-200 uppercase tracking-wide">
            //   Elecciones Bolivia 2026
            // </p>
            {isLoggedIn && auth.user && (
              <p className="mt-2 text-sm text-green-200">
                {auth.user.role === "MAYOR" && auth.user.municipalityName && (
                  <>Viendo resultados de: {auth.user.municipalityName}</>
                )}
                {auth.user.role === "GOVERNOR" && auth.user.departmentName && (
                  <>Viendo resultados de: {auth.user.departmentName}</>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Election Results Section */}
      <div className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading state */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* No active elections or waiting for results */}
          {!loading && configData && hasActiveConfig && !showResultsPeriod && firstWaitingElection && (
            <div className="bg-white border border-gray-300 rounded-xl p-8 text-center shadow-sm">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Los resultados se habilitarán el:
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-2xl text-gray-700 font-medium mb-1">
                    {new Date(
                      firstWaitingElection.resultsStartDateBolivia
                    ).toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "America/La_Paz",
                    })}
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {new Date(
                      firstWaitingElection.resultsStartDateBolivia
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
            </div>
          )}

          {/* No data available */}
          {!loading && (!hasActiveConfig || (electionResults.size === 0 && showResultsPeriod)) && (
            <div className="bg-white border border-gray-300 rounded-xl p-8 text-center shadow-sm">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sin datos disponibles
                </h3>
                <p className="text-gray-600">
                  Los resultados aparecerán aquí una vez que inicie el período
                  de conteo
                </p>
              </div>
            </div>
          )}

          {/* Display results for each election */}
          {!loading && electionResults.size > 0 && (
            <div className="space-y-12">
              {/* Grid for multiple elections */}
              <div className={`grid gap-8 ${visibleElections.length > 1 ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                {visibleElections.map((election) => {
                  const results = electionResults.get(election.id);
                  if (!results || (results.resultsData.length === 0 && results.participationData.length === 0)) {
                    return null;
                  }
                  return (
                    <ElectionResultsCard
                      key={election.id}
                      election={election}
                      resultsData={results.resultsData}
                      participationData={results.participationData}
                    />
                  );
                })}
              </div>

              {/* Button to see detailed results */}
              <div className="text-center">
                <Link
                  to="/resultados"
                  className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    ></path>
                  </svg>
                  Ver Resultados Detallados
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile App Download Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r bg-[#459151] rounded-2xl overflow-hidden shadow-xl">
            <div className="px-8 py-12 sm:px-12 sm:py-16">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Lleva el control en tu móvil
                </h2>

                <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">

                  Participa en el control electoral y revisa los resultados.

                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <div className="flex-shrink-0">
                    <img
                      src={tuvotoDecideImage}
                      alt="Tu Voto Decide App"
                      className="w-32 h-auto rounded-xl shadow-lg ring-4 ring-white ring-opacity-20"
                    />
                  </div>

                  <div className="text-center sm:text-left">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center sm:justify-start text-blue-100">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Identidad Digital Soberana</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start text-blue-100">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Conversión de Actas en NFTs</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start text-blue-100">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Validación Blockchain</span>
                      </div>
                    </div>

                    <a
                      href="https://play.google.com/store/apps/details?id=com.tuvotodecide"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold text-lg rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
                    >
                      <svg
                        className="w-6 h-6 mr-3"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                      </svg>
                      Descargar en Google Play
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Contacto</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Para más información, visite:</p>
              <a
                href="https://asoblockchainbolivia.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline transition-colors duration-200"
              >
                https://asoblockchainbolivia.org
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
