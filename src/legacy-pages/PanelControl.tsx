import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileAlt } from 'react-icons/fa';

const PanelControl: React.FC = () => {
  const navigate = useNavigate();

  const cards = [
    {
      icon: <FaFileAlt className="text-gray-600 text-4xl" />,
      title: 'Departamentos',
      description: 'Administra los departamentos.',
      path: '/departamentos',
    },
    {
      icon: <FaFileAlt className="text-gray-600 text-4xl" />,
      title: 'Provincias',
      description: 'Administra las provincias.',
      path: '/provincias',
    },
    {
      icon: <FaFileAlt className="text-gray-600 text-4xl" />,
      title: 'Municipios',
      description: 'Administra los municipios.',
      path: '/municipios',
    },
    {
      icon: <FaFileAlt className="text-gray-600 text-4xl" />,
      title: 'Asientos Electorales',
      description: 'Administrar los Asientos Electorales.',
      path: '/asientos-electorales',
    },
    {
      icon: <FaFileAlt className="text-gray-600 text-4xl" />,
      title: 'Recintos Electorales',
      description: 'Administrar los Recintos Electorales.',
      path: '/recintos-electorales',
    },
  ];

  return (
    <div className="flex flex-col items-left bg-gray-100 p-8">
      <div className="w-full p-8 bg-white rounded shadow-md">
        {/* <h1 className="text-2xl font-bold text-left mb-6">Panel de Control</h1> */}
        <h1 className="text-2xl font-bold text-left mb-8 text-gray-600 border-b pb-4 border-gray-300">
          Panel de Control
        </h1>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
