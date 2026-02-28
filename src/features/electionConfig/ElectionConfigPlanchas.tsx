// Página de configuración de elección - Paso 2: Planchas/Partidos
// Basado en capturas 01-04

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal2 from '../../components/Modal2';
import ConfigStepsTabs from './components/ConfigStepsTabs';
import InfoPopover from './components/InfoPopover';
import PartiesTable from './components/PartiesTable';
import PartyModal from './components/PartyModal';
import CandidatesModal from './components/CandidatesModal';
import { useParties } from './data/usePartyRepository';
import { usePositions } from './data/usePositionRepository';
import type { Party, PartyWithCandidates, CandidateInput, CreatePartyPayload } from './types';

// Mock: obtener título de elección
const getElectionTitle = (electionId: string): string => {
  try {
    const stored = localStorage.getItem('mock_elections');
    if (stored) {
      const elections = JSON.parse(stored);
      const election = elections.find((e: { id: string }) => e.id === electionId);
      if (election) return election.institution;
    }
  } catch {}
  return 'Elecciones Universitarias';
};

// Popover de información para Planchas
const PlanchasInfoPopover: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors
          ${isOpen ? 'bg-[#459151] text-white' : 'bg-gray-300 text-gray-600 hover:bg-gray-400'}
        `}
      >
        i
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80">
            <div className="bg-[#d4edda] border border-[#c3e6cb] rounded-lg shadow-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-800">¿Qué son las planchas?</h4>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Una plancha/partido agrupa candidatos por cada cargo definido (Ej: Presidente, Vicepresidente).
              </p>
              <p className="text-sm text-gray-600 italic">
                Crea el partido y luego asigna candidatos para cada cargo.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const ElectionConfigPlanchas: React.FC = () => {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();
  const actualElectionId = electionId || 'demo-election';
  const electionTitle = getElectionTitle(actualElectionId);

  // Datos
  const { positions } = usePositions(actualElectionId);
  const {
    parties,
    loading,
    createParty,
    updateParty,
    deleteParty,
    saveCandidates,
    creating,
    updating,
    deleting,
    savingCandidates,
  } = useParties(actualElectionId);

  // Estados de UI
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isCandidatesModalOpen, setIsCandidatesModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<PartyWithCandidates | null>(null);
  const [currentPartyForCandidates, setCurrentPartyForCandidates] = useState<PartyWithCandidates | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PartyWithCandidates | null>(null);

  const isOperating = creating || updating || deleting || savingCandidates;

  // Verificar si hay al menos 1 partido con candidatos para habilitar "Siguiente"
  const hasPartiesWithCandidates = parties.some((p) => p.candidates.length > 0);

  // Handlers
  const handleCreateParty = () => {
    setEditingParty(null);
    setIsPartyModalOpen(true);
  };

  const handleEditParty = (party: PartyWithCandidates) => {
    setEditingParty(party);
    setIsPartyModalOpen(true);
  };

  const handleDeleteParty = (party: PartyWithCandidates) => {
    setDeleteConfirm(party);
  };

  const handleEditCandidates = (party: PartyWithCandidates) => {
    setCurrentPartyForCandidates(party);
    setIsCandidatesModalOpen(true);
  };

  const handleSaveParty = async (data: CreatePartyPayload): Promise<Party> => {
    let savedParty: Party;

    if (editingParty) {
      savedParty = await updateParty({
        id: editingParty.id,
        ...data,
      });
      setIsPartyModalOpen(false);
    } else {
      savedParty = await createParty(data);
      setIsPartyModalOpen(false);
      // Abrir modal de candidatos para el nuevo partido
      const newPartyWithCandidates: PartyWithCandidates = {
        ...savedParty,
        candidates: [],
      };
      setCurrentPartyForCandidates(newPartyWithCandidates);
      setIsCandidatesModalOpen(true);
    }

    return savedParty;
  };

  const handleSaveCandidates = async (candidates: CandidateInput[]) => {
    if (!currentPartyForCandidates) return;
    await saveCandidates(currentPartyForCandidates.id, candidates);
    setIsCandidatesModalOpen(false);
    setCurrentPartyForCandidates(null);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm) {
      await deleteParty(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleNextStep = () => {
    navigate(`/elections/${actualElectionId}/config/padron`);
  };

  const handleGoToStep1 = () => {
    navigate(`/elections/${actualElectionId}/config/cargos`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Contenido principal */}
      <div className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
            {electionTitle}
          </h1>

          {/* Tabs - Paso 1 completado, Paso 2 activo */}
          <div className="mb-4">
            <ConfigStepsTabs
              currentStep={2}
              completedSteps={[1]}
              onStepChange={(step) => {
                if (step === 1) handleGoToStep1();
              }}
              canNavigate={(step) => step === 1 || step === 2}
            />
          </div>

          {/* Texto del paso + info */}
          <div className="flex items-center gap-2 mb-6">
            <p className="text-gray-600">Paso 2 de 3: Agrega partidos y candidatos.</p>
            <PlanchasInfoPopover />
          </div>

          {/* Tabla de partidos */}
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
              <div className="w-8 h-8 border-4 border-[#459151] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">Cargando partidos...</p>
            </div>
          ) : (
            <PartiesTable
              parties={parties}
              onEdit={handleEditParty}
              onDelete={handleDeleteParty}
              onEditCandidates={handleEditCandidates}
              loading={isOperating}
            />
          )}

          {/* Botón Crear Partido */}
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleCreateParty}
              disabled={isOperating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#459151] hover:bg-[#3a7a44] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Crear Partido
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white py-4">
        <div className="max-w-5xl mx-auto px-4 flex justify-end">
          <button
            type="button"
            onClick={handleNextStep}
            disabled={!hasPartiesWithCandidates}
            className={`
              inline-flex items-center gap-2 px-8 py-3 font-semibold rounded-lg transition-all
              ${
                hasPartiesWithCandidates
                  ? 'bg-[#459151] hover:bg-[#3a7a44] text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Siguiente: Subir Padrón
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal Crear/Editar Partido */}
      <PartyModal
        isOpen={isPartyModalOpen}
        onClose={() => {
          setIsPartyModalOpen(false);
          setEditingParty(null);
        }}
        onSave={handleSaveParty}
        isLoading={creating || updating}
        editingParty={editingParty}
      />

      {/* Modal Gestión de Candidatos */}
      <CandidatesModal
        isOpen={isCandidatesModalOpen}
        onClose={() => {
          setIsCandidatesModalOpen(false);
          setCurrentPartyForCandidates(null);
        }}
        onSave={handleSaveCandidates}
        isLoading={savingCandidates}
        positions={positions}
        existingCandidates={currentPartyForCandidates?.candidates || []}
        partyName={currentPartyForCandidates?.name}
      />

      {/* Modal Confirmar Eliminación */}
      <Modal2
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar partido"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de eliminar el partido "{deleteConfirm?.name}"?
          </p>
          <p className="text-sm text-gray-500">
            Se eliminarán también todos los candidatos asignados. Esta acción no se puede deshacer.
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

export default ElectionConfigPlanchas;
