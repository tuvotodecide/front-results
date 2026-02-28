// Modal para agregar/editar cargo
// Basado en captura 03_add_cargo_modal.png

import React, { useState, useEffect } from 'react';
import Modal2 from '../../../components/Modal2';
import type { Position } from '../types';

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  isLoading: boolean;
  editingPosition?: Position | null;
}

const AddPositionModal: React.FC<AddPositionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
  editingPosition,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const isEditMode = !!editingPosition;

  // Reset form cuando se abre/cierra o cambia el modo
  useEffect(() => {
    if (isOpen) {
      setName(editingPosition?.name || '');
      setError('');
    }
  }, [isOpen, editingPosition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nombre del cargo es obligatorio');
      return;
    }

    if (trimmedName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    try {
      await onSave(trimmedName);
      onClose();
    } catch (err) {
      setError('Error al guardar. Intenta de nuevo.');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal2
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Editar Cargo' : 'Nuevo Cargo'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Label */}
        <div>
          <label
            htmlFor="positionName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            ¿Por qué cargo se votará?
          </label>
          <input
            id="positionName"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Ej. Presidente"
            disabled={isLoading}
            className={`
              w-full px-4 py-3 border rounded-lg
              focus:ring-2 focus:ring-[#459151] focus:border-[#459151]
              transition-colors
              ${error ? 'border-red-500' : 'border-gray-300'}
              ${isLoading ? 'bg-gray-100' : ''}
            `}
            autoFocus
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="px-6 py-2 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
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
                Guardando...
              </>
            ) : isEditMode ? (
              'Guardar cambios'
            ) : (
              'Guardar Cargo'
            )}
          </button>
        </div>
      </form>
    </Modal2>
  );
};

export default AddPositionModal;
