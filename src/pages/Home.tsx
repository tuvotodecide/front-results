import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetConfigurationStatusQuery } from '../store/configurations/configurationsEndpoints';
import { useLazyGetResultsByLocationQuery } from '../store/resultados/resultadosEndpoints';
import { useSelector } from 'react-redux';
import { selectFilters } from '../store/resultados/resultadosSlice';
import { getPartyColor } from './Resultados/partyColors';
import StatisticsBars from './Resultados/StatisticsBars';
import Graphs from './Resultados/Graphs';
import tuvotoDecideImage from '../assets/tuvotodecide.webp';

const Home: React.FC = () => {
  const [presidentialData, setPresidentialData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [participation, setParticipation] = useState<
    Array<{ name: string; value: any; color: string }>
  >([]);

  const { data: configData } = useGetConfigurationStatusQuery();
  const [getResultsByLocation] = useLazyGetResultsByLocationQuery({});
  const filters = useSelector(selectFilters);

  useEffect(() => {
    if (!configData?.isResultsPeriod) {
      return;
    }

    // Obtener resultados presidenciales
    getResultsByLocation({ ...filters, electionType: 'presidential' })
      .unwrap()
      .then((data) => {
        const formattedData = data.results.map((item: any) => {
          const partyColor = getPartyColor(item.partyId);
          const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
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
              name: 'Válidos',
              value: data.summary.validVotes || 0,
              color: '#8cc689',
            },
            {
              name: 'Nulos',
              value: data.summary.nullVotes || 0,
              color: '#81858e',
            },
            {
              name: 'Blancos',
              value: data.summary.blankVotes || 0,
              color: '#f3f3ce',
            },
          ];
          setParticipation(participationData);
        }
      })
      .catch((error) => {
        console.log('Error obteniendo resultados:', error);
      });
  }, [filters, configData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Más compacto */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
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
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Resultados en Tiempo Real
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sigue los resultados preliminares de las elecciones generales conforme se van procesando las actas
            </p>
          </div>

          {configData && !configData.isResultsPeriod && configData.hasActiveConfig ? (
            <div className="bg-white border border-gray-300 rounded-xl p-8 text-center shadow-sm">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Los resultados se habilitarán el:
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-2xl text-gray-700 font-medium mb-1">
                    {new Date(configData.config.resultsStartDateBolivia).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'America/La_Paz',
                    })}
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {new Date(configData.config.resultsStartDateBolivia).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'America/La_Paz',
                    })}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">(Hora de Bolivia)</p>
                </div>
              </div>
            </div>
          ) : presidentialData.length === 0 ? (
            <div className="bg-white border border-gray-300 rounded-xl p-8 text-center shadow-sm">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sin datos disponibles
                </h3>
                <p className="text-gray-600">
                  Los resultados aparecerán aquí una vez que inicie el período de conteo
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
                      <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                      </svg>
                      Participación Electoral
                    </h3>
                    <p className="text-gray-600 mt-1">Distribución de votos válidos, nulos y blancos</p>
                  </div>
                  <div className="p-6">
                    <StatisticsBars
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
                      <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      Resultados Presidenciales
                    </h3>
                    <p className="text-gray-600 mt-1">Votos por candidatura presidencial</p>
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
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-8 py-12 sm:px-12 sm:py-16">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                  </svg>
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4">
                  Lleva el control en tu móvil
                </h2>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  Descarga nuestra aplicación móvil y mantente informado sobre los resultados electorales desde cualquier lugar
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
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>Resultados en tiempo real</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start text-blue-100">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>Notificaciones instantáneas</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start text-blue-100">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>Acceso sin conexión</span>
                      </div>
                    </div>
                    
                    <a
                      href="https://play.google.com/store/apps/details?id=com.tuvotodecide"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold text-lg rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
                    >
                      <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
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
