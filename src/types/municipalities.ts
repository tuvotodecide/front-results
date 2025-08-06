// Base interface for creating a municipality (without server-generated fields)
export interface CreateMunicipalityType {
  // departmentId: string;
  provinceId: string;
  name: string;
  active: boolean;
}

// Interface for updating a municipality (partial fields, excluding server-generated ones)
export interface UpdateMunicipalityType {
  // departmentId?: string;
  provinceId?: string;
  name?: string;
  active?: boolean;
}

// Full interface for municipality data from the server with populated provinceId (used by getMunicipalities)
export interface MunicipalitiesType {
  _id: string;
  provinceId: {
    _id: string;
    name: string;
    departmentId: {
      _id: string;
      name: string;
    };
  };
  name: string;
  __v: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for municipality data with unpopulated provinceId (used by getMunicipalitiesByProvinceId)
export interface MunicipalityByProvinceType {
  _id: string;
  provinceId: string; // Just the ID, not populated
  name: string;
  __v: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
