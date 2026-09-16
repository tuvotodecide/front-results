// Modal de confirmación para publicación oficial
// Basado en captura 03_confirm_activate_modal.png

import React from 'react';
import Modal2 from '../../../components/Modal2';

export type OfficialPublicationModalStatus =
  | 'idle'
  | 'waiting'
  | 'confirmed'
  | 'failed';

interface ConfirmActivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  isReferendum?: boolean;
  unregisteredCount?: number;
  publicationStatus?: OfficialPublicationModalStatus;
  failureMessage?: string | null;
  onGoToElections?: () => void;
}

const Spinner: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const ConfirmActivateModal: React.FC<ConfirmActivateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  unregisteredCount = 0,
  publicationStatus = 'idle',
  failureMessage = null,
  onGoToElections,
}) => {
  const hasUnregistered = unregisteredCount > 0;

  const renderStatusContent = () => {
    if (publicationStatus === 'waiting') {
      return (
        <div className="py-4 text-center">
          <div className="flex justify-center mb-6 text-[#459151]">
            <Spinner className="h-12 w-12" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            Esperando confirmación móvil
          </h2>
          <p className="mb-8 px-4 text-base text-gray-700">
            Confirma la solicitud desde la aplicación Tu Voto Decide en el
            teléfono vinculado a tu cuenta.
          </p>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="min-w-[150px] px-6 py-3 bg-gray-200 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      );
    }

    if (publicationStatus === 'confirmed') {
      return (
        <div className="py-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full border-4 border-[#459151] flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[#459151]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-8">
            Publicación oficial confirmada
          </h2>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onGoToElections}
              className="min-w-[150px] px-6 py-3 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold rounded-lg transition-colors"
            >
              Ir a mis votaciones
            </button>
          </div>
        </div>
      );
    }

    if (publicationStatus === 'failed') {
      return (
        <div className="py-4 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            Publicación no completada
          </h2>
          <p className="mb-8 px-4 text-base text-red-700">
            {failureMessage ??
              'No se pudo completar la publicación. Puedes volver a intentarlo.'}
          </p>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="min-w-[150px] px-6 py-3 bg-gray-200 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  const statusContent = renderStatusContent();

  return (
    <Modal2
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
      showClose={false}
      type="plain"
    >
      {statusContent ?? (
      <div className="py-4 text-center">
        {/* Icono */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-[#459151] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#459151]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Título */}
        <h2 className="text-xl font-bold text-gray-800 mb-3">
          Confirmar publicación oficial
        </h2>

        {/* Descripción */}
        <p className="mb-3 px-4 text-base font-semibold text-gray-700">
          Para completar la publicación oficial, utiliza la aplicación Tu Voto
          Decide en el teléfono vinculado a tu cuenta y confirma la solicitud.
        </p>
        <p className="text-green-600 mb-8 px-4">
          La solicitud se enviará a la aplicación móvil después de validar que
          la votación está lista y que la wallet institucional dispone de los
          TVD requeridos.
        </p>

        {hasUnregistered ? (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700">
            Existen {unregisteredCount} votantes no registrados. Al confirmar
            la publicación oficial, estos se eliminarán del padrón.
          </div>
        ) : null}

        {/* Botones */}
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[150px] px-6 py-3 bg-[#459151] hover:bg-[#3a7a44] text-white  font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-[150px] px-6 py-3  bg-gray-200 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Spinner />
                Confirmando...
              </>
            ) : (
              'Publicar oficialmente'
            )}
          </button>
        </div>
      </div>
      )}
    </Modal2>
  );
};

export default ConfirmActivateModal;
