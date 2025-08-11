import { useEffect, useState } from 'react';
import { Eye, FileText, Users } from 'lucide-react';
import SearchBar from '../../components/SearchBar';
import LocationSection from './LocationSection';
import Graphs from './Graphs';
import ImagesSection from './ImagesSection';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetElectoralTableByTableCodeQuery } from '../../store/electoralTables/electoralTablesEndpoints';
import { useLazyGetResultsByLocationQuery } from '../../store/resultados/resultadosEndpoints';
import SimpleSearchBar from '../../components/SimpleSearchBar';
import StatisticsBars from './StatisticsBars';
import BackButton from '../../components/BackButton';

const combinedData = [
  { name: 'Party A', value: 100, color: '#FF6384' },
  { name: 'Party B', value: 200, color: '#36A2EB' },
  { name: 'Party C', value: 150, color: '#FFCE56' },
  { name: 'Party D', value: 80, color: '#4BC0C0' },
  { name: 'Party E', value: 120, color: '#9966FF' },
  { name: 'Party F', value: 90, color: '#FF9F40' },
  { name: 'Party G', value: 60, color: '#FF6384' },
  { name: 'Party H', value: 110, color: '#36A2EB' },
];

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
    id: 'images',
    name: 'Imagenes',
    icon: {
      component: FileText,
      color: 'text-blue-600',
      background: 'bg-blue-100',
    },
  },
];

const ResultadosMesa2 = () => {
  const { tableCode } = useParams();
  const navigate = useNavigate();
  const [getResultsByLocation] = useLazyGetResultsByLocationQuery({});
  const [presidentialData, setPresidentialData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [deputiesData, setDeputiesData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [participation, setParticipation] = useState<
    Array<{ name: string; value: any; color: string }>
  >([]);
  const {
    data: electoralTableData,
    error: electoralTableError,
    isError: isElectoralTableError,
  } = useGetElectoralTableByTableCodeQuery(tableCode || '', {
    skip: !tableCode, // Skip the query if tableCode is falsy
  });

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm) return;
    navigate(`/resultados/mesa/${searchTerm}`);
    // console.log('Search term:', searchTerm);
    // Implement search functionality here
  };

  useEffect(() => {
    if (electoralTableData) {
      console.log('Fetched electoral table data:', electoralTableData);
      // Process the electoral table data as needed
    }
  }, [electoralTableData]);

  useEffect(() => {
    if (tableCode && electoralTableData) {
      getResultsByLocation({ tableCode, electionType: 'presidential' })
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
  }, [tableCode, electoralTableData]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          Resultados por Mesa
        </h1>

        {!tableCode ? (
          <div className="bg-white rounded-xl shadow-lg py-12 px-6">
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-600 mb-8">
                Introduzca el codigo de mesa
              </h1>
              <SimpleSearchBar
                className="w-full max-w-md"
                onSearch={handleSearch}
              />
            </div>
          </div>
        ) : isElectoralTableError ? (
          <div className="bg-white rounded-xl shadow-lg py-12 px-6">
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-600 mb-4">
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
          <div className="bg-white rounded-xl shadow-lg py-6 px-6">
            <div className="flex items-center mb-4 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-600">
                <BackButton className="mr-4" />
                {electoralTableData
                  ? `Mesa #${electoralTableData?.tableNumber} - ${electoralTableData?.tableCode}`
                  : 'No se encontró la mesa'}
              </h1>
              <SimpleSearchBar
                className="shrink-1 ml-auto"
                onSearch={handleSearch}
              />
            </div>
            {electoralTableData && (
              <div className="bg-gray-50 rounded-lg shadow-sm p-4 mb-4 flex flex-row flex-wrap gap-8">
                <div className="basis-[450px] grow-2 shrink-0">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
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
                <div className="basis-[300px] grow-1 shrink-0">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                    Datos Mesa
                  </h3>
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <h3 className="text-md font-bold lg:text-lg text-gray-600">
                        Numero de mesa
                      </h3>
                      <h3 className="text-md font-bold lg:text-lg">
                        {electoralTableData?.tableNumber}
                      </h3>
                    </div>
                    <div>
                      <h3 className="text-md font-bold lg:text-lg text-gray-600">
                        Codigo de mesa
                      </h3>
                      <h3 className="text-md font-bold lg:text-lg">
                        {electoralTableData?.tableCode}
                      </h3>
                    </div>
                    <div className="w-full">
                      <h3 className="text-md font-bold lg:text-lg text-gray-600">
                        Direccion
                      </h3>
                      <h3 className="text-md font-bold lg:text-lg">
                        {electoralTableData?.electoralLocation?.address}
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="basis-[100%] grow-1 shrink-0">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                    Participacion
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
              </div>
            )}
            <div className="w-full flex flex-wrap gap-4">
              <div className="bg-gray-50 rounded-lg shadow-sm overflow-hidden basis-[min(420px,100%)] grow-3 shrink-0">
                <div className=" px-0 md:px-6 py-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                    Resultados Presidenciales
                  </h3>
                  <Graphs data={presidentialData} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg shadow-sm overflow-hidden basis-[min(420px,100%)] grow-3 shrink-0">
                <div className=" px-0 md:px-6 py-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                    Resultados Diputados
                  </h3>
                  <Graphs data={deputiesData} />
                  {/* {selectedOption.id === 'images' && <ImagesSection />} */}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg shadow-sm p-4 mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                Imagenes
              </h3>
              <ImagesSection />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultadosMesa2;
