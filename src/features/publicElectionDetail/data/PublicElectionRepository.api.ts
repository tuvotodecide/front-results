// Placeholder para implementación real con API
// Reemplazar cuando el backend esté listo

import type { IPublicElectionRepository, PublicElectionDetail } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class PublicElectionRepositoryApi implements IPublicElectionRepository {
  async listPublicElections(): Promise<PublicElectionDetail[]> {
    const response = await fetch(`${API_BASE_URL}/public/elections`);
    if (!response.ok) {
      throw new Error('Error al obtener elecciones públicas');
    }
    return response.json();
  }

  async getPublicElectionDetail(electionId: string): Promise<PublicElectionDetail | null> {
    const response = await fetch(`${API_BASE_URL}/public/elections/${electionId}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error('Error al obtener detalle de elección');
    }
    return response.json();
  }
}

// Descomentar cuando el backend esté listo
// export const publicElectionRepository = new PublicElectionRepositoryApi();
