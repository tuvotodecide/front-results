import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useGetConfigurationStatusQuery } from '../store/configurations/configurationsEndpoints';
import { ElectionStatusType } from '../types';

interface ElectionConfig {
  // The current/selected election configuration
  election: ElectionStatusType | null;
  // All active elections
  elections: ElectionStatusType[];
  // Derived properties for backward compatibility
  hasActiveConfig: boolean;
  isVotingPeriod: boolean;
  isResultsPeriod: boolean;
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
  const { data: status, isLoading } = useGetConfigurationStatusQuery();

  return useMemo(() => {
    // No data yet
    if (!status) {
      return {
        election: null,
        elections: [],
        hasActiveConfig: false,
        isVotingPeriod: false,
        isResultsPeriod: false,
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
      isLoading,
    };
  }, [status, selectedElectionId, isLoading]);
}
