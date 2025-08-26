import { BallotType, ElectoralTableType } from '../types';

/**
 * Converts a BallotType to ElectoralTableType format for use in TablesSection
 */
export const ballotToElectoralTable = (ballot: BallotType): ElectoralTableType => {
  return {
    _id: ballot._id,
    tableCode: ballot.tableCode,
    tableNumber: ballot.tableNumber,
    electoralLocationId: ballot.electoralLocationId,
    active: true, // Assume active since it's in the system
    createdAt: ballot.createdAt,
    updatedAt: ballot.updatedAt,
    __v: ballot.__v,
  };
};

/**
 * Converts multiple BallotType objects to ElectoralTableType array
 */
export const ballotsToElectoralTables = (ballots: BallotType[]): ElectoralTableType[] => {
  return ballots.map(ballotToElectoralTable);
};