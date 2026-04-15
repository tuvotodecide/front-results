// Modal de resumen después de cargar el padrón
// Basado en captura 03_result_summary_modal.png

import React from 'react';
import Modal2 from '../../../components/Modal2';

interface UploadSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCount: number;
  enabledCount: number;
  disabledCount: number;
  observedCount: number;
  onContinue: () => void;
  onFix?: () => void;
  continueLabel?: string;
  disableContinue?: boolean;
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
  totalCount,
  enabledCount,
  disabledCount,
  observedCount,
  onContinue,
  onFix,
  continueLabel = 'Continuar',
  disableContinue = false,
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

        <h2 className="text-2xl font-bold text-gray-800 mb-3">Resultado del procesamiento</h2>
        <p className="mb-8 text-sm text-gray-500">
          Revisa el resumen del documento antes de pasar al staging editable.
        </p>

        <div className="grid gap-4 mb-8 md:grid-cols-2 xl:grid-cols-4">
          <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-blue-700">Total</p>
            <p className="mt-3 text-3xl font-bold text-blue-700">{formatNumber(totalCount)}</p>
            <p className="mt-2 text-sm text-blue-600">Registros llevados al staging</p>
          </div>

          <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <CheckIcon />
              <span className="font-semibold text-gray-700">Habilitados</span>
            </div>
            <p className="text-3xl font-bold text-[#459151]">{formatNumber(enabledCount)}</p>
            <p className="mt-2 text-sm text-[#459151]">Pueden votar</p>
          </div>

          <div className="border-2 border-slate-200 bg-white rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-slate-700">Inhabilitados</p>
            <p className="mt-3 text-3xl font-bold text-slate-700">{formatNumber(disabledCount)}</p>
            <p className="mt-2 text-sm text-slate-500">No pueden votar</p>
          </div>

          <div className="border-2 border-red-200 bg-red-50 rounded-xl p-4 text-left">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ErrorIcon />
              <span className="font-semibold text-gray-700">Observados</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{formatNumber(observedCount)}</p>
            <p className="mt-2 text-sm text-red-600">Errores de parseo o duplicados</p>
            {observedCount > 0 && onFix ? (
              <button
                type="button"
                onClick={onFix}
                className="mt-4 w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Corregir
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={onContinue}
            disabled={disableContinue}
            className={`px-8 py-3 font-semibold rounded-lg transition-colors ${
              disableContinue
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#459151] hover:bg-[#3a7a44] text-white'
            }`}
          >
            {continueLabel}
          </button>
        </div>
      </div>
    </Modal2>
  );
};

export default UploadSummaryModal;
