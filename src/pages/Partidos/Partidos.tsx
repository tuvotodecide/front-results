import React, { useEffect } from "react";
import {
  useGetRecintosQuery,
  useDeleteRecintoMutation,
} from "../../store/recintos/recintosEndpoints";
import { useNavigate } from "react-router-dom";

const Partidos: React.FC = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="w-full max-w-4xl p-8 bg-white rounded shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-red-600">
            Recintos Electorales
          </h1>
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Agregar Recinto
          </button>
        </div>
      </div>
    </div>
  );
};

export default Partidos;
