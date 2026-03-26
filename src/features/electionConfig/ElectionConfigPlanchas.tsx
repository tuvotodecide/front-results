// Página de configuración de elección - Paso 2: Planchas/Partidos
// Conectado a backend real con RTK Query

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal2 from '../../components/Modal2';
import ConfigStepsTabs from './components/ConfigStepsTabs';
import PartiesTable from './components/PartiesTable';
import PartyModal from './components/PartyModal';
import CandidatesModal from './components/CandidatesModal';
import ConfigPageFallback from './components/ConfigPageFallback';
import {
  useGetVotingEventQuery,
  useGetEventRolesQuery,
  useGetEventOptionsQuery,
  useCreateVotingOptionMutation,
  useUpdateVotingOptionMutation,
  useDeleteVotingOptionMutation,
  useReplaceOptionCandidatesMutation,
  useGetPadronVersionsQuery,
} from '../../store/votingEvents';
import type { Party, PartyWithCandidates, CandidateInput, CreatePartyPayload, Position, ConfigStep } from './types';
import type { VotingOption, EventRole, OptionCandidate } from '../../store/votingEvents/types';

// Adaptar VotingOption a PartyWithCandidates
const optionToPartyWithCandidates = (option: VotingOption): PartyWithCandidates => ({
  id: option.id,
  electionId: option.eventId,
  name: option.name,
  colorHex: option.color,
  logoUrl: option.logoUrl,
  createdAt: option.createdAt ?? new Date().toISOString(),
  candidates: (option.candidates ?? []).map((c: OptionCandidate) => ({
    id: c.id,
    partyId: option.id,
    positionId: '', // Backend usa roleName, no positionId
    positionName: c.roleName,
    fullName: c.name,
    photoUrl: c.photoUrl,
  })),
});

const hydratePartyCandidates = (
  party: PartyWithCandidates,
  positions: Position[],
): PartyWithCandidates => ({
  ...party,
  candidates: party.candidates.map((candidate) => {
    const matchedPosition =
      positions.find((position) => position.name === candidate.positionName) ?? null;

    return {
      ...candidate,
      positionId: matchedPosition?.id ?? candidate.positionId,
    };
  }),
});

// Adaptar EventRole a Position
const roleToPosition = (role: EventRole): Position => ({
  id: role.id,
  name: role.name,
  electionId: role.eventId,
  createdAt: role.createdAt ?? new Date().toISOString(),
});

