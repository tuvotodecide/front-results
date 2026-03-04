// Modal de progreso de carga del padrón
// Basado en capturas 02_loading_progress.png y 06_revalidate_loader.png

import React from 'react';
import Modal2 from '../../../components/Modal2';

interface UploadProgressModalProps {
  isOpen: boolean;
  progress: number;
  title?: string;
  subtitle?: string;
}

const DocumentIcon = () => (
  <svg
    className="w-20 h-20"
    viewBox="0 0 80 80"
    fill="none"
  >
    {/* Círculo de fondo */}
    <circle cx="40" cy="40" r="36" stroke="#459151" strokeWidth="2" fill="none" />
    {/* Documento */}
    <rect x="26" y="20" width="28" height="36" rx="2" stroke="#459151" strokeWidth="2" fill="none" />
    {/* Esquina doblada */}
    <path d="M44 20v10h10" stroke="#459151" strokeWidth="2" strokeLinejoin="round" fill="none" />
    <path d="M44 20l10 10" stroke="#459151" strokeWidth="2" strokeLinejoin="round" />
    {/* Líneas de texto */}
    <line x1="32" y1="38" x2="48" y2="38" stroke="#459151" strokeWidth="2" strokeLinecap="round" />
    <line x1="32" y1="44" x2="48" y2="44" stroke="#459151" strokeWidth="2" strokeLinecap="round" />
    <line x1="32" y1="50" x2="42" y2="50" stroke="#459151" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
  isOpen,
  progress,
  title = 'Cargando padrón...',
  subtitle = 'Validando registros (válidos, inválidos).',
}) => {
  return (
    <Modal2
      isOpen={isOpen}
      onClose={() => {}}
      title=""
      size="md"
      showClose={false}
    >
      <div className="py-6 text-center">
        {/* Icono */}
        <div className="flex justify-center mb-6">
          <DocumentIcon />
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>

        {/* Subtítulo */}
        <p className="text-gray-500 mb-6">{subtitle}</p>

        {/* Barra de progreso */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Progreso</span>
            <span className="text-sm font-semibold text-[#459151]">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#459151] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Advertencia */}
        <div className="mt-6 px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5 text-yellow-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
            <span className="text-yellow-700 text-sm">No cierres esta ventana.</span>
          </div>
        </div>
      </div>
    </Modal2>
  );
};

export default UploadProgressModal;
