import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useGetConfigurationStatusQuery } from '../store/configurations/configurationsEndpoints';

export default function useElectionId() {
  const selected = useSelector((s: RootState) => s.election.selectedElectionId);
  const { data: status } = useGetConfigurationStatusQuery();

  return selected ?? status?.config?.id ?? null;
}
