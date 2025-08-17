export interface AttestationType {
  _id: string;
  support: boolean;
  ballotId: string;
  isJury: boolean;
  dni: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueryParamsListAttestations {
  ballotId?: string;
  support?: boolean;
  isJury?: boolean;
  limit?: number | string;
  page?: number | string;
}

export interface MostSupportedBallotType {
  ballotId: string;
  version: number;
  supportCount: number;
  totalAttestations: number;
}

interface CircunscripcionType {
  number: number;
  type: string;
  name: string;
}

interface LocationType {
  department: string;
  province: string;
  municipality: string;
  electoralSeat: string;
  electoralLocationName: string;
  district: string;
  zone: string;
  circunscripcion: CircunscripcionType;
}

interface SupportsType {
  users: number;
  juries: number;
}

export interface AttestationsBallotType {
  ballotId: string;
  version: number;
  location: LocationType;
  supports: SupportsType;
}

export interface AttestationCasesType {
  tableCode: string;
  status: string;
  isObserved: boolean;
  winningBallotId: string | null;
  resolvedAt: string | null;
  ballots: AttestationsBallotType[];
  summary: Record<string, any>;
}
