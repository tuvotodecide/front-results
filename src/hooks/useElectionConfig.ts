import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useGetConfigurationStatusQuery } from '../store/configurations/configurationsEndpoints';
import { ElectionStatusType } from '../types';
import {
  FIVE_MINUTES_MS,
  ONE_MINUTE_MS,
  isAnyElectionInAutoRefreshWindow,
  isElectionInAutoRefreshWindow,
} from '../utils/electionAutoRefreshWindow';

interface ElectionConfig {
  // The current/selected election configuration
  election: ElectionStatusType | null;
  // All active elections
  elections: ElectionStatusType[];
  // Derived properties for backward compatibility
  hasActiveConfig: boolean;
  isVotingPeriod: boolean;
  isResultsPeriod: boolean;
  isAutoRefreshWindow: boolean;
  // Loading state
  isLoading: boolean;
}

/**
 * Hook to get election configuration with backward compatibility.
 * Returns the selected election or the first active election,
 * along with derived properties that match the old API format.
 */
export default function useElectionConfig(): ElectionConfig {
  const selectedElectionId = useSelector((s: RootState) => s.election.selectedElectionId);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [knownActiveElections, setKnownActiveElections] = useState<ElectionStatusType[]>([]);

  const shouldPollStatus = useMemo(() => {
    if (selectedElectionId) {
      const selectedElection =
        knownActiveElections.find((e) => e.id === selectedElectionId) ?? null;
      return isElectionInAutoRefreshWindow(selectedElection, nowMs);
    }
    return isAnyElectionInAutoRefreshWindow(knownActiveElections, nowMs);
  }, [knownActiveElections, selectedElectionId, nowMs]);

  const { data: status, isLoading } = useGetConfigurationStatusQuery(undefined, {
    pollingInterval: shouldPollStatus ? FIVE_MINUTES_MS : 0,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skipPollingIfUnfocused: true,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, ONE_MINUTE_MS);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!status?.elections) return;
    setKnownActiveElections(status.elections.filter((e) => e.isActive));
  }, [status?.elections]);

  return useMemo(() => {
    // No data yet
    if (!status) {
      return {
        election: null,
        elections: [],
        hasActiveConfig: false,
        isVotingPeriod: false,
        isResultsPeriod: false,
        isAutoRefreshWindow: false,
        isLoading,
      };
    }

    // Get active elections from new format
    const activeElections = (status.elections ?? []).filter(e => e.isActive);

    // Find the selected election or default to first active
    let currentElection: ElectionStatusType | null = null;

    if (selectedElectionId) {
      currentElection = activeElections.find(e => e.id === selectedElectionId) ?? null;
    }

    // If no selection or selection not found, use first active election
    if (!currentElection && activeElections.length > 0) {
      currentElection = activeElections[0];
    }

    // Legacy fallback: if using old API format
    if (!currentElection && status.config) {
      currentElection = {
        ...status.config,
        type: 'presidential', // default type for legacy
        round: 1,
        isVotingPeriod: status.isVotingPeriod ?? false,
        isResultsPeriod: status.isResultsPeriod ?? false,
      };
    }

    return {
      election: currentElection,
      elections: activeElections,
      hasActiveConfig: activeElections.length > 0 || !!status.hasActiveConfig,
      isVotingPeriod: currentElection?.isVotingPeriod ?? status.isVotingPeriod ?? false,
      isResultsPeriod: currentElection?.isResultsPeriod ?? status.isResultsPeriod ?? false,
      isAutoRefreshWindow: currentElection
        ? isElectionInAutoRefreshWindow(currentElection, nowMs)
        : isAnyElectionInAutoRefreshWindow(activeElections, nowMs),
      isLoading,
    };
  }, [status, selectedElectionId, isLoading, nowMs]);
}
