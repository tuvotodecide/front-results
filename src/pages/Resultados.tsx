import React from "react";
import BarChart from "../components/Barchart";

const Resultados: React.FC = () => {
  return (
    <div className="p-2 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Resultados</h1>
      <BarChart />
    </div>
  );
};

export default Resultados;
