import { useEffect, useState } from 'react';
import { Eye, FileText, Users } from 'lucide-react';
import SearchBar from '../../components/SearchBar';
import LocationSection from './LocationSection';
import Graphs from './Graphs';
import ImagesSection from './ImagesSection';
import { useParams } from 'react-router-dom';
import { useGetElectoralTableByTableCodeQuery } from '../../store/electoralTables/electoralTablesEndpoints';

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
  const { id } = useParams();
  const [selectedOption, setSelectedOption] = useState(menuOptions[0]);
  const { data: electoralTableData } = useGetElectoralTableByTableCodeQuery(
    id || '',
    {
      skip: !id, // Skip the query if id is falsy
    }
  );

  useEffect(() => {
    if (electoralTableData) {
      console.log('Fetched electoral table data:', electoralTableData);
      // Process the electoral table data as needed
    }
  }, [electoralTableData]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          Resultados por Mesa
        </h1>
        <div className="bg-white rounded-xl shadow-lg py-6 px-6">
          <div className="flex items-center mb-4 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-600">
              {electoralTableData
                ? `Mesa #${electoralTableData?.tableNumber} - ${electoralTableData?.tableCode}`
                : 'No se encontró la mesa'}
            </h1>
            <SearchBar className="shrink-1 ml-auto" />
          </div>
          {electoralTableData && (
            <div className="bg-gray-50 rounded-lg shadow-sm p-4 mb-4 flex flex-row flex-wrap gap-8">
              <div className="basis-[300px] grow-2 shrink-0">
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
            </div>
          )}
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
                  <Graphs data={combinedData} />
                )}
                {selectedOption.id === 'resultados_diputados' && (
                  <Graphs data={combinedData} />
                )}
                {selectedOption.id === 'images' && <ImagesSection />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultadosMesa2;