const partyHasCompleteCandidates = (
  party: PartyWithCandidates,
  positions: Position[],
) => {
  if (positions.length === 0) return false;
  if (party.candidates.length !== positions.length) return false;

  return positions.every((position) =>
    party.candidates.some(
      (candidate) =>
        candidate.positionName === position.name &&
        candidate.fullName.trim().length > 0 &&
        String(candidate.photoUrl || '').trim().length > 0,
    ),
  );
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
  const actualElectionId = electionId || '';

  // RTK Query hooks
  const {
    data: event,
    isLoading: loadingEvent,
    isError: eventLoadFailed,
    refetch: refetchEvent,
  } = useGetVotingEventQuery(actualElectionId, {
    skip: !actualElectionId,
  });
  const { data: roles = [], isError: rolesLoadFailed } = useGetEventRolesQuery(actualElectionId, {
    skip: !actualElectionId,
  });
  const {
    data: options = [],
    isLoading: loadingOptions,
    isError: optionsLoadFailed,
  } = useGetEventOptionsQuery(actualElectionId, {
    skip: !actualElectionId,
  });
  const { data: padronVersions = [], isError: padronLoadFailed } = useGetPadronVersionsQuery(actualElectionId, {
    skip: !actualElectionId,
  });

  const [createOption, { isLoading: creating }] = useCreateVotingOptionMutation();
  const [updateOption, { isLoading: updating }] = useUpdateVotingOptionMutation();
  const [deleteOption, { isLoading: deleting }] = useDeleteVotingOptionMutation();
  const [replaceCandidates, { isLoading: savingCandidates }] = useReplaceOptionCandidatesMutation();

  // Convertir datos del backend a formato del frontend
  const parties = options.map(optionToPartyWithCandidates);
  const positions = roles.map(roleToPosition);
  const loading = loadingEvent || loadingOptions;

  // Estados de UI
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isCandidatesModalOpen, setIsCandidatesModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<PartyWithCandidates | null>(null);
  const [currentPartyForCandidates, setCurrentPartyForCandidates] = useState<PartyWithCandidates | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PartyWithCandidates | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOperating = creating || updating || deleting || savingCandidates;

  // Verificar estados de los pasos
  const hasPositions = positions.length > 0;
  const completeParties = parties.filter((party) =>
    partyHasCompleteCandidates(party, positions),
  );
  const hasMinimumCompleteParties = completeParties.length >= 2;
  const isPadronReady = padronVersions.length > 0;

  // Handlers
  const handleCreateParty = () => {
    setEditingParty(null);
    setIsPartyModalOpen(true);
    setError(null);
  };

  const handleEditParty = (party: PartyWithCandidates) => {
    setEditingParty(party);
    setIsPartyModalOpen(true);
    setError(null);
  };

  const handleDeleteParty = (party: PartyWithCandidates) => {
    setDeleteConfirm(party);
    setError(null);
  };

  const handleEditCandidates = (party: PartyWithCandidates) => {
    setCurrentPartyForCandidates(hydratePartyCandidates(party, positions));
    setIsCandidatesModalOpen(true);
    setError(null);
  };

  const handleSaveParty = async (data: CreatePartyPayload): Promise<Party> => {
    setError(null);
    try {
      if (editingParty) {
        const updated = await updateOption({
          eventId: actualElectionId,
          optionId: editingParty.id,
          data: {
            name: data.name,
            color: data.colorHex,
            logoUrl: data.logoBase64, // Backend debería aceptar base64 o URL
          },
        }).unwrap();

        setIsPartyModalOpen(false);
        return {
          id: updated.id,
          electionId: updated.eventId,
          name: updated.name,
          colorHex: updated.color,
          logoUrl: updated.logoUrl,
          createdAt: updated.createdAt ?? new Date().toISOString(),
        };
      } else {
        const created = await createOption({
          eventId: actualElectionId,
          data: {
            name: data.name,
            color: data.colorHex,
            logoUrl: data.logoBase64,
            candidates: [], // Sin candidatos inicialmente
          },
        }).unwrap();

        setIsPartyModalOpen(false);

        // Abrir modal de candidatos para el nuevo partido
        const newPartyWithCandidates: PartyWithCandidates = {
          id: created.id,
          electionId: created.eventId,
          name: created.name,
          colorHex: created.color,
          logoUrl: created.logoUrl,
          createdAt: created.createdAt ?? new Date().toISOString(),
          candidates: [],
        };
        setCurrentPartyForCandidates(newPartyWithCandidates);
        setIsCandidatesModalOpen(true);

        return {
          id: created.id,
          electionId: created.eventId,
          name: created.name,
          colorHex: created.color,
          logoUrl: created.logoUrl,
          createdAt: created.createdAt ?? new Date().toISOString(),
        };
      }
    } catch (err: any) {
      setError(err?.data?.message || 'Error al guardar el partido');
      throw err;
    }
  };

  const handleSaveCandidates = async (candidates: CandidateInput[]) => {
    if (!currentPartyForCandidates) return;
    setError(null);

    try {
      // Convertir CandidateInput al formato del backend
      const backendCandidates = candidates.map((c) => ({
        name: c.fullName,
        photoUrl: c.photoBase64,
        roleName: c.positionName,
      }));

      await replaceCandidates({
        eventId: actualElectionId,
        optionId: currentPartyForCandidates.id,
        data: { candidates: backendCandidates },
      }).unwrap();

      setIsCandidatesModalOpen(false);
      setCurrentPartyForCandidates(null);
    } catch (err: any) {
      setError(err?.data?.message || 'Error al guardar los candidatos');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setError(null);

    try {
      await deleteOption({
        eventId: actualElectionId,
        optionId: deleteConfirm.id,
      }).unwrap();
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err?.data?.message || 'Error al eliminar el partido');
    }
  };

  const handleNextStep = () => {
    if (!hasMinimumCompleteParties) {
      setError(
        'Debes registrar al menos 2 partidos y completar todos sus candidatos con nombre y foto antes de continuar.',
      );
      return;
    }
    navigate(`/elections/${actualElectionId}/config/padron`);
  };

  const handleGoToStep = (step: ConfigStep) => {
    if (step === 1) {
      navigate(`/elections/${actualElectionId}/config/cargos`);
      return;
    }
    if (step === 2) return;
    if (step === 3 && hasMinimumCompleteParties) {
      navigate(`/elections/${actualElectionId}/config/padron`);
    }
  };

  // Si no hay electionId, mostrar error
  if (!actualElectionId) {
    return (
      <ConfigPageFallback
        title="ID de votación no válido"
        message="No se pudo resolver la votación seleccionada. Vuelve al listado y entra nuevamente."
        actionLabel="Volver a elecciones"
        onAction={() => navigate('/elections')}
      />
    );
  }

  if (eventLoadFailed || rolesLoadFailed || optionsLoadFailed || padronLoadFailed) {
    return (
      <ConfigPageFallback
        title="No se pudo cargar Planchas"
        message="Alguno de los datos necesarios para este paso falló al cargar. Reintenta antes de continuar."
        actionLabel="Reintentar"
        onAction={() => {
          void refetchEvent();
        }}
      />
    );
  }

  if (!loadingEvent && !event) {
    return (
      <ConfigPageFallback
        title="Votación no encontrada"
        message="La votación no existe o la respuesta llegó incompleta. Vuelve al listado y selecciónala de nuevo."
        actionLabel="Volver a elecciones"
        onAction={() => navigate('/elections')}
      />
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] flex flex-col">
      {/* Contenido principal */}
      <div className="py-8 flex-1">
        <div className="max-w-5xl mx-auto px-4">
          {/* Título */}
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
            {event?.name || 'Cargando...'}
          </h1>

          {/* Error global */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-4">
            <ConfigStepsTabs
              currentStep={2}
              completedSteps={[
                ...(hasPositions ? [1] : []),
                ...(hasMinimumCompleteParties ? [2] : []),
                ...(isPadronReady ? [3] : []),
              ] as ConfigStep[]}
              onStepChange={handleGoToStep}
              canNavigate={(step) => {
                if (step === 1 || step === 2) return true;
                return hasMinimumCompleteParties;
              }}
            />
          </div>

          {/* Texto del paso + info */}
          <div className="flex items-center gap-2 mb-6">
            <p className="text-gray-600">Paso 2 de 3: Agrega partidos y candidatos.</p>
            <PlanchasInfoPopover />
          </div>

          {!hasMinimumCompleteParties && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Debes registrar al menos 2 partidos y completar todos los cargos con nombre y foto en cada uno para continuar al padrón.
            </div>
          )}

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
            disabled={!hasMinimumCompleteParties}
            className={`
              inline-flex items-center gap-2 px-8 py-3 font-semibold rounded-lg transition-all
              ${
                hasMinimumCompleteParties
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
        type="plain"
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
