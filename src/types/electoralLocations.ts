// Base interface for creating an electoral location (without server-generated fields)
export interface CreateElectoralLocationType {
  fid: string;
  address: string;
  circunscripcion?: {
    number: number;
    type: string;
    name: string;
  };
  code: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  district: string;
  electoralSeatId: string;
  name: string;
  zone: string;
  active: boolean;
}

// Interface for updating an electoral location (partial fields, excluding server-generated ones)
export interface UpdateElectoralLocationType {
  fid?: string;
  address?: string;
  circumscription?: {
    number: number;
    type: string;
    name: string;
  };
  code?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  district?: string;
  electoralSeatId?: string;
  name?: string;
  zone?: string;
  active?: boolean;
}

// Full interface for electoral location data from the server with populated electoralSeatId (used by getElectoralLocations)
export interface ElectoralLocationsType {
  _id: string;
  fid: string;
  __v: number;
  active: boolean;
  address: string;
  circumscription: {
    number: number;
    type: string;
    name: string;
  };
  code: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  district: string;
  electoralSeatId: {
    _id: string;
    name: string;
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
  };
  name: string;
  updatedAt: string;
  zone: string;
}

// Interface for electoral location data with unpopulated electoralSeatId (used by getElectoralLocationsByElectoralSeatId)
export interface ElectoralLocationByElectoralSeatType {
  _id: string;
  fid: string;
  __v: number;
  active: boolean;
  address: string;
  circumscription: {
    number: number;
    type: string;
    name: string;
  };
  code: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  district: string;
  electoralSeatId: string; // Just the ID, not populated
  name: string;
  updatedAt: string;
  zone: string;
}
