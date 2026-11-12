// Asignación de un partido a una elección (colección election_parties en back-results).
// Sin departmentId ni municipalityId = partido nacional (válido en todo el país).
export interface ElectionPartyType {
  _id: string;
  electionId: string;
  partyId: string;
  departmentId: string | null;
  municipalityId: string | null;
  departmentName: string | null;
  municipalityName: string | null;
  active: boolean;
  assignmentOrder?: number | null;
  ballotNumber?: number | null;
  allianceName?: string | null;
  shortName: string | null;
  fullName: string | null;
  logoUrl: string | null;
  color: string | null;
  colors: string[];
}

export interface AssignElectionPartiesType {
  electionId: string;
  partyIds: string[];
  departmentId?: string;
  municipalityId?: string;
}

export interface UpdateElectionPartyType {
  active?: boolean;
  ballotNumber?: number;
  allianceName?: string;
}
