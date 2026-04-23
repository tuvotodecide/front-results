// Modal de confirmación para publicación oficial
// Basado en captura 03_confirm_activate_modal.png

import React from 'react';
import Modal2 from '../../../components/Modal2';

interface ConfirmActivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const ConfirmActivateModal: React.FC<ConfirmActivateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
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
        <p className="text-gray-600 mb-8 px-4">
          Esta acción publica oficialmente la elección y bloquea los cambios estructurales en cargos, planchas y padrón. Revisa la configuración antes de continuar.
        </p>

        {/* Botones */}
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[150px] px-6 py-3 bg-[#459151] hover:bg-[#3a7a44] text-white  font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-[150px] px-6 py-3  bg-gray-200 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Confirmando...
              </>
            ) : (
              'Confirmar publicación'
            )}
          </button>
        </div>
      </div>
    </Modal2>
  );
};

export default ConfirmActivateModal;
