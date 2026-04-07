// Interface del repositorio para datos del landing público
// Permite cambiar fácilmente entre mock y API real

import type { PublicLandingData, ActiveElection } from '../types';

export interface IPublicLandingRepository {
  /**
   * Obtiene todos los datos del landing
   */
  getLandingData(): Promise<PublicLandingData>;

  /**
   * Obtiene solo las elecciones activas (para refresh)
   */
  getActiveElections(): Promise<{
    featured: ActiveElection | null;
    others: ActiveElection[];
  }>;

  getPastElections(): Promise<ActiveElection[]>;
}
