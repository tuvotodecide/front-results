// Card de resumen de configuración con checklist
// Basado en captura 01_preview.png

import React from 'react';
import type { ConfigSummary } from '../data/ElectionPublishRepository.mock';

interface ConfigSummaryCardProps {
  summary: ConfigSummary;
}

const CheckIcon = () => (
  <svg className="w-5 h-5 text-[#459151]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ConfigSummaryCard: React.FC<ConfigSummaryCardProps> = ({ summary }) => {
  const isReadyToPublish = summary.positionsOk && summary.partiesOk && summary.padronOk;

  const formatNumber = (num: number) => num.toLocaleString('es-ES');

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Título */}
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Resumen de configuración
      </h3>

      {/* Checklist */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 ${summary.positionsOk ? 'text-[#459151]' : 'text-gray-300'}`}>
            <CheckIcon />
          </div>
          <span className={`text-sm ${summary.positionsOk ? 'text-gray-700' : 'text-gray-400'}`}>
            Cargos configurados
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 ${summary.partiesOk ? 'text-[#459151]' : 'text-gray-300'}`}>
            <CheckIcon />
          </div>
          <span className={`text-sm ${summary.partiesOk ? 'text-gray-700' : 'text-gray-400'}`}>
            Planchas cargadas
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 ${summary.padronOk ? 'text-[#459151]' : 'text-gray-300'}`}>
            <CheckIcon />
          </div>
          <span className={`text-sm ${summary.padronOk ? 'text-gray-700' : 'text-gray-400'}`}>
            Padrón cargado
          </span>
        </div>
      </div>

      {/* Badge de estado */}
      <div className="mb-6">
        {isReadyToPublish ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-5 h-5 text-[#459151]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-[#459151]">Listo para publicar</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <svg className="w-5 h-5 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium text-yellow-700">Configuración incompleta</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Planchas:</span>
          <span className="text-sm font-semibold text-gray-800">{summary.partiesCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Votantes:</span>
          <span className="text-sm font-semibold text-gray-800">
            {formatNumber(summary.votersCount)} registrados
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConfigSummaryCard;
