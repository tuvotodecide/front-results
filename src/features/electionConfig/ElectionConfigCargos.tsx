// Página de configuración de elección - Paso 1: Cargos
// Basado en capturas 01-04

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal2 from '../../components/Modal2';
import ConfigStepsTabs from './components/ConfigStepsTabs';
import InfoPopover from './components/InfoPopover';
import PositionsTable from './components/PositionsTable';
import AddPositionModal from './components/AddPositionModal';
import { usePositions } from './data/usePositionRepository';
import type { Position } from './types';

// Mock: obtener título de elección (en producción vendría de API/store)
const getElectionTitle = (electionId: string): string => {
  // Buscar en localStorage de elecciones mock
  try {
    const stored = localStorage.getItem('mock_elections');
    if (stored) {
      const elections = JSON.parse(stored);
      const election = elections.find((e: { id: string }) => e.id === electionId);
      if (election) return election.institution;
    }
  } catch {}
  return 'Elecciones Universitarias'; // Fallback
};

const ElectionConfigCargos: React.FC = () => {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();
  const actualElectionId = electionId || 'demo-election';

  const electionTitle = getElectionTitle(actualElectionId);

  const {
    positions,
    loading,
    createPosition,
    updatePosition,
    deletePosition,
    creating,
    updating,
    deleting,
  } = usePositions(actualElectionId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Position | null>(null);

  const isOperating = creating || updating || deleting;
  const hasPositions = positions.length > 0;

  // Handlers
  const handleAddClick = () => {
    setEditingPosition(null);
    setIsAddModalOpen(true);
  };

  const handleEditClick = (position: Position) => {
    setEditingPosition(position);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (position: Position) => {
    setDeleteConfirm(position);
  };

  const handleSavePosition = async (name: string) => {
    if (editingPosition) {
      await updatePosition({ id: editingPosition.id, name });
    } else {
      await createPosition({ name });
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm) {
      await deletePosition(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleNextStep = () => {
    navigate(`/elections/${actualElectionId}/config/planchas`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Contenido principal */}
      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Título de la elección */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
            {electionTitle}
          </h1>

          {/* Tabs de pasos */}
          <div className="mb-4">
            <ConfigStepsTabs
              currentStep={1}
              canNavigate={(step) => step === 1} // Solo paso 1 navegable por ahora
            />
          </div>

          {/* Texto del paso + info */}
          <div className="flex items-center gap-2 mb-6">
            <p className="text-gray-600">Paso 1 de 3: Define los cargos.</p>
            <InfoPopover />
          </div>

          {/* Tabla de cargos */}
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
              <div className="w-8 h-8 border-4 border-[#459151] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">Cargando cargos...</p>
            </div>
          ) : (
            <PositionsTable
              positions={positions}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              loading={isOperating}
            />
          )}

          {/* Botón Agregar Cargo */}
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleAddClick}
              disabled={isOperating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Agregar Cargo
            </button>
          </div>
        </div>
      </div>

      {/* Footer con botón Siguiente */}
      <div className="border-t border-gray-200 bg-white py-4">
        <div className="max-w-4xl mx-auto px-4 flex justify-end">
          <button
            type="button"
            onClick={handleNextStep}
            disabled={!hasPositions}
            className={`
              inline-flex items-center gap-2 px-8 py-3 font-semibold rounded-lg transition-all
              ${
                hasPositions
                  ? 'bg-[#459151] hover:bg-[#3a7a44] text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Siguiente: Agregar planchas y candidatos
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal Agregar/Editar Cargo */}
      <AddPositionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingPosition(null);
        }}
        onSave={handleSavePosition}
        isLoading={creating || updating}
        editingPosition={editingPosition}
      />

      {/* Modal Confirmar Eliminación */}
      <Modal2
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar cargo"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de eliminar el cargo "{deleteConfirm?.name}"?
          </p>
          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </button>
          </div>
        </div>
      </Modal2>
    </div>
  );
};

export default ElectionConfigCargos;
