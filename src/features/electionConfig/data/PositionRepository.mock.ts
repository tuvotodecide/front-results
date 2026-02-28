// Implementación mock del repositorio de posiciones
// Persiste en localStorage para demo

import type { IPositionRepository } from './PositionRepository';
import type { Position, CreatePositionPayload, UpdatePositionPayload } from '../types';

const STORAGE_KEY = 'mock_positions';
const DELAY_MS = 300;

// Helpers para localStorage
const getStoredPositions = (): Record<string, Position[]> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const savePositions = (data: Record<string, Position[]>): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Simular delay de red
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Generar ID único
const generateId = () => `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const positionRepositoryMock: IPositionRepository = {
  async listPositions(electionId: string): Promise<Position[]> {
    await delay(DELAY_MS);
    const all = getStoredPositions();
    return all[electionId] || [];
  },

  async createPosition(electionId: string, payload: CreatePositionPayload): Promise<Position> {
    await delay(DELAY_MS);

    const newPosition: Position = {
      id: generateId(),
      name: payload.name,
      electionId,
      createdAt: new Date().toISOString(),
    };

    const all = getStoredPositions();
    if (!all[electionId]) {
      all[electionId] = [];
    }
    all[electionId].push(newPosition);
    savePositions(all);

    return newPosition;
  },

  async updatePosition(electionId: string, payload: UpdatePositionPayload): Promise<Position> {
    await delay(DELAY_MS);

    const all = getStoredPositions();
    const positions = all[electionId] || [];
    const index = positions.findIndex((p) => p.id === payload.id);

    if (index === -1) {
      throw new Error('Posición no encontrada');
    }

    positions[index] = {
      ...positions[index],
      name: payload.name,
    };

    all[electionId] = positions;
    savePositions(all);

    return positions[index];
  },

  async deletePosition(electionId: string, positionId: string): Promise<void> {
    await delay(DELAY_MS);

    const all = getStoredPositions();
    const positions = all[electionId] || [];
    all[electionId] = positions.filter((p) => p.id !== positionId);
    savePositions(all);
  },
};
