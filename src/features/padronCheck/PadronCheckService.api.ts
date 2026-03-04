// Placeholder para implementación real con API
// Reemplazar cuando el backend esté listo

import type { IPadronCheckService, PadronCheckResult } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class PadronCheckServiceApi implements IPadronCheckService {
  async checkStatus(carnet: string): Promise<PadronCheckResult> {
    const response = await fetch(`${API_BASE_URL}/padron/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ carnet: carnet.trim() }),
    });

    if (!response.ok) {
      throw new Error('Error al verificar estado en el padrón');
    }

    return response.json();
  }
}

// Descomentar cuando el backend esté listo
// export const padronCheckService = new PadronCheckServiceApi();
