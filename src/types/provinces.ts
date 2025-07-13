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
