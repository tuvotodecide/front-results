// Implementación mock del repositorio de partidos
// Persiste en localStorage para demo

import type { IPartyRepository } from './PartyRepository';
import type { Party, CreatePartyPayload, UpdatePartyPayload, Candidate, CandidateInput } from '../types';

const PARTIES_KEY = 'mock_parties';
const CANDIDATES_KEY = 'mock_candidates';
const DELAY_MS = 300;

// Helpers
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getStoredParties = (): Record<string, Party[]> => {
  try {
    const stored = localStorage.getItem(PARTIES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveParties = (data: Record<string, Party[]>): void => {
  localStorage.setItem(PARTIES_KEY, JSON.stringify(data));
};

const getStoredCandidates = (): Record<string, Candidate[]> => {
  try {
    const stored = localStorage.getItem(CANDIDATES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveCandidates = (data: Record<string, Candidate[]>): void => {
  localStorage.setItem(CANDIDATES_KEY, JSON.stringify(data));
};

// Key para candidatos: `${electionId}_${partyId}`
const getCandidatesKey = (electionId: string, partyId: string) => `${electionId}_${partyId}`;

export const partyRepositoryMock: IPartyRepository = {
  async listParties(electionId: string): Promise<Party[]> {
    await delay(DELAY_MS);
    const all = getStoredParties();
    return all[electionId] || [];
  },

  async createParty(electionId: string, payload: CreatePartyPayload): Promise<Party> {
    await delay(DELAY_MS);

    const newParty: Party = {
      id: generateId(),
      electionId,
      name: payload.name,
      colorHex: payload.colorHex,
      logoUrl: payload.logoBase64,
      createdAt: new Date().toISOString(),
    };

    const all = getStoredParties();
    if (!all[electionId]) {
      all[electionId] = [];
    }
    all[electionId].push(newParty);
    saveParties(all);

    return newParty;
  },

  async updateParty(electionId: string, payload: UpdatePartyPayload): Promise<Party> {
    await delay(DELAY_MS);

    const all = getStoredParties();
    const parties = all[electionId] || [];
    const index = parties.findIndex((p) => p.id === payload.id);

    if (index === -1) {
      throw new Error('Partido no encontrado');
    }

    parties[index] = {
      ...parties[index],
      name: payload.name,
      colorHex: payload.colorHex,
      logoUrl: payload.logoBase64 ?? parties[index].logoUrl,
    };

    all[electionId] = parties;
    saveParties(all);

    return parties[index];
  },

  async deleteParty(electionId: string, partyId: string): Promise<void> {
    await delay(DELAY_MS);

    // Eliminar partido
    const allParties = getStoredParties();
    const parties = allParties[electionId] || [];
    allParties[electionId] = parties.filter((p) => p.id !== partyId);
    saveParties(allParties);

    // Eliminar candidatos del partido
    const allCandidates = getStoredCandidates();
    const key = getCandidatesKey(electionId, partyId);
    delete allCandidates[key];
    saveCandidates(allCandidates);
  },

  async getPartyCandidates(electionId: string, partyId: string): Promise<Candidate[]> {
    await delay(DELAY_MS / 2);
    const all = getStoredCandidates();
    const key = getCandidatesKey(electionId, partyId);
    return all[key] || [];
  },

  async upsertPartyCandidates(
    electionId: string,
    partyId: string,
    candidateInputs: CandidateInput[]
  ): Promise<Candidate[]> {
    await delay(DELAY_MS);

    const candidates: Candidate[] = candidateInputs.map((input) => ({
      id: generateId(),
      partyId,
      positionId: input.positionId,
      positionName: input.positionName,
      fullName: input.fullName,
      photoUrl: input.photoBase64,
    }));

    const all = getStoredCandidates();
    const key = getCandidatesKey(electionId, partyId);
    all[key] = candidates;
    saveCandidates(all);

    return candidates;
  },
};
