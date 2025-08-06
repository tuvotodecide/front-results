import { useEffect, useState } from 'react';
import { useGetDepartmentsQuery } from '../../store/departments/departmentsEndpoints';
import Breadcrumb2 from '../../components/Breadcrumb2';
import { useSelector } from 'react-redux';
import { Eye, FileText, Users } from 'lucide-react';
import { selectFilters } from '../../store/resultados/resultadosSlice';
import { useLazyGetResultsByLocationQuery } from '../../store/resultados/resultadosEndpoints';
import Graphs from './Graphs';
import StatisticsBars from './StatisticsBars';
import TablesSection from './TablesSection';

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

const menuOptions = [
  {
    id: 'resultados_presidenciales',
    name: 'Resultados presidenciales',
    icon: {
      component: Eye,
      color: 'text-purple-600',
      background: 'bg-purple-100',
    },
  },
  {
    id: 'resultados_diputados',
    name: 'Resultados diputados',
    icon: {
      component: Users,
      color: 'text-green-600',
      background: 'bg-green-100',
    },
  },
  {
    id: 'tables',
    name: 'Mesas',
    icon: {
      component: FileText,
      color: 'text-blue-600',
      background: 'bg-blue-100',
    },
  },
];

const ResultadosGenerales3 = () => {
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
  const [selectedOption, setSelectedOption] = useState(menuOptions[0]);
  useGetDepartmentsQuery({});
  const [getResultsByLocation] = useLazyGetResultsByLocationQuery({});
  const filters = useSelector(selectFilters);

  useEffect(() => {
    if (filters) {
      console.log('Current filters:', filters);
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([key, value]) => value !== '' && key !== 'electoralLocation'
        )
      );
      console.log('Cleaned filters:', cleanedFilters);
      getResultsByLocation({ ...cleanedFilters, electionType: 'presidential' })
        .unwrap()
        .then((data) => {
          console.log('Fetched presidential data:', data);
          const formattedData = data.results.map((item: any) => {
            // Generate random hex color if color not provided
            const randomColor =
              '#' + Math.floor(Math.random() * 16777215).toString(16);
            return {
              name: item.partyId,
              value: item.totalVotes,
              color: item.color || randomColor, // Use random color as fallback
            };
          });
          setPresidentialData(formattedData);

          const participationData = [
            {
              name: 'Válidos',
              // value: data.summary?.validVotes || 0,
              value: 80,
              color: '#8cc689', // Green
            },
            {
              name: 'Nulos',
              // value: data.summary?.nullVotes || 0,
              value: 24,
              color: '#81858e', // Red
            },
            {
              name: 'Blancos',
              // value: data.summary?.blankVotes || 0,
              value: 15,
              color: '#f3f3ce', // Yellow
            },
          ];
          setParticipation(participationData);
        });
      getResultsByLocation({ ...cleanedFilters, electionType: 'deputies' })
        .unwrap()
        .then((data) => {
          console.log('Fetched deputies data:', data);
          const formattedData = data.results.map((item: any) => {
            // Generate random hex color if color not provided
            const randomColor =
              '#' + Math.floor(Math.random() * 16777215).toString(16);
            return {
              name: item.partyId,
              value: item.totalVotes,
              color: item.color || randomColor, // Use random color as fallback
            };
          });
          setDeputiesData(formattedData);
        });
    }
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          Resultados Generales
        </h1>
        <div className="bg-white rounded-xl shadow-lg py-6 px-6">
          <div>
            <Breadcrumb2 />
          </div>
          <div className="bg-gray-50 rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
              Estadisticas Generales
            </h3>
            <StatisticsBars
              voteData={participation}
              processedTables={{ current: 1556, total: 2678 }}
              totalTables={456}
              totalVoters={1547}
              totalActs={596}
              totalWitnesses={500}
            />
          </div>
          <div className="w-full flex flex-wrap gap-4">
            <div className="bg-gray-50 rounded-lg shadow-sm p-4 basis-[200px] grow-1 shrink-0">
              <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                Opciones
              </h3>

              <div className="flex flex-wrap gap-4">
                {menuOptions.map((option) => (
                  <div
                    key={option.name}
                    onClick={() => setSelectedOption(option)}
                    className={`bg-gray-50 rounded-lg p-4 border ${
                      selectedOption.id === option.id
                        ? 'border-gray-500 shadow-lg'
                        : 'border-gray-200 hover:shadow-md'
                    } transition-all duration-200 basis-[min(200px,100%)] grow-1`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`text-lg ${
                            selectedOption.id === option.id
                              ? 'font-semibold'
                              : ''
                          } text-gray-800`}
                        >
                          {option.name}
                        </p>
                      </div>
                      <div
                        className={`${option.icon.background} p-3 rounded-full`}
                      >
                        <option.icon.component
                          className={`w-4 h-4 ${option.icon.color}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Última actualización: {new Date().toLocaleDateString('es-ES')}
                </p>
              </div> */}
            </div>
            <div className="bg-gray-50 rounded-lg shadow-sm overflow-hidden basis-[min(420px,100%)] grow-3 shrink-0">
              {/* <div className="border-b border-gray-300 bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-600">
                  Visualización de Resultados{' '}
                </h2>
              </div> */}

              <div className=" px-0 md:px-6 py-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                  {selectedOption.name}
                </h3>
                {selectedOption.id === 'resultados_presidenciales' && (
                  // <Graphs data={presidentialData} />
                  <Graphs data={presidentialData} />
                )}
                {selectedOption.id === 'resultados_diputados' && (
                  // <Graphs data={deputiesData} />
                  <Graphs data={deputiesData} />
                )}
                {selectedOption.id === 'tables' && <TablesSection />}
              </div>
            </div>
          </div>
          {/* Mesas */}
        </div>
      </div>
    </div>
  );
};

export default ResultadosGenerales3;
