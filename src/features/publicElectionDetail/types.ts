// Tipos para el detalle público de elecciones

export type PublicElectionStatus = 'FINISHED' | 'LIVE' | 'UPCOMING';

export interface Candidate {
  id: string;
  name: string;
  party: string;
  avatarUrl?: string;
  colorHex: string;
  votes: number;
  percent: number;
}

export interface ElectionSchedule {
  from: string; // Ej: "12 de febrero de 2026 - 08:00 hrs"
  to: string;   // Ej: "12 de febrero de 2026 - 18:00 hrs"
}

export interface ElectionResults {
  totalVotes: number;
  candidates: Candidate[];
}

export interface PublicElectionDetail {
  id: string;
  title: string;
  subtitle: string; // institución/organización
  status: PublicElectionStatus;
  schedule: ElectionSchedule;
  results: ElectionResults | null; // null si UPCOMING
  winnerCandidateId: string | null; // solo si FINISHED
}

export interface IPublicElectionRepository {
  listPublicElections(): Promise<PublicElectionDetail[]>;
  getPublicElectionDetail(electionId: string): Promise<PublicElectionDetail | null>;
}
