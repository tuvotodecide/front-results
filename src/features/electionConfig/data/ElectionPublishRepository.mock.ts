// Mock Repository para publicación de elecciones
// Interface estable lista para API real

import type { PartyWithCandidates } from '../types';

export interface BallotPreviewData {
  electionId: string;
  electionTitle: string;
  parties: PartyWithCandidates[];
}

export interface ConfigSummary {
  positionsOk: boolean;
  partiesOk: boolean;
  padronOk: boolean;
  positionsCount: number;
  partiesCount: number;
  votersCount: number;
  enabledToVoteCount: number;
  disabledToVoteCount: number;
}

export interface ActivationResult {
  publicUrl: string;
  shareText: string;
  electionStatus: 'ACTIVE' | 'DRAFT' | 'CLOSED';
  startsAt: string;
  nullifiers: string[];
}

export type ElectionStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

const STORAGE_KEY_ELECTIONS = 'mock_elections';
const STORAGE_KEY_PARTIES = 'mock_parties';
const STORAGE_KEY_CANDIDATES = 'mock_candidates';
const STORAGE_KEY_POSITIONS = 'mock_positions';
const STORAGE_KEY_PADRON = 'mock_padron';

// Simula delay de red
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// =====================
// Repository Interface
// =====================

export interface ElectionPublishRepository {
  getBallotPreview(electionId: string): Promise<BallotPreviewData>;
  getConfigSummary(electionId: string): Promise<ConfigSummary>;
  activateElection(electionId: string): Promise<ActivationResult>;
  getPublicShareUrl(electionId: string): Promise<string>;
  getElectionStatus(electionId: string): Promise<ElectionStatus>;
}

// =====================
// Mock Implementation
// =====================

export const createMockElectionPublishRepository = (): ElectionPublishRepository => {
  return {
    async getBallotPreview(electionId: string): Promise<BallotPreviewData> {
      await delay(300);

      // Obtener título de elección
      let electionTitle = 'Elecciones Universitarias';
      try {
        const stored = localStorage.getItem(STORAGE_KEY_ELECTIONS);
        if (stored) {
          const elections = JSON.parse(stored);
          const election = elections.find((e: { id: string }) => e.id === electionId);
          if (election) electionTitle = election.institution;
        }
      } catch {}

      // Obtener partidos con candidatos
      const parties: PartyWithCandidates[] = [];
      try {
        const storedParties = localStorage.getItem(STORAGE_KEY_PARTIES);
        const storedCandidates = localStorage.getItem(STORAGE_KEY_CANDIDATES);

        if (storedParties) {
          const parsedParties = JSON.parse(storedParties);
          const parsedCandidates = storedCandidates ? JSON.parse(storedCandidates) : {};

          const electionParties = Array.isArray(parsedParties)
            ? parsedParties.filter((p: { electionId: string }) => p.electionId === electionId)
            : (parsedParties[electionId] || []);

          for (const party of electionParties) {
            const candidatesForParty = Array.isArray(parsedCandidates)
              ? parsedCandidates.filter((c: { partyId: string }) => c.partyId === party.id)
              : (parsedCandidates[`${electionId}_${party.id}`] || []);

            parties.push({
              ...party,
              candidates: candidatesForParty,
            });
          }
        }
      } catch {}

      return {
        electionId,
        electionTitle,
        parties,
      };
    },

    async getConfigSummary(electionId: string): Promise<ConfigSummary> {
      await delay(200);

      let positionsCount = 0;
      let partiesCount = 0;
      let partiesWithCandidatesCount = 0;
      let votersCount = 0;

      // Contar posiciones
      try {
        const stored = localStorage.getItem(STORAGE_KEY_POSITIONS);
        if (stored) {
          const parsedPositions = JSON.parse(stored);
          const electionPositions = Array.isArray(parsedPositions)
            ? parsedPositions.filter((p: { electionId: string }) => p.electionId === electionId)
            : (parsedPositions[electionId] || []);
          positionsCount = electionPositions.length;
        }
      } catch {}

      // Contar partidos y verificar si tienen candidatos
      try {
        const storedParties = localStorage.getItem(STORAGE_KEY_PARTIES);
        const storedCandidates = localStorage.getItem(STORAGE_KEY_CANDIDATES);
        const parsedCandidates = storedCandidates ? JSON.parse(storedCandidates) : {};

        if (storedParties) {
          const parsedParties = JSON.parse(storedParties);
          const electionParties = Array.isArray(parsedParties)
            ? parsedParties.filter((p: { electionId: string }) => p.electionId === electionId)
            : (parsedParties[electionId] || []);

          partiesCount = electionParties.length;
          partiesWithCandidatesCount = electionParties.filter((party: { id: string }) => {
            if (Array.isArray(parsedCandidates)) {
              return parsedCandidates.some((candidate: { partyId: string }) => candidate.partyId === party.id);
            }
            const key = `${electionId}_${party.id}`;
            return (parsedCandidates[key] || []).length > 0;
          }).length;
        }
      } catch {}

      // Contar votantes válidos
      try {
        const stored = localStorage.getItem(STORAGE_KEY_PADRON);
        if (stored) {
          const allStates = JSON.parse(stored);
          const state = allStates[electionId];
          if (state?.file) {
            votersCount = state.file.validCount || 0;
          }
        }
      } catch {}

      return {
        positionsOk: positionsCount > 0,
        partiesOk: partiesWithCandidatesCount > 0,
        padronOk: votersCount > 0,
        positionsCount,
        partiesCount,
        votersCount,
        enabledToVoteCount: 0,
        disabledToVoteCount: 0,
      };
    },

    async activateElection(electionId: string): Promise<ActivationResult> {
      await delay(1500); // Simular proceso de activación

      // Actualizar estado de la elección en storage
      try {
        const stored = localStorage.getItem(STORAGE_KEY_ELECTIONS);
        if (stored) {
          const elections = JSON.parse(stored);
          const idx = elections.findIndex((e: { id: string }) => e.id === electionId);
          if (idx !== -1) {
            elections[idx].status = 'ACTIVE';
            elections[idx].activatedAt = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY_ELECTIONS, JSON.stringify(elections));
          }
        }
      } catch {}

      const publicUrl = `${window.location.origin}/votar/${electionId}`;
      const shareText = `¡Participa en las elecciones! Vota aquí: ${publicUrl}`;

      return {
        publicUrl,
        shareText,
        electionStatus: 'ACTIVE',
        startsAt: new Date().toISOString(),
        nullifiers: [],
      };
    },

    async getPublicShareUrl(electionId: string): Promise<string> {
      await delay(100);
      return `${window.location.origin}/votar/${electionId}`;
    },

    async getElectionStatus(electionId: string): Promise<ElectionStatus> {
      await delay(100);

      try {
        const stored = localStorage.getItem(STORAGE_KEY_ELECTIONS);
        if (stored) {
          const elections = JSON.parse(stored);
          const election = elections.find((e: { id: string }) => e.id === electionId);
          if (election?.status) {
            return election.status as ElectionStatus;
          }
        }
      } catch {}

      return 'DRAFT';
    },
  };
};

// Exportar instancia singleton
export const electionPublishRepository = createMockElectionPublishRepository();
