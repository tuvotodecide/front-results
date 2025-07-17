import { useEffect, useState } from 'react';
import Mapa from '../../components/Mapa';
import BarChart from '../../components/BarChart';
import D3PieChart from '../../components/D3PieChart';
import ResultsTable from '../../components/ResultsTable';
import { useGetResultsQuery } from '../../store/resultados/resultadosEndpoints';
import { useGetPartidosQuery } from '../../store/partidos/partidosEndpoints';

interface Department {
  code: string;
  name: string;
}

// const resultsData = [
//   { value: 87, ballotCount: 1, name: "MAS-IPSP", color: "#1a53ff" },
//   { value: 33, ballotCount: 1, name: "C.C.", color: "#ffa300" },
//   { value: 17, ballotCount: 1, name: "MTS", color: "#ebdc78" },
//   { value: 3, ballotCount: 1, name: "FPV", color: "#b30000" },
//   { value: 1, ballotCount: 1, name: "UCS", color: "#7c1158" },
//   { value: 1, ballotCount: 1, name: "MNR", color: "#fdcce5" },
//   { value: 12, ballotCount: 1, name: "PDC", color: "#ffee65" },
//   { value: 23, ballotCount: 1, name: "PAN-BOL", color: "#87bc45" },
//   { value: 16, ballotCount: 1, name: "21F", color: "#9b19f5" },
//   { value: 33, ballotCount: 1, name: "otros", color: "#9b59f5" },
// ];

const ResultadosLocalidad = () => {
  const [resultsData, setResultsData] = useState([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [activeTab, setActiveTab] = useState('bars');
  const { data: { results = [] } = {} } = useGetResultsQuery({
    department: selectedDept ? selectedDept.name : undefined,
  });
  const { data: items = [] } = useGetPartidosQuery();

  const handleDepartmentClick = (department: Department) => {
    // console.log("Selected Department:", department);
    setSelectedDept(department);
    console.log('Selected Department:', department);
  };

  useEffect(() => {
    if (results.length && items.length) {
      const combinedData = results.map((result: any) => {
        const matchingParty = items.find(
          (item) => item.partyId === result.partyId
        );
        return {
          name: result.partyId,
          value: result.totalVotes,
          color: matchingParty?.color || '#000000', // fallback color if no match found
        };
      });
      setResultsData(combinedData);
    } else {
      setResultsData([]);
    }
  }, [results, items]);

  return (
    <div className="map-container">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Mapa onDepartmentClick={handleDepartmentClick} />
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-300 bg-gray-50 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-600">
              Visualización de Resultados{' '}
              {selectedDept ? `- ${selectedDept.name}` : ''}
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-4 border-b border-gray-200">
              <div className="flex gap-4">
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
              </div>
            </div>
            {activeTab === 'bars' && <BarChart data={resultsData} />}
            {activeTab === 'pie' && <D3PieChart data={resultsData} />}
            {activeTab === 'table' && (
              <ResultsTable resultsData={resultsData} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultadosLocalidad;
