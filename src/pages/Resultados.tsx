import React from "react";
import BarChart from "../components/Barchart";

const Resultados: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">
        Resultados
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <BarChart />
      </div>
    </div>
  );
};

export default Resultados;
