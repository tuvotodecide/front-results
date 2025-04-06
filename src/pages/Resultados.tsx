import React from "react";
import BarChart from "../components/BarChart";

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
];

const Resultados: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">
        Resultados
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <BarChart resultsData={resultsData} />
      </div>
    </div>
  );
};

export default Resultados;
