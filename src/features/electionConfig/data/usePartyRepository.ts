// Hook para usar el repositorio de partidos

import { useState, useEffect, useCallback } from 'react';
import { partyRepositoryMock } from './PartyRepository.mock';
import type { Party, CreatePartyPayload, UpdatePartyPayload, Candidate, CandidateInput, PartyWithCandidates } from '../types';

const getRepository = () => partyRepositoryMock;

interface UsePartiesResult {
  parties: PartyWithCandidates[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createParty: (payload: CreatePartyPayload) => Promise<Party>;
  updateParty: (payload: UpdatePartyPayload) => Promise<Party>;
  deleteParty: (partyId: string) => Promise<void>;
  saveCandidates: (partyId: string, candidates: CandidateInput[]) => Promise<Candidate[]>;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  savingCandidates: boolean;
}

export const useParties = (electionId: string): UsePartiesResult => {
  const [parties, setParties] = useState<PartyWithCandidates[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingCandidates, setSavingCandidates] = useState(false);

  const fetchParties = useCallback(async () => {
    if (!electionId) return;
    setLoading(true);
    setError(null);
    try {
      const repo = getRepository();
      const partiesList = await repo.listParties(electionId);

      // Cargar candidatos para cada partido
      const partiesWithCandidates: PartyWithCandidates[] = await Promise.all(
        partiesList.map(async (party) => {
          const candidates = await repo.getPartyCandidates(electionId, party.id);
          return { ...party, candidates };
        })
      );

      setParties(partiesWithCandidates);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const createParty = async (payload: CreatePartyPayload): Promise<Party> => {
    setCreating(true);
    try {
      const repo = getRepository();
      const newParty = await repo.createParty(electionId, payload);
      // Agregar a la lista con candidatos vacíos
      setParties((prev) => [...prev, { ...newParty, candidates: [] }]);
      return newParty;
    } finally {
      setCreating(false);
    }
  };

  const updateParty = async (payload: UpdatePartyPayload): Promise<Party> => {
    setUpdating(true);
    try {
      const repo = getRepository();
      const updated = await repo.updateParty(electionId, payload);
      setParties((prev) =>
        prev.map((p) =>
          p.id === payload.id ? { ...p, ...updated } : p
        )
      );
      return updated;
    } finally {
      setUpdating(false);
    }
  };

  const deleteParty = async (partyId: string): Promise<void> => {
    setDeleting(true);
    try {
      const repo = getRepository();
      await repo.deleteParty(electionId, partyId);
      setParties((prev) => prev.filter((p) => p.id !== partyId));
    } finally {
      setDeleting(false);
    }
  };

  const saveCandidates = async (partyId: string, candidates: CandidateInput[]): Promise<Candidate[]> => {
    setSavingCandidates(true);
    try {
      const repo = getRepository();
      const saved = await repo.upsertPartyCandidates(electionId, partyId, candidates);
      // Actualizar la lista local
      setParties((prev) =>
        prev.map((p) =>
          p.id === partyId ? { ...p, candidates: saved } : p
        )
      );
      return saved;
    } finally {
      setSavingCandidates(false);
    }
  };

  return {
    parties,
    loading,
    error,
    refetch: fetchParties,
    createParty,
    updateParty,
    deleteParty,
    saveCandidates,
    creating,
    updating,
    deleting,
    savingCandidates,
  };
};
