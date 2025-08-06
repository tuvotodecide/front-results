// Base interface for creating a department (without server-generated fields)
export interface CreateDepartmentType {
  name: string;
  active: boolean;
}

// Interface for updating a department (partial fields, excluding server-generated ones)
export interface UpdateDepartmentType {
  name?: string;
  active?: boolean;
}

// Full interface for department data from the server (with all server-generated fields)
export interface DepartmentType {
  _id: string;
  name: string;
  __v?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
