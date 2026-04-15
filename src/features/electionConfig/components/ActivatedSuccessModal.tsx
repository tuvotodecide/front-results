// Modal de éxito después de activar votación
// Basado en captura 04_activated_success_modal.png

import React, { useState } from 'react';
import Modal2 from '../../../components/Modal2';

interface ActivatedSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicUrl: string;
  shareText: string;
  onCopyLink: (url: string) => Promise<boolean>;
}

const ActivatedSuccessModal: React.FC<ActivatedSuccessModalProps> = ({
  isOpen,
  onClose,
  publicUrl,
  shareText,
  onCopyLink,
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopyLink = async () => {
    const success = await onCopyLink(publicUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    // Intentar usar Web Share API si está disponible
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Votación activada',
          text: shareText,
          url: publicUrl,
        });
        return;
      } catch {
        // Si el usuario cancela o hay error, fallback a copiar
      }
    }

    // Fallback: copiar texto para compartir
    const success = await onCopyLink(shareText);
    if (success) {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
      showClose={false}
      type="plain"
    >
      <div className="py-4 text-center">
        {/* Icono de éxito */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-[#459151] flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[#459151]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-[#459151] mb-3">
          Publicación oficial confirmada
        </h2>

        {/* Descripción */}
        <p className="text-gray-600 mb-8 px-2">
          Los votantes habilitados podrán verla según las fechas configuradas.
        </p>

        {/* Botones */}
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={handleShare}
            className="px-5 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {shared ? (
              <>
                <svg className="w-4 h-4 text-[#459151]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Texto copiado
              </>
            ) : (
              'Compartir en redes sociales'
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="px-5 py-3 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            {copied ? 'Enlace copiado' : 'Copiar Enlace'}
          </button>
        </div>

        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Cerrar e ir al inicio
        </button>
      </div>
    </Modal2>
  );
};

export default ActivatedSuccessModal;
