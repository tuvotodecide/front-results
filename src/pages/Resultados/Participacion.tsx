import { useEffect, useState } from "react";
import BarChart from "../../components/BarChart";
import D3PieChart from "../../components/D3PieChart";
import ResultsTable from "../../components/ResultsTable";
import { useGetStatisticsQuery } from "../../store/resultados/resultadosEndpoints";

const Participacion = () => {
  const { data: { votingStatistics = [] } = {} } = useGetStatisticsQuery();
  const [activeTab, setActiveTab] = useState("bars");
  const [resultsData, setResultsData] = useState<
    { value: number; name: string; color: string }[]
  >([]);

  useEffect(() => {
    if (votingStatistics) {
      console.log("votingStatistics", votingStatistics);
      const data = [
        {
          value: votingStatistics.validVotes,
          name: "Validos",
          color: "#6bdf89",
        },
        {
          value: votingStatistics.blankVotes,
          name: "Blanco",
          color: "#fff9b3",
        },
        {
          value: votingStatistics.nullVotes,
          name: "Nulos",
          color: "#b7b7b7",
        },
      ];
      setResultsData(data);
    }
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="lg:col-span-1 lg:mb-0">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-300 bg-gray-50 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-600 ">
              Tabla de Resultados
            </h2>
          </div>
          <div className="p-6">
            <ResultsTable resultsData={resultsData} />
          </div>
        </div>
      </section>

      <section className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-300 bg-gray-50 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-600 ">
              Visualización de Resultados
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
              </div>
            </div>
            {activeTab === "bars" && <BarChart data={resultsData} />}
            {activeTab === "pie" && <D3PieChart data={resultsData} />}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Participacion;
