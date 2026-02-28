// Interface del repositorio de partidos/planchas

import type { Party, CreatePartyPayload, UpdatePartyPayload, Candidate, CandidateInput } from '../types';

export interface IPartyRepository {
  listParties(electionId: string): Promise<Party[]>;
  createParty(electionId: string, payload: CreatePartyPayload): Promise<Party>;
  updateParty(electionId: string, payload: UpdatePartyPayload): Promise<Party>;
  deleteParty(electionId: string, partyId: string): Promise<void>;

  // Candidatos
  getPartyCandidates(electionId: string, partyId: string): Promise<Candidate[]>;
  upsertPartyCandidates(electionId: string, partyId: string, candidates: CandidateInput[]): Promise<Candidate[]>;
}
