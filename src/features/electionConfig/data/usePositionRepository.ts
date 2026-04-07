import { useMemo } from 'react';
import {
  useCreateEventRoleMutation,
  useDeleteEventRoleMutation,
  useGetEventRolesQuery,
  useUpdateEventRoleMutation,
} from '../../../store/votingEvents';
import type { Position, CreatePositionPayload, UpdatePositionPayload } from '../types';

interface UsePositionsResult {
  positions: Position[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  createPosition: (payload: CreatePositionPayload) => Promise<Position>;
  updatePosition: (payload: UpdatePositionPayload) => Promise<Position>;
  deletePosition: (positionId: string) => Promise<void>;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export const usePositions = (electionId: string): UsePositionsResult => {
  const { data = [], isLoading, error, refetch } = useGetEventRolesQuery(electionId, {
    skip: !electionId,
  });

  const [createRole, createState] = useCreateEventRoleMutation();
  const [updateRole, updateState] = useUpdateEventRoleMutation();
  const [deleteRole, deleteState] = useDeleteEventRoleMutation();

  const positions = useMemo(
    () =>
      data.map((r) => ({
        id: r.id,
        name: r.name,
        electionId: r.eventId,
        createdAt: r.createdAt ?? new Date().toISOString(),
      })),
    [data],
  );

  return {
    positions,
    loading: isLoading,
    error: error ? new Error('Error cargando cargos') : null,
    refetch,
    createPosition: async (payload) => {
      const created = await createRole({
        eventId: electionId,
        data: { name: payload.name, maxWinners: 1 },
      }).unwrap();
      return {
        id: created.id,
        name: created.name,
        electionId: created.eventId,
        createdAt: created.createdAt ?? new Date().toISOString(),
      };
    },
    updatePosition: async (payload) => {
      const updated = await updateRole({
        eventId: electionId,
        roleId: payload.id,
        data: { name: payload.name },
      }).unwrap();
      return {
        id: updated.id,
        name: updated.name,
        electionId: updated.eventId,
        createdAt: updated.createdAt ?? new Date().toISOString(),
      };
    },
    deletePosition: async (positionId) => {
      await deleteRole({ eventId: electionId, roleId: positionId }).unwrap();
    },
    creating: createState.isLoading,
    updating: updateState.isLoading,
    deleting: deleteState.isLoading,
  };
};
