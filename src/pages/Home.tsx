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
            <p className="mt-6 text-lg font-medium text-gray-700 uppercase tracking-wide">
              Elecciones generales Bolivia 2025
            </p>
          </div>
        </div>
      </div>

      {/* Mobile App Download Section */}
      <div className="bg-blue-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Descarga la aplicación
            </h2>
            <div className="flex flex-col items-center space-y-6">
              <img
                src="/src/assets/tuvotodecide.webp"
                alt="Tu Voto Decide App"
                className="w-48 h-auto rounded-lg shadow-lg"
              />
              <a
                href="https://play.google.com/store/apps/details?id=com.tuvotodecide"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                Descargar desde Google Play
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Contacto</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Para más información, visite:</p>
              <a
                href="https://asoblockchainbolivia.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline transition-colors duration-200"
              >
                https://asoblockchainbolivia.org
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
