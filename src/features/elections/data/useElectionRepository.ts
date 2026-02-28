// Hook para usar el repositorio de elecciones
// Permite cambiar entre mock y API sin tocar componentes

import { useState, useEffect, useCallback } from 'react';
import type { IElectionRepository } from './ElectionRepository';
import { electionRepositoryMock } from './ElectionRepository.mock';
import type { Election, CreateElectionPayload } from '../types';

// Selector de implementación
// TODO: Cambiar a API real cuando esté disponible
const getRepository = (): IElectionRepository => {
  return electionRepositoryMock;
};

interface UseElectionsResult {
  elections: Election[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isEmpty: boolean;
}

export const useElections = (): UseElectionsResult => {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchElections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const repo = getRepository();
      const data = await repo.listElections();
      setElections(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  return {
    elections,
    loading,
    error,
    refetch: fetchElections,
    isEmpty: !loading && elections.length === 0,
  };
};

interface UseCreateElectionResult {
  createElection: (payload: CreateElectionPayload) => Promise<Election>;
  creating: boolean;
  error: Error | null;
}

export const useCreateElection = (): UseCreateElectionResult => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = async (payload: CreateElectionPayload): Promise<Election> => {
    setCreating(true);
    setError(null);
    try {
      const repo = getRepository();
      const election = await repo.createElection(payload);
      return election;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al crear');
      setError(error);
      throw error;
    } finally {
      setCreating(false);
    }
  };

  return {
    createElection: create,
    creating,
    error,
  };
};
