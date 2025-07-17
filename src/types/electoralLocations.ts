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
  electoralSeatId: string;
  name: string;
  updatedAt: string;
  zone: string;
}
