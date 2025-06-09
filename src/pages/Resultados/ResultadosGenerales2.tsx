import { useEffect, useState } from "react";
import Mapa from "../../components/Mapa";
import BarChart from "../../components/BarChart";
import D3PieChart from "../../components/D3PieChart";
import ResultsTable from "../../components/ResultsTable";
import { useGetResultsQuery } from "../../store/resultados/resultadosEndpoints";
import { useGetPartidosQuery } from "../../store/partidos/partidosEndpoints";
import { departamentos, provincias, municipios } from "./datos";
import { Breadcrumb } from "../../components/Breadcrumb";

interface Department {
  code: string;
  name: string;
}

const ResultadosLocalidad = () => {
  const [resultsData, setResultsData] = useState([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [activeTab, setActiveTab] = useState("bars");
  const { data: { results = [] } = {} } = useGetResultsQuery({
    department: selectedDept ? selectedDept.name : undefined,
  });
  const { data: items = [] } = useGetPartidosQuery();

  const handleDepartmentClick = (department: Department) => {
    // console.log("Selected Department:", department);
    setSelectedDept(department);
    console.log("Selected Department:", department);
  };

  useEffect(() => {
    if (results.length && items.length) {
      const combinedData = results.map((result) => {
        const matchingParty = items.find(
          (item) => item.partyId === result.partyId
        );
        return {
          name: result.partyId,
          value: result.totalVotes,
          color: matchingParty?.color || "#000000", // fallback color if no match found
        };
      });
      setResultsData(combinedData);
    } else {
      setResultsData([]);
    }
  }, [results, items]);
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          Resultados Generales
        </h1>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div>
            <Breadcrumb
              departamentos={departamentos}
              provincias={provincias}
              municipios={municipios}
              onSelectionChange={(selection) => {
                console.log("Parent received selection:", selection);
              }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg shadow-sm p-4">
              <Mapa onDepartmentClick={handleDepartmentClick} />
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="border-b border-gray-300 bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-600">
                  Visualización de Resultados{" "}
                  {selectedDept ? `- ${selectedDept.name}` : ""}
                </h2>
              </div>
              <div className="p-6">
                <div className="mb-4 border-b border-gray-200">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab("bars")}
                      className={`pb-2 px-4 font-medium ${
                        activeTab === "bars"
                          ? "border-b-2 border-blue-500 text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Gráfico de Barras
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("pie")}
                      className={`pb-2 px-4 font-medium ${
                        activeTab === "pie"
                          ? "border-b-2 border-blue-500 text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Gráfico Circular
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("table")}
                      className={`pb-2 px-4 font-medium ${
                        activeTab === "table"
                          ? "border-b-2 border-blue-500 text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Tabla
                    </button>
                  </div>
                </div>
                {activeTab === "bars" && <BarChart data={resultsData} />}
                {activeTab === "pie" && <D3PieChart data={resultsData} />}
                {activeTab === "table" && (
                  <ResultsTable resultsData={resultsData} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultadosLocalidad;
