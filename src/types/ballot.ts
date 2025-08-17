interface PartyVote {
  partyId: string;
  votes: number;
}

interface VoteCategory {
  validVotes: number;
  nullVotes: number;
  blankVotes: number;
  partyVotes: PartyVote[];
  totalVotes: number;
}

interface Circunscripcion {
  number: number;
  type: string;
  name: string;
}

interface Location {
  department: string;
  province: string;
  municipality: string;
  electoralSeat: string;
  electoralLocationName: string;
  district: string;
  zone: string;
  circunscripcion: Circunscripcion;
}

interface Votes {
  parties: VoteCategory;
  deputies: VoteCategory;
}

export interface BallotType {
  _id: string;
  tableNumber: string;
  tableCode: string;
  electoralLocationId: string;
  location: Location;
  votes: Votes;
  ipfsUri: string;
  ipfsCid: string;
  image: string;
  recordId: string;
  tableIdIpfs: string;
  status: string;
  valuable: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
