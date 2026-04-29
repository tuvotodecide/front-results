// Página de configuración de elección - Paso 1: Cargos
// Conectado a backend real con RTK Query

import React, { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams,
} from '@/domains/votacion/navigation/compat-private';
import Modal2 from '../../components/Modal2';
import ConfigStepsTabs from './components/ConfigStepsTabs';
import InfoPopover from './components/InfoPopover';
import PositionsTable from './components/PositionsTable';
import AddPositionModal from './components/AddPositionModal';
import ConfigPageFallback from './components/ConfigPageFallback';
import { getRequestErrorMessage } from './requestErrorMessage';
import {
  areResultsAvailable,
  canEditElectionBeforeCutoff,
  hasDraftAlreadyStarted,
  hasVotingEnded,
  isDuringVotingWindow,
  stableCreatedAt,
  useClientNow,
} from './renderUtils';
import {
  useGetVotingEventQuery,
  useGetEventRolesQuery,
  useCreateEventRoleMutation,
  useUpdateEventRoleMutation,
  useDeleteEventRoleMutation,
  useGetEventOptionsQuery,
  useGetPadronVersionsQuery,
} from '../../store/votingEvents';
import type { Position, ConfigStep } from './types';
import type { EventRole } from '../../store/votingEvents/types';

// Adaptar EventRole a Position para compatibilidad con componentes existentes
const roleToPosition = (role: EventRole): Position => ({
  id: role.id,
  name: role.name,
  electionId: role.eventId,
  createdAt: stableCreatedAt(role.createdAt),
});

