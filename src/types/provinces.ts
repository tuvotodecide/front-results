// Base interface for creating a province (without server-generated fields)
export interface CreateProvinceType {
  departmentId: string;
  name: string;
  active: boolean;
}

// Interface for updating a province (partial fields, excluding server-generated ones)
export interface UpdateProvinceType {
  departmentId?: string;
  name?: string;
  active?: boolean;
}

// Full interface for province data from the server (with all server-generated fields)
export interface ProvincesType {
  _id: string;
  departmentId: {
    _id: string;
    name: string;
  };
  name: string;
  __v: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
