export interface Ballot {
  _id: string;
  status?: string;
  trackingId?: string;
  file: string;
  tableNumber: string;
  citizenId: string;
  locationCode: string;
}
