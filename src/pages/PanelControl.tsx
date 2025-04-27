import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserEdit,
  FaFileAlt,
  FaChartBar,
  FaChalkboardTeacher,
} from "react-icons/fa";

const PanelControl: React.FC = () => {
  const navigate = useNavigate();

  const cards = [
    {
      icon: <FaChalkboardTeacher className="text-gray-600 text-4xl" />,
      title: "Partidos",
      description: "Administra los partidos electorales.",
      path: "/partidos",
    },
    {
      icon: <FaChalkboardTeacher className="text-gray-600 text-4xl" />,
      title: "Recintos Electorales",
      description: "Administra los recintos electorales.",
      path: "/recintos",
    },
    {
      icon: <FaUserEdit className="text-gray-600 text-4xl" />,
      title: "Registro de Jurado",
      description: "Registra nuevos jurados para el sistema.",
      path: "/registroJurado",
    },
    {
      icon: <FaFileAlt className="text-gray-600 text-4xl" />,
      title: "Envio de Acta",
      description: "Envía actas de evaluación de manera rápida.",
      path: "/actas/nuevo",
    },
    {
      icon: <FaChartBar className="text-gray-600 text-4xl" />,
      title: "Resultados",
      description: "Consulta los resultados de las evaluaciones.",
      path: "/resultados",
    },
  ];

  return (
    <div className="flex flex-col items-left bg-gray-100 p-8">
      <div className="w-full p-8 bg-white rounded shadow-md">
        {/* <h1 className="text-2xl font-bold text-left mb-6">Panel de Control</h1> */}
        <h1 className="text-2xl font-bold text-left mb-8 text-gray-600 border-b pb-4 border-gray-300">
          Panel de Control
        </h1>
        <div className="grid grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <div
              key={index}
              className="p-6 bg-gray-50 rounded-lg shadow hover:shadow-lg cursor-pointer transition"
              onClick={() => navigate(card.path)}
            >
              <div className="flex items-center justify-left mb-4">
                {card.icon}
              </div>
              <h2 className="text-lg font-semibold text-gray-800 text-left">
                {card.title}
              </h2>
              <p className="text-sm text-gray-600 text-left mt-2">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PanelControl;
