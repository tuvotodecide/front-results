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
  continueLabel = 'Continuar',
  disableContinue = false,
}) => {
  const formatNumber = (num: number) => num.toLocaleString('es-ES');

  return (
    <Modal2
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
      showClose={false}
      type="plain"
    >
      <div className="py-4 text-center">
        <div className="flex justify-center mb-6">
          <DocumentIcon />
        </div>

        <h2 className="mb-3 text-3xl font-bold text-slate-800">Resultado del análisis</h2>
        <p className="mx-auto mb-8 max-w-2xl text-sm text-slate-500">
          Revisa el resumen generado antes de pasar al padrón editable.
        </p>

        <div className="mx-auto mb-8 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex min-h-[188px] flex-col rounded-2xl border-2 border-blue-200 bg-blue-50 p-5 text-left">
            <p className="text-sm font-semibold text-blue-700">Total</p>
            <p className="mt-4 text-4xl font-bold text-blue-700">{formatNumber(totalCount)}</p>
            <p className="mt-auto pt-4 text-sm leading-6 text-blue-600">Registros llevados al padrón</p>
          </div>

          <div className="flex min-h-[188px] flex-col rounded-2xl border-2 border-green-200 bg-green-50 p-5 text-left">
            <div className="mb-2 flex items-center gap-2">
              <CheckIcon />
              <span className="font-semibold text-slate-700">Habilitados</span>
            </div>
            <p className="mt-4 text-4xl font-bold text-[#459151]">{formatNumber(enabledCount)}</p>
            <p className="mt-auto pt-4 text-sm leading-6 text-[#459151]">Pueden votar</p>
          </div>

          <div className="flex min-h-[188px] flex-col rounded-2xl border-2 border-slate-200 bg-white p-5 text-left">
            <p className="text-sm font-semibold text-slate-700">Inhabilitados</p>
            <p className="mt-4 text-4xl font-bold text-slate-700">{formatNumber(disabledCount)}</p>
            <p className="mt-auto pt-4 text-sm leading-6 text-slate-500">No pueden votar</p>
          </div>

          <div className="flex min-h-[188px] flex-col rounded-2xl border-2 border-red-200 bg-red-50 p-5 text-left">
            <div className="mb-2 flex items-center gap-2">
              <ErrorIcon />
              <span className="font-semibold text-slate-700">Observados</span>
            </div>
            <p className="mt-4 text-4xl font-bold text-red-600">{formatNumber(observedCount)}</p>
            <p className="mt-auto max-w-[18ch] pt-4 text-sm leading-6 text-red-600">
              Si hace falta, podrás revisarlos luego dentro del padrón editable.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onContinue}
            disabled={disableContinue}
            className={`rounded-xl px-10 py-3 font-semibold transition-colors ${
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
