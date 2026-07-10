import {
  consumptionPerValidVote,
  mockInstitutionTvdBalance,
} from "../data/adminTvd.mock";
import type { InstitutionTvdBalance, TvdConsumptionEstimate } from "../types";

export const getInstitutionTvdBalance = async (): Promise<InstitutionTvdBalance> => {
  return mockInstitutionTvdBalance;
};

export const estimateTvdConsumption = (voters: number): TvdConsumptionEstimate => {
  const normalizedVoters = Number.isFinite(voters) && voters > 0 ? Math.floor(voters) : 0;

  return {
    voters: normalizedVoters,
    consumptionPerValidVote,
    total: normalizedVoters * consumptionPerValidVote,
  };
};