const ElectionConfigCargos: React.FC = () => {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();
  const actualElectionId = electionId || '';
  const nowMs = useClientNow();

  // RTK Query hooks
  const {
    data: event,
    isLoading: loadingEvent,
    isError: eventLoadFailed,
    refetch: refetchEvent,
  } = useGetVotingEventQuery(actualElectionId, {
    skip: !actualElectionId,
  });
  const { data: roles = [], isLoading: loadingRoles } = useGetEventRolesQuery(actualElectionId, {
    skip: !actualElectionId,
  });
  const { data: options = [] } = useGetEventOptionsQuery(actualElectionId, {
    skip: !actualElectionId,
  });
  const { data: padronVersions = [] } = useGetPadronVersionsQuery(actualElectionId, {
    skip: !actualElectionId,
  });

  const [createRole, { isLoading: creating }] = useCreateEventRoleMutation();
  const [updateRole, { isLoading: updating }] = useUpdateEventRoleMutation();
  const [deleteRole, { isLoading: deleting }] = useDeleteEventRoleMutation();

  // Convertir roles a positions para compatibilidad
  const positions = roles.map(roleToPosition);
  const loading = loadingEvent || loadingRoles;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOperating = creating || updating || deleting;
  const isReferendum = Boolean(event?.isReferendum);
  const hasPositions = positions.length > 0;
  const hasPartiesWithCandidates = options.some((opt) => opt.candidates.length > 0);
  const isPadronReady = padronVersions.length > 0;

  useEffect(() => {
    if (!actualElectionId || !isReferendum) return;
    navigate(`/votacion/elecciones/${actualElectionId}/config/planchas`, { replace: true });
  }, [actualElectionId, isReferendum, navigate]);

  // Handlers
  const handleAddClick = () => {
    setEditingPosition(null);
    setIsAddModalOpen(true);
    setError(null);
  };

  const handleEditClick = (position: Position) => {
    setEditingPosition(position);
    setIsAddModalOpen(true);
    setError(null);
  };

  const handleDeleteClick = (position: Position) => {
    setDeleteConfirm(position);
    setError(null);
  };

  const handleSavePosition = async (name: string) => {
    setError(null);
    try {
      if (editingPosition) {
        await updateRole({
          eventId: actualElectionId,
          roleId: editingPosition.id,
          data: { name },
        }).unwrap();
      } else {
        await createRole({
          eventId: actualElectionId,
          data: { name, maxWinners: 1 },
        }).unwrap();
      }
      setIsAddModalOpen(false);
      setEditingPosition(null);
    } catch (err: any) {
      setError(getRequestErrorMessage(err, 'Error al guardar el cargo'));
      throw err; // Re-throw para que el modal lo maneje
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setError(null);
    try {
      await deleteRole({
        eventId: actualElectionId,
        roleId: deleteConfirm.id,
      }).unwrap();
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(getRequestErrorMessage(err, 'Error al eliminar el cargo'));
    }
  };

  const handleNextStep = () => {
    navigate(`/votacion/elecciones/${actualElectionId}/config/planchas`);
  };

  const handleGoToStep = (step: ConfigStep) => {
    if (step === 1) return;
    if (step === 2 && hasPositions) {
      navigate(`/votacion/elecciones/${actualElectionId}/config/planchas`);
    }
    if (step === 3 && hasPositions && hasPartiesWithCandidates) {
      navigate(`/votacion/elecciones/${actualElectionId}/config/padron`);
    }
  };

  // Si no hay electionId, mostrar error
  if (!actualElectionId) {
    return (
      <ConfigPageFallback
        title="ID de votación no válido"
        message="No se pudo resolver la votación seleccionada. Vuelve al listado y entra nuevamente."
        actionLabel="Volver a elecciones"
        onAction={() => navigate('/votacion/elecciones')}
      />
    );
  }

  if (eventLoadFailed) {
    return (
      <ConfigPageFallback
        title="No se pudo cargar la votación"
        message="Falló la carga inicial del flujo de configuración. Reintenta antes de continuar."
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
        onAction={() => navigate('/votacion/elecciones')}
      />
    );
  }

  if (hasDraftAlreadyStarted(event, nowMs)) {
    return (
      <ConfigPageFallback
        title="La votación ya venció antes de completarse"
        message="Como la hora de inicio ya pasó y el evento sigue en borrador, ya no debe seguir configurándose. Elimínalo desde la lista de votaciones."
        actionLabel="Volver a elecciones"
        onAction={() => navigate('/votacion/elecciones')}
      />
    );
  }

  if (event && !canEditElectionBeforeCutoff(event, nowMs)) {
    const message =
      event?.status === 'PUBLICATION_EXPIRED' || event?.state === 'PUBLICATION_EXPIRED'
        ? 'La publicación oficial venció. Los cargos ya no deben modificarse.'
        : event?.status === 'OFFICIALLY_PUBLISHED' || event?.state === 'OFFICIALLY_PUBLISHED'
          ? 'La publicación oficial ya fue confirmada. Los cargos quedan bloqueados y no pueden volver a editarse.'
        : isDuringVotingWindow(event, nowMs)
          ? 'Durante la votación ya no se puede modificar la estructura de cargos.'
          : hasVotingEnded(event, nowMs) || areResultsAvailable(event, nowMs)
            ? 'La votación ya finalizó y la estructura de cargos queda en solo lectura.'
            : 'Ya faltan menos de 6 horas para el inicio. Los cargos quedan en solo lectura.';

    return (
      <ConfigPageFallback
        title="Cargos bloqueados"
        message={message}
        actionLabel="Volver al estado"
        onAction={() => navigate(`/votacion/elecciones/${actualElectionId}/status`)}
      />
    );
  }

  if (!loadingEvent && isReferendum) {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] flex flex-col">
      {/* Contenido principal */}
      <div className="py-8 flex-1">
        <div className="max-w-4xl mx-auto px-4">
          {/* Título de la elección */}
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
            {event?.name || 'Cargando...'}
          </h1>

          {/* Error global */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {!isReferendum ? (
            <div className="mb-4">
              <ConfigStepsTabs
                currentStep={1}
                completedSteps={[
                  ...(hasPositions ? [1] : []),
                  ...(hasPartiesWithCandidates ? [2] : []),
                  ...(isPadronReady ? [3] : []),
                ] as ConfigStep[]}
                isReferendum={isReferendum}
                onStepChange={handleGoToStep}
                canNavigate={(step) => {
                  if (step === 1) return true;
                  if (step === 2) return hasPositions;
                  return hasPositions && hasPartiesWithCandidates;
                }}
              />
            </div>
          ) : null}

          {/* Texto del paso + info */}
          <div className="flex items-center gap-2 mb-6">
            <p className="text-gray-600">
              {isReferendum
                ? 'La pregunta ya quedó definida. Continúa con las opciones del referéndum.'
                : 'Paso 1 de 3: Define los cargos.'}
            </p>
            <InfoPopover isReferendum={isReferendum} />
          </div>

          {isReferendum ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              No necesitas completar nada aquí. Esta parte se prepara automáticamente para que puedas seguir con las opciones.
            </div>
          ) : null}

          {/* Tabla de cargos */}
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
              <div className="w-8 h-8 border-4 border-[#459151] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">Cargando cargos...</p>
            </div>
          ) : isReferendum ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-800">
                Configuración inicial lista
              </p>
              <p className="mt-2 text-sm text-gray-600">
                El sistema prepara automáticamente la estructura interna necesaria para el referéndum.
              </p>
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
          {!isReferendum ? (
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
          ) : null}
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
            {isReferendum
              ? 'Continuar: Configurar opciones'
              : 'Siguiente: Agregar planchas y candidatos'}
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
        submitError={error}
      />

      {/* Modal Confirmar Eliminación */}
      <Modal2
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar cargo"
        size="sm"
        type="plain"
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
