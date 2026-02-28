// Interface del repositorio de elecciones
// Permite cambiar entre mock y API real sin tocar UI

import type { Election, CreateElectionPayload } from '../types';

export interface IElectionRepository {
  /**
   * Lista todas las elecciones del usuario
   */
  listElections(): Promise<Election[]>;

  /**
   * Crea una nueva elección
   */
  createElection(payload: CreateElectionPayload): Promise<Election>;

  /**
   * Obtiene una elección por ID
   */
  getElection(id: string): Promise<Election | null>;
}
