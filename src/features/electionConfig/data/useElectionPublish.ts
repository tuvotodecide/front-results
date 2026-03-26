import { useMemo, useState, useCallback } from 'react';
import {
  useGetEventOptionsQuery,
  useGetEventRolesQuery,
  useGetPadronVersionsQuery,
  useGetVotingEventQuery,
  usePublishVotingEventMutation,
  VotingEvent,
} from '../../../store/votingEvents';
import type { PartyWithCandidates } from '../types';
import type {
  ActivationResult,
  BallotPreviewData,
  ConfigSummary,
  ElectionStatus,
} from './ElectionPublishRepository.mock';

export interface UseElectionPublishReturn {
  votingEvent?: VotingEvent;
  ballotPreview: BallotPreviewData | null;
  configSummary: ConfigSummary | null;
  electionStatus: ElectionStatus;
  loading: boolean;
  error: string | null;
  activateElection: () => Promise<ActivationResult>;
  activating: boolean;
  activationResult: ActivationResult | null;
  getShareUrl: () => Promise<string>;
  copyToClipboard: (text: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const useElectionPublish = (electionId: string): UseElectionPublishReturn => {
  const { data: event, isLoading: loadingEvent, refetch: refetchEvent } =
    useGetVotingEventQuery(electionId, { skip: !electionId });
  const { data: roles = [], isLoading: loadingRoles, refetch: refetchRoles } =
    useGetEventRolesQuery(electionId, { skip: !electionId });
  const { data: options = [], isLoading: loadingOptions, refetch: refetchOptions } =
    useGetEventOptionsQuery(electionId, { skip: !electionId });
  const { data: padronVersions = [], isLoading: loadingPadron, refetch: refetchPadron } =
    useGetPadronVersionsQuery(electionId, { skip: !electionId });

  const [publishVotingEvent, { isLoading: activating }] = usePublishVotingEventMutation();
  const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);

  const ballotPreview: BallotPreviewData | null = useMemo(() => {
    if (!event) return null;

    const parties: PartyWithCandidates[] = options.map((opt) => ({
      id: opt.id,
      electionId: event.id,
      name: opt.name,
      colorHex: opt.color,
      logoUrl: opt.logoUrl,
      createdAt: opt.createdAt ?? new Date().toISOString(),
      candidates: (opt.candidates ?? []).map((c) => ({
        id: c.id,
        partyId: opt.id,
        positionId: c.roleName,
        positionName: c.roleName,
        fullName: c.name,
        photoUrl: c.photoUrl,
      })),
    }));

    return {
      electionId: event.id,
      electionTitle: event.name,
      parties,
    };
  }, [event, options]);

  const configSummary: ConfigSummary | null = useMemo(() => {
    const positionsCount = roles.length;
    const partiesCount = options.length;
    const partiesWithCandidates = options.filter((o) => (o.candidates ?? []).length > 0).length;
    const currentPadron = padronVersions.find((v) => v.isCurrent) ?? padronVersions[0];
    const votersCount = currentPadron?.validCount ?? 0;
    const invalidCount = currentPadron?.invalidCount ?? 0;

    return {
      positionsOk: positionsCount > 0,
      partiesOk: partiesWithCandidates > 0,
      padronOk: votersCount > 0 && invalidCount === 0,
      positionsCount,
      partiesCount,
      votersCount,
    };
  }, [roles, options, padronVersions]);

  const electionStatus: ElectionStatus = useMemo(() => {
    if (!event) return 'DRAFT';
    if (event.status === 'PUBLISHED') return 'ACTIVE';
    if (event.status === 'CLOSED' || event.status === 'RESULTS_PUBLISHED') return 'CLOSED';
    return 'DRAFT';
  }, [event]);

  const activateElection = useCallback(async (): Promise<ActivationResult> => {
    const response = await publishVotingEvent(electionId).unwrap();

    const publicUrl = `${window.location.origin}/elections/${electionId}/public`;
    const shareText = `Participa en la votación: ${publicUrl}`;
    const out: ActivationResult = {
      publicUrl,
      shareText,
      electionStatus: 'ACTIVE',
      startsAt: event?.votingStart ?? new Date().toISOString(),
      nullifiers: response.nullifiers,
    };

    setActivationResult(out);
    return out;
  }, [publishVotingEvent, electionId, event?.votingStart]);

  const getShareUrl = useCallback(async (): Promise<string> => {
    return `${window.location.origin}/elections/${electionId}/public`;
  }, [electionId]);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const refetch = useCallback(async () => {
    await Promise.all([refetchEvent(), refetchRoles(), refetchOptions(), refetchPadron()]);
  }, [refetchEvent, refetchRoles, refetchOptions, refetchPadron]);

  return {
    votingEvent: event,
    ballotPreview,
    configSummary,
    electionStatus,
    loading: loadingEvent || loadingRoles || loadingOptions || loadingPadron,
    error: null,
    activateElection,
    activating,
    activationResult,
    getShareUrl,
    copyToClipboard,
    refetch,
  };
};
