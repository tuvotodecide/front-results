"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Modal2 from "@/components/Modal2";
import AddPositionModal from "@/features/electionConfig/components/AddPositionModal";
import ConfigPageFallback from "@/features/electionConfig/components/ConfigPageFallback";
import ConfigStepsTabs from "@/features/electionConfig/components/ConfigStepsTabs";
import InfoPopover from "@/features/electionConfig/components/InfoPopover";
import PositionsTable from "@/features/electionConfig/components/PositionsTable";
import type { ConfigStep, Position } from "@/features/electionConfig/types";
import {
  buildElectionConfigPath,
  canNavigateConfigStep,
  hasDraftAlreadyStarted,
  roleToPosition,
} from "@/domains/voting/lib/electionConfig";
import { setSelectedElection } from "@/store/election/electionSlice";
import {
  useCreateEventRoleMutation,
  useDeleteEventRoleMutation,
  useGetEventOptionsQuery,
  useGetEventRolesQuery,
  useGetPadronVersionsQuery,
  useGetVotingEventQuery,
  useUpdateEventRoleMutation,
} from "@/store/votingEvents";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { data?: { message?: string }; message?: string };
    return candidate.data?.message ?? candidate.message ?? fallback;
  }

  return fallback;
};

export default function ElectionConfigCargosPage({
  electionId,
}: Readonly<{ electionId: string }>) {
  const router = useRouter();
  const dispatch = useDispatch();
  const actualElectionId = electionId || "";

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

  const positions = roles.map(roleToPosition);
  const loading = loadingEvent || loadingRoles;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOperating = creating || updating || deleting;
  const hasPositions = positions.length > 0;
  const hasPartiesWithCandidates = options.some((opt) => opt.candidates.length > 0);
  const isPadronReady = padronVersions.length > 0;

  useEffect(() => {
    if (!event?.id) return;
    dispatch(
      setSelectedElection({
        id: event.id,
        name: event.name,
      }),
    );
  }, [dispatch, event?.id, event?.name]);

  const navigateTo = (step: "cargos" | "planchas" | "padron" | "review" | "status") => {
    router.push(buildElectionConfigPath(actualElectionId, step));
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al guardar el cargo"));
      throw err;
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al eliminar el cargo"));
    }
  };

  const handleGoToStep = (step: ConfigStep) => {
    if (!canNavigateConfigStep({ step, hasPositions, hasCompleteParties: hasPartiesWithCandidates })) {
      return;
    }

    if (step === 1) return;
    if (step === 2) {
      navigateTo("planchas");
      return;
    }

    navigateTo("padron");
  };

  if (!actualElectionId) {
    return (
      <ConfigPageFallback
        title="ID de votación no válido"
        message="No se pudo resolver la votación seleccionada. Vuelve al listado y entra nuevamente."
        actionLabel="Volver a elecciones"
        onAction={() => router.push("/elections")}
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
        onAction={() => router.push("/elections")}
      />
    );
  }

  if (hasDraftAlreadyStarted(event)) {
    return (
      <ConfigPageFallback
        title="La votación ya venció antes de completarse"
        message="Como la hora de inicio ya pasó y el evento sigue en borrador, ya no debe seguir configurándose. Elimínalo desde la lista de votaciones."
        actionLabel="Volver a elecciones"
        onAction={() => router.push("/elections")}
      />
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] flex flex-col">
      <div className="py-8 flex-1">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
            {event?.name || "Cargando..."}
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <ConfigStepsTabs
              currentStep={1}
              completedSteps={[
                ...(hasPositions ? [1] : []),
                ...(hasPartiesWithCandidates ? [2] : []),
                ...(isPadronReady ? [3] : []),
              ] as ConfigStep[]}
              onStepChange={handleGoToStep}
              canNavigate={(step) =>
                canNavigateConfigStep({
                  step,
                  hasPositions,
                  hasCompleteParties: hasPartiesWithCandidates,
                })
              }
            />
          </div>

          <div className="flex items-center gap-2 mb-6">
            <p className="text-gray-600">Paso 1 de 3: Define los cargos.</p>
            <InfoPopover />
          </div>

          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
              <div className="w-8 h-8 border-4 border-[#459151] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">Cargando cargos...</p>
            </div>
          ) : (
            <PositionsTable
              positions={positions}
              onEdit={(position) => {
                setEditingPosition(position);
                setIsAddModalOpen(true);
                setError(null);
              }}
              onDelete={(position) => {
                setDeleteConfirm(position);
                setError(null);
              }}
              loading={isOperating}
            />
          )}

          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={() => {
                setEditingPosition(null);
                setIsAddModalOpen(true);
                setError(null);
              }}
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

      <div className="border-t border-gray-200 bg-white py-4">
        <div className="max-w-4xl mx-auto px-4 flex justify-end">
          <button
            type="button"
            onClick={() => navigateTo("planchas")}
            disabled={!hasPositions}
            className={`inline-flex items-center gap-2 px-8 py-3 font-semibold rounded-lg transition-all ${
              hasPositions
                ? "bg-[#459151] hover:bg-[#3a7a44] text-white shadow-md hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Siguiente: Agregar planchas y candidatos
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

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
          <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
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
                "Eliminar"
              )}
            </button>
          </div>
        </div>
      </Modal2>
    </div>
  );
}
