// Interface del repositorio de posiciones/cargos

import type { Position, CreatePositionPayload, UpdatePositionPayload } from '../types';

export interface IPositionRepository {
  listPositions(electionId: string): Promise<Position[]>;
  createPosition(electionId: string, payload: CreatePositionPayload): Promise<Position>;
  updatePosition(electionId: string, payload: UpdatePositionPayload): Promise<Position>;
  deletePosition(electionId: string, positionId: string): Promise<void>;
}
