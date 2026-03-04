// Modal de resumen después de cargar el padrón
// Basado en captura 03_result_summary_modal.png

import React from 'react';
import Modal2 from '../../../components/Modal2';

interface UploadSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  validCount: number;
  invalidCount: number;
  onContinue: () => void;
  onFix: () => void;
}

const DocumentIcon = () => (
  <svg
    className="w-20 h-20"
    viewBox="0 0 80 80"
    fill="none"
  >
    {/* Documento */}
    <rect x="20" y="12" width="40" height="52" rx="3" stroke="#459151" strokeWidth="2" fill="none" />
    {/* Esquina doblada */}
    <path d="M46 12v14h14" stroke="#459151" strokeWidth="2" strokeLinejoin="round" fill="none" />
    <path d="M46 12l14 14" stroke="#459151" strokeWidth="2" strokeLinejoin="round" />
    {/* Líneas de texto */}
    <line x1="28" y1="36" x2="52" y2="36" stroke="#459151" strokeWidth="2" strokeLinecap="round" />
    <line x1="28" y1="44" x2="52" y2="44" stroke="#459151" strokeWidth="2" strokeLinecap="round" />
    <line x1="28" y1="52" x2="44" y2="52" stroke="#459151" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-6 h-6 text-[#459151]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" fill="#459151" stroke="none" />
    <path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" fill="#dc2626" stroke="none" />
    <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const UploadSummaryModal: React.FC<UploadSummaryModalProps> = ({
  isOpen,
  onClose,
  validCount,
  invalidCount,
  onContinue,
  onFix,
}) => {
  const formatNumber = (num: number) => num.toLocaleString('es-ES');

  return (
    <Modal2
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
      showClose={false}
      type="plain"
    >
      <div className="py-4 text-center">
        {/* Icono */}
        <div className="flex justify-center mb-6">
          <DocumentIcon />
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Cargando padrón...</h2>

        {/* Cards de resultados */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Card Válidos */}
          <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckIcon />
              <span className="font-semibold text-gray-700">Válidos</span>
              <span className="text-2xl font-bold text-[#459151]">{formatNumber(validCount)}</span>
            </div>
            <p className="text-sm text-[#459151]">Registros habilitados para votar</p>
          </div>

          {/* Card Inválidos */}
          <div className="border-2 border-red-200 bg-red-50 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ErrorIcon />
              <span className="font-semibold text-gray-700">Inválidos</span>
              <span className="text-2xl font-bold text-red-600">{formatNumber(invalidCount)}</span>
            </div>
            <p className="text-sm text-red-600">Errores de formato o datos</p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={onContinue}
            className="px-8 py-3 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold rounded-lg transition-colors"
          >
            Continuar
          </button>
          {invalidCount > 0 && (
            <button
              type="button"
              onClick={onFix}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Corregir
            </button>
          )}
        </div>
      </div>
    </Modal2>
  );
};

export default UploadSummaryModal;
