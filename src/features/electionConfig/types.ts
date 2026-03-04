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
  logoUrl?: string; // base64 o URL
  createdAt: string;
}

export interface CreatePartyPayload {
  name: string;
  colorHex: string;
  logoBase64?: string;
}

export interface UpdatePartyPayload {
  id: string;
  name: string;
  colorHex: string;
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
export type InvalidReason = 'empty' | 'invalid_format' | 'duplicate';

export interface Voter {
  id: string;
  rowNumber: number;
  carnet: string;
  fullName: string;
  status: VoterStatus;
  invalidReason?: InvalidReason;
}

export interface PadronUploadResult {
  totalRecords: number;
  validCount: number;
  invalidCount: number;
  voters: Voter[];
}

export interface PadronFile {
  fileName: string;
  uploadedAt: string;
  totalRecords: number;
  validCount: number;
  invalidCount: number;
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
}

export interface PadronSummary {
  totalRecords: number;
  validCount: number;
  invalidCount: number;
}
