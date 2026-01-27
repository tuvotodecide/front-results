import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useGetConfigurationStatusQuery } from '../store/configurations/configurationsEndpoints';

export default function useElectionId() {
  const selected = useSelector((s: RootState) => s.election.selectedElectionId);
  const { data: status } = useGetConfigurationStatusQuery();

  // If user has selected an election, use that
  if (selected) return selected;

  // Otherwise, return first active election from array or legacy config
  if (status?.elections?.length) {
    const activeElection = status.elections.find(e => e.isActive);
    return activeElection?.id ?? null;
  }

  // Legacy fallback
  return status?.config?.id ?? null;
}
