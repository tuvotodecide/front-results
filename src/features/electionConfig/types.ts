// Tipos para la configuración de elecciones

export interface Position {
  id: string;
  name: string;
  electionId: string;
  createdAt: string;
}

export interface CreatePositionPayload {
  name: string;
}

export interface UpdatePositionPayload {
  id: string;
  name: string;
}

export type ConfigStep = 1 | 2 | 3;

export interface ElectionConfigState {
  electionId: string;
  electionTitle: string;
  currentStep: ConfigStep;
  positions: Position[];
}

// Tipos para Partidos/Planchas
export interface Party {
  id: string;
  electionId: string;
  name: string;
  colorHex: string;
  colors?: string[];
  logoUrl?: string; // base64 o URL
  createdAt: string;
}

export interface CreatePartyPayload {
  name: string;
  colorHex: string;
  colors?: string[];
  logoBase64?: string;
}

export interface UpdatePartyPayload {
  id: string;
  name: string;
  colorHex: string;
  colors?: string[];
  logoBase64?: string;
}

// Tipos para Candidatos
export interface Candidate {
  id: string;
  partyId: string;
  positionId: string;
  positionName: string;
  fullName: string;
  photoUrl?: string; // base64 o URL
}

export interface CandidateInput {
  positionId: string;
  positionName: string;
  fullName: string;
  photoBase64?: string;
}

export interface PartyWithCandidates extends Party {
  candidates: Candidate[];
}

export type StepStatus = 'pending' | 'active' | 'completed';

// Tipos para Padrón Electoral (Step 3)
export type VoterStatus = 'valid' | 'invalid';
export type InvalidReason = 'empty' | 'invalid_format' | 'duplicate' | 'invalid_enabled';

export interface Voter {
  id: string;
  rowNumber: number;
  carnet: string;
  fullName: string;
  enabled: boolean;
  status: VoterStatus;
  invalidReason?: InvalidReason;
  sourceKind?: 'PARSED' | 'MANUAL';
  sourceRow?: number | null;
  updatedAt?: string | null;
}

export interface PadronUploadResult {
  totalRecords: number;
  validCount: number;
  invalidCount: number;
  duplicateCount?: number;
  enabledCount?: number;
  disabledCount?: number;
  importJobId?: string;
  voters: Voter[];
}

export interface PadronFile {
  fileName: string;
  uploadedAt: string;
  totalRecords: number;
  validCount: number;
  invalidCount: number;
  sourceType?: string;
}

export interface PadronState {
  electionId: string;
  file: PadronFile | null;
  voters: Voter[];
  isLoaded: boolean;
}

export interface CorrectionInput {
  id: string;
  carnet: string;
  enabled?: boolean;
}

export interface PadronSummary {
  totalRecords: number;
  validCount: number;
  invalidCount: number;
}
