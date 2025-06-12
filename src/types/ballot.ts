export interface VerificationHistory {
  status: string;
  verifiedAt: string;
  notes: string;
  _id: string;
}

export interface Ballot {
  _id: string;
  status: string;
  trackingId: string;
  tableNumber: string;
  tableCode: string;
  citizenId?: string;
  locationCode?: string;
  file?: string;
  verificationHistory: VerificationHistory[];
}
