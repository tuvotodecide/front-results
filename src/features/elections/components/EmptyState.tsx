// Empty State para usuarios logueados sin elecciones
// Basado en captura 01_empty_state.png

import React from 'react';

interface EmptyStateProps {
  onCreateClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateClick }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Card Verde */}
        <div className="bg-[#459151] rounded-2xl p-8 md:p-12 mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Tu voto decide
              </h1>
              <p className="text-lg text-green-100">
                Plataforma para el control electoral
              </p>
              <p className="text-lg text-green-100">
                Y votaciones
              </p>
            </div>

            {/* Icono decorativo */}
            <div className="hidden md:flex w-32 h-32 bg-white/20 rounded-2xl items-center justify-center">
              <svg
                className="w-16 h-16 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card Blanca de Bienvenida */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Bienvenido a Tu voto decide
          </h2>

          <div className="text-gray-600 space-y-4 mb-8 max-w-4xl mx-auto">
            <p>
              Esta plataforma permite a los ciudadanos bolivianos monitorear y participar
              activamente en el proceso electoral de Bolivia 2026. Aquí podrás encontrar
              información actualizada sobre las votaciones, resultados en tiempo real, y
              noticias relacionadas con el proceso democrático.
            </p>
            <p>
              Nuestro objetivo es promover la transparencia y la participación ciudadana
              en el sistema electoral boliviano. Con herramientas accesibles y confiables,
              trabajamos para fortalecer la democracia y asegurar que cada voto cuente.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={onCreateClick}
              className="inline-flex items-center gap-2 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold px-8 py-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Crear votación
            </button>
            <p className="text-sm text-gray-500 text-center max-w-md">
              Crea la votación para configurar cargos, candidatos y padrón después.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
