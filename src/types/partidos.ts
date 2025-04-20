interface Participante {
  electionYear: number;
  candidateName: string;
  position: string;
  enabled: boolean;
}

export interface Partido {
  _id: string;
  partyId: string;
  fullName: string;
  logoUrl: string;
  color: string;
  legalRepresentative: string;
  active: boolean;
  electionParticipation: Participante[];
}
