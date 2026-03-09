// Mock implementation del servicio de verificación de padrón
// Esta implementación usa reglas fijas para testing

import type { IPadronCheckService, PadronCheckResult } from './types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class PadronCheckServiceMock implements IPadronCheckService {
  async checkStatus(carnet: string): Promise<PadronCheckResult> {
    // Simular latencia de red (300-800ms)
    await delay(300 + Math.random() * 500);

    const cleanCarnet = carnet.trim();

    // Regla 1: "0000000" => NO HABILITADO
    if (cleanCarnet === '0000000') {
      return {
        kind: 'single',
        status: 'NOT_ELIGIBLE',
        carnet: cleanCarnet,
      };
    }

    // Regla 2: "1111111" => NO REGISTRADO
    if (cleanCarnet === '1111111') {
      return {
        kind: 'single',
        status: 'NOT_REGISTERED',
        carnet: cleanCarnet,
      };
    }

    // Regla 3: Cualquier otro número válido => HABILITADO
    return {
      kind: 'single',
      status: 'ELIGIBLE',
      carnet: cleanCarnet,
      mesaAsignada: 'Mesa ' + (Math.floor(Math.random() * 50) + 1),
      recinto: 'Recinto Electoral Principal',
    };
  }
}

// Singleton para usar en toda la app
export const padronCheckService = new PadronCheckServiceMock();
