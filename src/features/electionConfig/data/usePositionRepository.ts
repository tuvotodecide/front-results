// Hook para usar el repositorio de posiciones

import { useState, useEffect, useCallback } from 'react';
import type { IPositionRepository } from './PositionRepository';
import { positionRepositoryMock } from './PositionRepository.mock';
import type { Position, CreatePositionPayload, UpdatePositionPayload } from '../types';

// Selector de implementación
const getRepository = (): IPositionRepository => {
  return positionRepositoryMock;
};

interface UsePositionsResult {
  positions: Position[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createPosition: (payload: CreatePositionPayload) => Promise<Position>;
  updatePosition: (payload: UpdatePositionPayload) => Promise<Position>;
  deletePosition: (positionId: string) => Promise<void>;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export const usePositions = (electionId: string): UsePositionsResult => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPositions = useCallback(async () => {
    if (!electionId) return;
    setLoading(true);
    setError(null);
    try {
      const repo = getRepository();
      const data = await repo.listPositions(electionId);
      setPositions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const createPosition = async (payload: CreatePositionPayload): Promise<Position> => {
    setCreating(true);
    try {
      const repo = getRepository();
      const newPos = await repo.createPosition(electionId, payload);
      setPositions((prev) => [...prev, newPos]);
      return newPos;
    } finally {
      setCreating(false);
    }
  };

  const updatePosition = async (payload: UpdatePositionPayload): Promise<Position> => {
    setUpdating(true);
    try {
      const repo = getRepository();
      const updated = await repo.updatePosition(electionId, payload);
      setPositions((prev) =>
        prev.map((p) => (p.id === payload.id ? updated : p))
      );
      return updated;
    } finally {
      setUpdating(false);
    }
  };

  const deletePosition = async (positionId: string): Promise<void> => {
    setDeleting(true);
    try {
      const repo = getRepository();
      await repo.deletePosition(electionId, positionId);
      setPositions((prev) => prev.filter((p) => p.id !== positionId));
    } finally {
      setDeleting(false);
    }
  };

  return {
    positions,
    loading,
    error,
    refetch: fetchPositions,
    createPosition,
    updatePosition,
    deletePosition,
    creating,
    updating,
    deleting,
  };
};
