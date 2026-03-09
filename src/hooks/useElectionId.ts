import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectAuth } from '../store/auth/authSlice';
import { useGetConfigurationStatusQuery } from '../store/configurations/configurationsEndpoints';

export default function useElectionId() {
  const selected = useSelector((s: RootState) => s.election.selectedElectionId);
  const auth = useSelector(selectAuth);
  const { data: status } = useGetConfigurationStatusQuery();

  // If user has selected an election, use that
  if (selected) return selected;

  // Otherwise, return first active election that matches user role
  if (status?.elections?.length) {
    const activeElections = status.elections.filter(e => e.isActive);
    const userRole = auth.user?.role;

    if (userRole === 'MAYOR') {
      const municipal = activeElections.find(e => e.type === 'municipal');
      if (municipal) return municipal.id;
    } else if (userRole === 'GOVERNOR') {
      const departamental = activeElections.find(e => e.type === 'departamental');
      if (departamental) return departamental.id;
    }

    // Default to first active if no role match or generic role
    const activeElection = activeElections[0];
    return activeElection?.id ?? null;
  }

  // Legacy fallback
  return status?.config?.id ?? null;
}

