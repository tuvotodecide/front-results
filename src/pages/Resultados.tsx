import React from "react";
import BarChart from "../components/BarChart";
import D3PieChart from "../components/D3PieChart";
import ResultsTable from "../components/ResultsTable";

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

const Resultados: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState("bars");

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">
        Resultados
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800">
            Tabla de Resultados
          </h2>
          <div className="bg-white p-6 rounded-lg shadow-sm h-full">
            <ResultsTable resultsData={resultsData} />
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800">
            Gráficos
          </h2>
          <div className="bg-white p-6 rounded-lg shadow-sm h-full">
            <div className="mb-4 border-b border-gray-200">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("bars")}
                  className={`pb-2 px-4 ${
                    activeTab === "bars"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Gráfico de Barras
                </button>
                <button
                  onClick={() => setActiveTab("pie")}
                  className={`pb-2 px-4 ${
                    activeTab === "pie"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Gráfico Circular
                </button>
              </div>
            </div>
            {activeTab === "bars" && <BarChart resultsData={resultsData} />}
            {activeTab === "pie" && <D3PieChart resultsData={resultsData} />}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Resultados;
