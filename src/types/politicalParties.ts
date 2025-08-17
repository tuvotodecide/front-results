// Base interface for creating a political party (without server-generated fields)
export interface CreatePoliticalPartyType {
  partyId: string;
  fullName: string;
  shortName: string;
  logoUrl: string;
  color: string;
  active: boolean;
}

// Interface for updating a political party (partial fields, excluding server-generated ones)
export interface UpdatePoliticalPartyType {
  partyId?: string;
  fullName?: string;
  shortName?: string;
  logoUrl?: string;
  color?: string;
  active?: boolean;
}

// Full interface for political parties data from the server
export interface PoliticalPartiesType {
  _id: string;
  partyId: string;
  fullName: string;
  shortName: string;
  logoUrl: string;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
