// import React from 'react';
// import { Link } from 'react-router-dom';
// import {
//   ChartPieIcon,
//   ClipboardDocumentCheckIcon,
// } from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Tu voto decide
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              Plataforma para el control electoral
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8"></div>

      {/* Info Section */}
      <div className="bg-white mt-12">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Sobre el Sistema
              </h2>
              <p className="text-gray-600">
                Nuestro sistema de conteo rápido permite la transmisión segura y
                eficiente de resultados electorales. Diseñado para garantizar la
                transparencia y precisión en el proceso de conteo de votos,
                facilitando el trabajo de jurados y personal electoral.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Información Importante
              </h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Actualización de resultados en tiempo real</li>
                <li>Sistema seguro de verificación de actas</li>
                <li>Interfaz intuitiva para el registro de datos</li>
                <li>Reportes detallados por recinto electoral</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
