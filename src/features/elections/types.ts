// Tipos para el módulo de elecciones

export interface Election {
  id: string;
  institution: string;
  description: string;
  isReferendum?: boolean;
  isOpenVoting?: boolean;
  votingStartDate: string; // ISO date
  votingEndDate: string;
  resultsDate: string;
  createdAt: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'RESULTS';
}

export interface CreateElectionPayload {
  institution: string;
  description: string;
  isReferendum: boolean;
  isOpenVoting: boolean;
  maxOpenVoters?: number;
  votingStartDate: string;
  votingEndDate: string;
  resultsDate: string;
}

export interface ElectionFormStep1 {
  institution: string;
  description: string;
  isReferendum: boolean;
  isOpenVoting: boolean;
  maxOpenVoters: number;
}

export interface ElectionFormStep2 {
  votingStartDate: string;
  votingEndDate: string;
  resultsDate: string;
}

export type ElectionFormData = ElectionFormStep1 & ElectionFormStep2;
