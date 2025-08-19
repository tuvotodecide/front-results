import { useEffect, useState } from 'react';
import { useGetDepartmentsQuery } from '../../store/departments/departmentsEndpoints';
import Breadcrumb2 from '../../components/Breadcrumb2';
import { useSelector } from 'react-redux';
import { selectFilters } from '../../store/resultados/resultadosSlice';
import { useLazyGetResultsByLocationQuery } from '../../store/resultados/resultadosEndpoints';
import Graphs from './Graphs';
import StatisticsBars from './StatisticsBars';
import TablesSection from './TablesSection';
import { useLazyGetElectoralTablesByElectoralLocationIdQuery } from '../../store/electoralTables/electoralTablesEndpoints';
import { useSearchParams } from 'react-router-dom';
import { ElectoralTableType } from '../../types';
import { useGetConfigurationStatusQuery } from '../../store/configurations/configurationsEndpoints';
import { getPartyColor } from './partyColors';

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
  const [getTablesByLocationId] =
    useLazyGetElectoralTablesByElectoralLocationIdQuery({});
  const { data: configData } = useGetConfigurationStatusQuery();
  const filters = useSelector(selectFilters);

  // useEffect(() => {
  //   // console.log('Current config data:', configData);
  // }, [configData]);

  useEffect(() => {
    // Only make API calls if results period is active
    if (!configData?.isResultsPeriod) {
      return;
    }

    // console.log('Current filters:', filters);
    // const cleanedFilters = Object.fromEntries(
    //   Object.entries(filters).filter(
    //     ([key, value]) => value !== '' && key !== 'electoralLocation'
    //   )
    // );
    // console.log('Cleaned filters:', cleanedFilters);
    getResultsByLocation({ ...filters, electionType: 'presidential' })
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
            color: partyColor || randomColor, // Use party color, then random as fallback
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
          const validTableData = [
            {
              name: 'Atestiguados',
              value: data.summary.tablesProcessed,
              color: '#8cc689',
            },{
              name: 'No atestiguados',
              value: data.summary.totalTables - data.summary.tablesProcessed,
              color: '#81858e',
            }
          ]
          setParticipation(participationData);
          setValidTables(validTableData);
        }
      });
    getResultsByLocation({ ...filters, electionType: 'deputies' })
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
  }, [filters, configData]);

  useEffect(() => {
    const electoralLocationId = searchParams.get('electoralLocation');
    // console.log('Electoral Location ID:', electoralLocationId);
    if (electoralLocationId) {
      getTablesByLocationId(electoralLocationId)
        .unwrap()
        .then((data) => {
          setTablesData(data);
          // Process tables data if needed
        });
    } else {
      setTablesData([]); // Clear tables data if no location selected
    }
  }, [searchParams]);

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
                <p className="text-sm text-gray-500 mt-1">(Hora de Bolivia)</p>
              </div>
            </div>
          ) : (
            <>
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
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
                <StatisticsBars
                  title='Mesas atestiguadas'
                  voteData={validTables}
                  processedTables={{ current: 1556, total: 2678 }}
                  totalTables={456}
                  totalVoters={1547}
                  totalActs={596}
                  totalWitnesses={500}
                />
              </div>
              {presidentialData.length === 0 ? (
                <div className="border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-xl text-gray-600">Sin datos</p>
                </div>
              ): (
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
                    </div>
                  </div>
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
