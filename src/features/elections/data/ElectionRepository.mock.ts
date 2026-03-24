// Implementación mock del repositorio de elecciones
// Usa localStorage para persistir entre recargas (demo)

import type { IElectionRepository } from './ElectionRepository';
import type { Election, CreateElectionPayload } from '../types';

const STORAGE_KEY = 'mock_elections';

// Helper para generar ID único
const generateId = (): string => {
  return `election_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper para simular delay de red
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export class ElectionRepositoryMock implements IElectionRepository {
  private getStoredElections(): Election[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveElections(elections: Election[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(elections));
  }

  async listElections(): Promise<Election[]> {
    await delay(300); // Simula latencia
    return this.getStoredElections();
  }

  async createElection(payload: CreateElectionPayload): Promise<Election> {
    await delay(800); // Simula latencia de creación

    const newElection: Election = {
      id: generateId(),
      institution: payload.institution,
      description: payload.description,
      votingStartDate: payload.votingStartDate,
      votingEndDate: payload.votingEndDate,
      resultsDate: payload.resultsDate,
      createdAt: new Date().toISOString(),
      status: 'DRAFT',
    };

    const elections = this.getStoredElections();
    elections.push(newElection);
    this.saveElections(elections);

    return newElection;
  }

  async getElection(id: string): Promise<Election | null> {
    await delay(200);
    const elections = this.getStoredElections();
    return elections.find((e) => e.id === id) || null;
  }

  // Helper para limpiar datos (útil para testing)
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Instancia singleton
export const electionRepositoryMock = new ElectionRepositoryMock();
