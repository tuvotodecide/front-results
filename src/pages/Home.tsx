import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGetConfigurationStatusQuery } from "../store/configurations/configurationsEndpoints";
import {
  useLazyGetResultsByLocationQuery,
  useLazyGetLiveResultsByLocationQuery,
} from "../store/resultados/resultadosEndpoints";
import { useSelector } from "react-redux";
import { selectFilters } from "../store/resultados/resultadosSlice";
import { getPartyColor } from "./Resultados/partyColors";
import StatisticsBars from "./Resultados/StatisticsBars";
import Graphs from "./Resultados/Graphs";
import tuvotoDecideImage from "../assets/tuvotodecide.webp";

import useElectionId from "../hooks/useElectionId";

const Home: React.FC = () => {
  const [presidentialData, setPresidentialData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [participation, setParticipation] = useState<
    Array<{ name: string; value: any; color: string }>
  >([]);

  const { data: configData } = useGetConfigurationStatusQuery();
  const [getResultsByLocation] = useLazyGetResultsByLocationQuery();
  const [getLiveResultsByLocation] = useLazyGetLiveResultsByLocationQuery();
  const filters = useSelector(selectFilters);

  const electionId = useElectionId();
  const hasActiveConfig = !!configData?.hasActiveConfig;
  const isPreliminaryPhase = !!configData?.isVotingPeriod; // epoca de preliminares
  const isFinalPhase = !!configData?.isResultsPeriod;

  useEffect(() => {
    if (!hasActiveConfig) {
      setPresidentialData([]);
      setParticipation([]);
      return;
    }

    if (!isPreliminaryPhase && !isFinalPhase) {
      setPresidentialData([]);
      setParticipation([]);
      return;
    }

    const params = {
      ...filters,
      electionType: "presidential",
      electionId: electionId ?? undefined,
    };

    const fetcher = isFinalPhase
      ? getResultsByLocation // resultados oficiales
      : getLiveResultsByLocation; // resultados preliminares

    fetcher(params)
      .unwrap()
      .then((data) => {
      
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
      .catch((error) => {
        console.log("Error obteniendo resultados:", error);
        setPresidentialData([]);
        setParticipation([]);
      });
  }, [
    filters,
    electionId,
    hasActiveConfig,
    isPreliminaryPhase,
    isFinalPhase,
    getResultsByLocation,
    getLiveResultsByLocation,
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Más compacto */}
      <div className="bg-gradient-to-br bg-[#459151] text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              Tu voto decide
            </h1>
            <p className="mt-3 text-lg sm:text-xl text-blue-100">
              Plataforma para el control electoral
            </p>
            <p className="mt-2 text-sm sm:text-base font-medium text-blue-200 uppercase tracking-wide">
              Elecciones generales Bolivia 2025
            </p>
          </div>
        </div>
      </div>

      {/* Resultados Electorales Section - Mejorado */}
      <div className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Resultados en Tiempo Real
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sigue los resultados preliminares de las elecciones generales conforme se van procesando las actas
            </p>
          </div> */}

          {configData &&
          hasActiveConfig &&
          !isPreliminaryPhase &&
          !isFinalPhase ? (
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
                      configData.config.resultsStartDateBolivia
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
                      configData.config.resultsStartDateBolivia
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
          ) : presidentialData.length === 0 ? (
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
          ) : (
            <div className="space-y-8">
              {/* Participación */}
              {participation.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                      <svg
                        className="w-6 h-6 text-green-600 mr-3"
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
                      <span>Participación Electoral</span>
                      {isPreliminaryPhase && (
                        <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                          Resultados preliminares
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Distribución de votos válidos, nulos y blancos
                    </p>
                  </div>
                  <div className="p-6">
                    <StatisticsBars
                      title="Distribución de Votos"
                      voteData={participation}
                      processedTables={{ current: 0, total: 0 }}
                    />
                  </div>
                </div>
              )}

              {/* Resultados Presidenciales */}
              {presidentialData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                      <svg
                        className="w-6 h-6 text-blue-600 mr-3"
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
                      <span>
                        {isPreliminaryPhase
                          ? "Resultados Presidenciales (preliminares)"
                          : "Resultados Presidenciales"}
                      </span>
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Votos por candidatura presidencial
                    </p>
                  </div>
                  <div className="p-6">
                    <Graphs data={presidentialData} />
                  </div>
                </div>
              )}

              {/* Botón para ver más detalles */}
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

      {/* Mobile App Download Section - Mejorado */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r bg-[#459151] rounded-2xl overflow-hidden shadow-xl">
            <div className="px-8 py-12 sm:px-12 sm:py-16">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Lleva el control en tu móvil
                </h2>
                <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
                  Participa en el control electoral, gana recompensas y obtén tu
                  identidad digital soberana con Wira Wallet.
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
