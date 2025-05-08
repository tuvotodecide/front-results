import { useEffect, useState } from "react";
import BarChart from "../../components/BarChart";
import D3PieChart from "../../components/D3PieChart";
import ResultsTable from "../../components/ResultsTable";
import { useGetResultsQuery } from "../../store/resultados/resultadosEndpoints";
import { useGetPartidosQuery } from "../../store/partidos/partidosEndpoints";

const resultsData = [
  {
    totalVotes: 87,
    ballotCount: 1,
    partyId: "MAS-IPSP",
    color: "#1a53ff",
  },
  {
    totalVotes: 33,
    ballotCount: 1,
    partyId: "C.C.",
    color: "#ffa300",
  },
  {
    totalVotes: 17,
    ballotCount: 1,
    partyId: "MTS",
    color: "#ebdc78",
  },
  {
    totalVotes: 3,
    ballotCount: 1,
    partyId: "FPV",
    color: "#b30000",
  },
  {
    totalVotes: 1,
    ballotCount: 1,
    partyId: "UCS",
    color: "#7c1158",
  },
  {
    totalVotes: 1,
    ballotCount: 1,
    partyId: "MNR",
    color: "#fdcce5",
  },
  {
    totalVotes: 12,
    ballotCount: 1,
    partyId: "PDC",
    color: "#ffee65",
  },
  {
    totalVotes: 23,
    ballotCount: 1,
    partyId: "PAN-BOL",
    color: "#87bc45",
  },
  {
    totalVotes: 16,
    ballotCount: 1,
    partyId: "21F",
    color: "#9b19f5",
  },
  {
    totalVotes: 33,
    ballotCount: 1,
    partyId: "otros",
    color: "#9b59f5",
  },
];

const ResultadosGenerales = () => {
  const [resultsData, setResultsData] = useState([]);
  const [activeTab, setActiveTab] = useState("bars");
  const { data: { results = [] } = {} } = useGetResultsQuery();
  const { data: items = [] } = useGetPartidosQuery();

  useEffect(() => {
    console.log("data", results);
    console.log("items", items);
  }, [results, items]);

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
    }
  }, [results, items]);

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

export default ResultadosGenerales;
