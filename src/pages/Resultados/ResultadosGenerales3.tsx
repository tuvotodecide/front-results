import { use, useEffect, useMemo, useState } from 'react';
import Mapa from '../../components/Mapa';
import BarChart from '../../components/BarChart';
import D3PieChart from '../../components/D3PieChart';
import ResultsTable from '../../components/ResultsTable';
import { useGetResultsQuery } from '../../store/resultados/resultadosEndpoints';
import { useGetPartidosQuery } from '../../store/partidos/partidosEndpoints';
import { departamentos, provincias, municipios } from './datos';
import { Breadcrumb } from '../../components/Breadcrumb';
import {
  useGetDepartmentsQuery,
  useLazyGetMunicipalitiesQuery,
  useLazyGetProvincesQuery,
} from '../../store/recintos/recintosEndpoints';
import SearchBar from '../../components/SearchBar';
import Breadcrumb2 from '../../components/Breadcrumb2';
import { Eye, FileText, Users } from 'lucide-react';

interface Department {
  code: string;
  name: string;
}

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

const ResultadosGenerales3 = () => {
  // const [resultsData, setResultsData] = useState([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    department: string | null;
    province: string | null;
    municipality: string | null;
  }>({
    department: null,
    province: null,
    municipality: null,
  });
  const [activeTab, setActiveTab] = useState('table');
  const [provinces, setProvinces] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  // const { data: { results = [] } = {} } = useGetResultsQuery({
  //   department: selectedLocation.department || undefined,
  // });
  // const { data: items = [] } = useGetPartidosQuery();
  // const { data: departments = [] } = useGetDepartmentsQuery();
  // const [getProvinces] = useLazyGetProvincesQuery();
  // const [getMunicipalities] = useLazyGetMunicipalitiesQuery();

  const mesas: any[] = [
    { id: 123, person: 'JANE DRINKS', date: '13 June 2023' },
    { id: 24, person: 'TONY HUNGRY', date: '13 June 2023' },
    { id: 32, person: 'TONY HUNGRY', date: '13 June 2023' },
    { id: 15, person: 'JANE DRINKS', date: '13 June 2023' },
    { id: 44, person: 'JANE DRINKS', date: '13 June 2023' },
    { id: 23, person: 'TONY HUNGRY', date: '13 June 2023', hasNote: true },
    { id: 1255, person: 'JANE DRINKS', date: '13 June 2023' },
    { id: 78, person: 'MIKE SILVA', date: '13 June 2023' },
  ];

  // useEffect(() => {
  //   console.log('Selected Department:', departments);
  // }, [departments]);

  // useEffect(() => {
  //   if (results.length && items.length) {
  //     const combinedData = results.map((result) => {
  //       const matchingParty = items.find(
  //         (item) => item.partyId === result.partyId
  //       );
  //       return {
  //         name: result.partyId,
  //         value: result.totalVotes,
  //         color: matchingParty?.color || "#000000", // fallback color if no match found
  //       };
  //     });
  //     setResultsData(combinedData);
  //   } else {
  //     setResultsData([]);
  //   }
  // }, [results, items]);

  // const combinedData = useMemo(() => {
  //   if (!results?.length || !items?.length) return [];

  //   return results.map((result) => {
  //     const matchingParty = items.find(
  //       (item) => item.partyId === result.partyId
  //     );
  //     return {
  //       name: result.partyId,
  //       value: result.totalVotes,
  //       color: matchingParty?.color || '#000000',
  //     };
  //   });
  // }, [results, items]);

  // const handleDepartmentClick = (department: Department) => {
  //   // console.log("Selected Department:", department);
  //   //setSelectedDept(department);
  //   console.log('Selected Department:', department);
  // };

  // const handleSelectionChange = (selection: {
  //   department: string | null;
  //   province: string | null;
  //   municipality: string | null;
  // }) => {
  //   console.log('Selection changed:', selection);
  //   // setSelectedLocation({
  //   //   department: selection.departamento,
  //   //   province: selection.provincia,
  //   //   municipality: selection.municipio,
  //   // });
  //   if (
  //     selection.department &&
  //     selection.department !== selectedLocation.department
  //   ) {
  //     console.log('calling getProvinces with:', selection.department);
  //     getProvinces(selection.department).then((response) => {
  //       setProvinces(response.data ?? []);
  //     });
  //     setSelectedLocation({
  //       department: selection.department,
  //       province: null,
  //       municipality: null,
  //     });
  //   } else if (
  //     selection.department &&
  //     selection.province &&
  //     selection.province !== selectedLocation.province
  //   ) {
  //     console.log('calling getMunicipalities with:', {
  //       department: selection.department,
  //       province: selection.province,
  //     });
  //     getMunicipalities({
  //       department: selection.department,
  //       province: selection.province,
  //     }).then((response) => {
  //       setMunicipalities(response.data ?? []);
  //     });
  //     setSelectedLocation({
  //       department: selection.department,
  //       province: selection.province,
  //       municipality: null,
  //     });
  //   } else if (selection.department === null) {
  //     setSelectedLocation({
  //       department: null,
  //       province: null,
  //       municipality: null,
  //     });
  //   }

  //   // if (selection.departamento) {
  //   //   setSelectedDept(selection.departamento);
  //   //   getProvinces(selection.departamento).then((response) => {
  //   //     const formatedProvinces = (response.data ?? []).map((prov) => ({
  //   //       value: prov,
  //   //       name: prov,
  //   //     }));
  //   //     setProvinces(formatedProvinces);
  //   //   });
  //   // }
  //   // if (selection.province) {
  //   //   getMunicipalities(selection.province).then((response) => {
  //   //     setMunicipalities(response.data || []);
  //   //   });
  //   // }
  // };
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
          <div className="w-full grid gap-6 grid-cols-1 sm:grid-cols-[minmax(300px,1fr)_250px] md:grid-cols-[minmax(300px,1fr)_300px]">
            <div className="bg-gray-50 rounded-lg shadow-sm overflow-hidden">
              {/* <div className="border-b border-gray-300 bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-600">
                  Visualización de Resultados{' '}
                </h2>
              </div> */}
              <div className="border-b border-gray-300  px-6 py-4">
                <div className="mb-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('table')}
                      className={`pb-2 px-4 font-medium ${
                        activeTab === 'table'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Tabla
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('bars')}
                      className={`pb-2 px-4 font-medium ${
                        activeTab === 'bars'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Gráfico de Barras
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('pie')}
                      className={`pb-2 px-4 font-medium ${
                        activeTab === 'pie'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Gráfico Circular
                    </button>
                  </div>
                </div>
                {activeTab === 'table' && (
                  <ResultsTable resultsData={combinedData} />
                )}
                {activeTab === 'bars' && <BarChart data={combinedData} />}
                {activeTab === 'pie' && <D3PieChart data={combinedData} />}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg shadow-sm p-4">
              <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                Datos estadísticos
              </h3>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Número de actas
                      </p>
                      <p className="text-2xl font-bold text-gray-800">360</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Número de mesas
                      </p>
                      <p className="text-2xl font-bold text-gray-800">120</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Número de atestiguamientos
                      </p>
                      <p className="text-2xl font-bold text-gray-800">1,000</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <Eye className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Última actualización: {new Date().toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </div>
          {/* Mesas */}

          <div className="bg-gray-50 rounded-lg shadow-sm overflow-hidden mt-6">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-gray-800">Mesas</h2>
            </div>

            {/* Grid Content */}
            <div className="p-6">
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                }}
              >
                {mesas.map((mesa) => (
                  <div key={mesa.id} className="relative min-w-[200px]">
                    {/* Card */}
                    <div className="bg-gray-200 rounded-lg overflow-hidden shadow-sm">
                      {/* Background area instead of image */}
                      <div className="h-32 bg-gradient-to-br from-gray-300 to-gray-400"></div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 text-lg mb-3">
                          Mesa {mesa.id}
                        </h3>

                        {/* Footer Info */}
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span className="truncate mr-2">{mesa.person}</span>
                          <span className="whitespace-nowrap">{mesa.date}</span>
                        </div>
                      </div>

                      {/* Load Notes Overlay */}
                      {mesa.hasNote && (
                        <div className="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 rounded text-xs">
                          Load Notes
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultadosGenerales3;
