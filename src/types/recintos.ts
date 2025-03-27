interface Coordinates {
  latitude: number;
  longitude: number;
  _id: string;
}

export interface RecintoElectoral {
  _id: string;
  active: boolean;
  address: string;
  code: string;
  coordinates: Coordinates;
  createdAt: string;
  department: string;
  municipality: string;
  name: string;
  province: string;
  totalTables: number;
  updatedAt: string;
}
