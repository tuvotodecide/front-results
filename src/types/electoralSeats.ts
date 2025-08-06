// Base interface for creating an electoral seat (without server-generated fields)
export interface CreateElectoralSeatType {
  idLoc: string;
  municipalityId: string;
  name: string;
  active: boolean;
}

// Interface for updating an electoral seat (partial fields, excluding server-generated ones)
export interface UpdateElectoralSeatType {
  idLoc?: string;
  municipalityId?: string;
  name?: string;
  active?: boolean;
}

// Full interface for electoral seat data from the server with populated municipalityId (used by getElectoralSeats)
export interface ElectoralSeatsType {
  _id: string;
  idLoc: string;
  municipalityId: {
    _id: string;
    name: string;
    provinceId: {
      _id: string;
      name: string;
      departmentId: {
        _id: string;
        name: string;
      };
    };
  };
  name: string;
  __v: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for electoral seat data with unpopulated municipalityId (used by getElectoralSeatsByMunicipalityId)
export interface ElectoralSeatByMunicipalityType {
  _id: string;
  idLoc: string;
  municipalityId: string; // Just the ID, not populated
  name: string;
  __v: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
