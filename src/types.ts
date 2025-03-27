export interface RecintoElectoral {
  _id: string;
  name: string;
  code: string;
  address: string;
  department: string;
  province: string;
  municipality: string;
  totalTables: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  active: boolean;
}
