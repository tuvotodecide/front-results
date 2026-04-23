// Modal de confirmación para crear elección
// Usa Modal2 existente del repo

import React from 'react';
import Modal2 from '../../../components/Modal2';
import type { ElectionFormData } from '../types';
import ScheduleSummaryCard from '../../electionConfig/components/ScheduleSummaryCard';

interface ConfirmCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: ElectionFormData | null;
  isLoading: boolean;
}

const ConfirmCreateModal: React.FC<ConfirmCreateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  formData,
  isLoading,
}) => {
  if (!formData) return null;

  return (
    <Modal2
      isOpen={isOpen}
      onClose={onClose}
      title="¿Crear votación?"
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div>
            <p className="text-sm text-gray-500">Institución</p>
            <p className="font-medium text-gray-900">{formData.institution}</p>
          </div>



          {formData.description && (
            <div>
              <p className="text-sm text-gray-500">Descripción</p>
              <p className="text-gray-700 text-sm">{formData.description}</p>
            </div>
          )}
        </div>

        {formData.isReferendum ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No se podrá cambiar el tipo de votación luego. La papeleta se mostrará como una consulta con opciones de respuesta.
          </div>
        ) : null}

        <ScheduleSummaryCard
          votingStart={formData.votingStartDate}
          votingEnd={formData.votingEndDate}
          resultsPublishAt={formData.resultsDate}
          title="Fechas de la votación"
          compact
        />

        {/* Botones */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creando...
              </>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    </Modal2>
  );
};

export default ConfirmCreateModal;
