// Tipos para la verificación de padrón electoral

export type PadronStatus = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NOT_REGISTERED';

export interface PadronCheckResult {
  status: PadronStatus;
  carnet: string;
  // Campos opcionales para mostrar si está habilitado
  mesaAsignada?: string;
  recinto?: string;
}

export interface IPadronCheckService {
  checkStatus(carnet: string): Promise<PadronCheckResult>;
}
