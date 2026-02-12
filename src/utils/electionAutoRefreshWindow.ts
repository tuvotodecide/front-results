import { ElectionStatusType } from "../types";

export const FIVE_MINUTES_MS = 5 * 60 * 1000;
export const ONE_MINUTE_MS = 60 * 1000;

const ONE_HOUR_MS = 60 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

export const isElectionInAutoRefreshWindow = (
  election?: Pick<ElectionStatusType, "votingStartDate" | "resultsStartDate"> | null,
  nowMs = Date.now(),
) => {
  if (!election) return false;

  const votingStartMs = new Date(election.votingStartDate).getTime();
  const resultsStartMs = new Date(election.resultsStartDate).getTime();

  if (!Number.isFinite(votingStartMs) || !Number.isFinite(resultsStartMs)) {
    return false;
  }

  const windowStartMs = votingStartMs - ONE_HOUR_MS;
  const windowEndMs = resultsStartMs - THIRTY_MINUTES_MS;

  if (windowEndMs <= windowStartMs) return false;

  return nowMs >= windowStartMs && nowMs < windowEndMs;
};

export const isAnyElectionInAutoRefreshWindow = (
  elections: Array<Pick<ElectionStatusType, "votingStartDate" | "resultsStartDate">> = [],
  nowMs = Date.now(),
) => elections.some((election) => isElectionInAutoRefreshWindow(election, nowMs));
