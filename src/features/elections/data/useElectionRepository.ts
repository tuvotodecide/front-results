import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  useCreateVotingEventMutation,
  useGetVotingEventsQuery,
} from '../../../store/votingEvents';
import { selectTenantId } from '../../../store/auth/authSlice';
import { readStoredUser } from '@/shared/auth/storage';
import type { Election, CreateElectionPayload } from '../types';
import type { VotingEvent } from '../../../store/votingEvents/types';

interface UseElectionsResult {
  elections: Election[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  isEmpty: boolean;
}

const mapEventToElection = (event: VotingEvent): Election => ({
  id: String(event?.id ?? ''),
  institution: String(event?.name ?? ''),
  description: String(event?.objective ?? ''),
  votingStartDate: event?.votingStart ?? '',
  votingEndDate: event?.votingEnd ?? '',
  resultsDate: event?.resultsPublishAt ?? '',
  createdAt: event?.createdAt ?? new Date().toISOString(),
  status:
    event?.status === 'RESULTS_PUBLISHED'
      ? 'RESULTS'
      : event?.status === 'CLOSED'
        ? 'CLOSED'
        : event?.status === 'PUBLISHED'
          ? 'ACTIVE'
          : 'DRAFT',
});

export const useElections = (): UseElectionsResult => {
  const tenantId = useSelector(selectTenantId);
  const { data = [], isLoading, error, refetch } = useGetVotingEventsQuery(
    tenantId ? { tenantId } : undefined,
  );

  const elections = useMemo(() => data.map(mapEventToElection), [data]);

  return {
    elections,
    loading: isLoading,
    error: error ? new Error('Error cargando votaciones') : null,
    refetch,
    isEmpty: !isLoading && elections.length === 0,
  };
};

interface UseCreateElectionResult {
  createElection: (payload: CreateElectionPayload) => Promise<Election>;
  creating: boolean;
  error: Error | null;
}

export const useCreateElection = (): UseCreateElectionResult => {
  const tenantId = useSelector(selectTenantId);
  const [createVotingEvent, createState] = useCreateVotingEventMutation();

  const createElection = async (payload: CreateElectionPayload): Promise<Election> => {
    const storedUser = readStoredUser();
    const effectiveTenantId = tenantId || storedUser?.tenantId || '';
    if (!effectiveTenantId) {
      throw new Error('No se encontró tenantId en sesión. Solicita al superadmin tu tenantId.');
    }

    const created = await createVotingEvent({
      tenantId: effectiveTenantId,
      name: payload.institution,
      objective: payload.description,
      votingStart: new Date(payload.votingStartDate).toISOString(),
      votingEnd: new Date(payload.votingEndDate).toISOString(),
      resultsPublishAt: new Date(payload.resultsDate).toISOString(),
    }).unwrap();

    if (!created?.id) {
      throw new Error("La votación fue creada con una respuesta incompleta. Intenta nuevamente.");
    }

    return {
      id: created.id,
      institution: created.name,
      description: created.objective,
      votingStartDate: created.votingStart ?? payload.votingStartDate,
      votingEndDate: created.votingEnd ?? payload.votingEndDate,
      resultsDate: created.resultsPublishAt ?? payload.resultsDate,
      createdAt: created.createdAt ?? new Date().toISOString(),
      status: 'DRAFT',
    };
  };

  return {
    createElection,
    creating: createState.isLoading,
    error: createState.error ? new Error('Error al crear votación') : null,
  };
};
