import { useMemo, useState, useCallback } from 'react';
import {
  useGetEventOptionsQuery,
  useGetEventReviewReadinessQuery,
  useGetEventRolesQuery,
  useGetPadronSummaryQuery,
  useGetPadronVersionsQuery,
  useGetVotingEventQuery,
  useConfirmOfficialPublicationMutation,
  useMarkEventReadyForReviewMutation,
  VotingEvent,
} from '../../../store/votingEvents';
import { getOptionColors, stableCreatedAt } from '../renderUtils';
import type { PartyWithCandidates } from '../types';
import type {
  ActivationResult,
  BallotPreviewData,
  ConfigSummary,
  ElectionStatus,
} from './ElectionPublishRepository.mock';
import type { ReviewReadinessResponse } from '../../../store/votingEvents/types';

export interface UseElectionPublishReturn {
  votingEvent?: VotingEvent;
  ballotPreview: BallotPreviewData | null;
  configSummary: ConfigSummary | null;
  reviewReadiness: ReviewReadinessResponse | null;
  electionStatus: ElectionStatus;
  loading: boolean;
  error: string | null;
  openReview: () => Promise<ReviewReadinessResponse>;
  openingReview: boolean;
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
  const { data: padronSummary, isLoading: loadingPadronSummary, refetch: refetchPadronSummary } =
    useGetPadronSummaryQuery(electionId, { skip: !electionId });
  const { data: reviewReadiness, isLoading: loadingReadiness, refetch: refetchReadiness } =
    useGetEventReviewReadinessQuery(electionId, { skip: !electionId });

  const [markReadyForReview, { isLoading: openingReview }] = useMarkEventReadyForReviewMutation();
  const [confirmOfficialPublication, { isLoading: activating }] = useConfirmOfficialPublicationMutation();
  const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);

  const ballotPreview: BallotPreviewData | null = useMemo(() => {
    if (!event) return null;

    const parties: PartyWithCandidates[] = options.map((opt) => ({
      id: opt.id,
      electionId: event.id,
      name: opt.name,
      colorHex: opt.color,
      colors: getOptionColors(opt),
      logoUrl: opt.logoUrl,
      createdAt: stableCreatedAt(opt.createdAt),
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
    const enabledToVoteCount = padronSummary?.enabledToVote ?? 0;
    const disabledToVoteCount = padronSummary?.disabledToVote ?? 0;

    return {
      positionsOk: positionsCount > 0,
      partiesOk: partiesWithCandidates > 0,
      padronOk: votersCount > 0 && invalidCount === 0,
      positionsCount,
      partiesCount,
      votersCount,
      enabledToVoteCount,
      disabledToVoteCount,
    };
  }, [roles, options, padronVersions, padronSummary]);

  const electionStatus: ElectionStatus = useMemo(() => {
    if (!event) return 'DRAFT';
    if (event.status === 'PUBLISHED' || event.status === 'OFFICIALLY_PUBLISHED') return 'ACTIVE';
    if (event.status === 'CLOSED' || event.status === 'RESULTS_PUBLISHED') return 'CLOSED';
    return 'DRAFT';
  }, [event]);

  const activateElection = useCallback(async (): Promise<ActivationResult> => {
    const response = await confirmOfficialPublication({ eventId: electionId }).unwrap();

    const publicUrl = response.publicUrl ?? `${window.location.origin}/votacion/elecciones/${electionId}/publica`;
    const shareText = `Participa en la votación: ${publicUrl}`;
    const out: ActivationResult = {
      publicUrl,
      shareText,
      electionStatus: 'ACTIVE',
      startsAt: event?.votingStart ?? response.officialPublishedAt ?? '',
      nullifiers: response.nullifiers ?? [],
    };

    setActivationResult(out);
    await refetchReadiness();
    await refetchEvent();
    return out;
  }, [confirmOfficialPublication, electionId, event?.votingStart, refetchEvent, refetchReadiness]);

  const openReview = useCallback(async (): Promise<ReviewReadinessResponse> => {
    const response = await markReadyForReview(electionId).unwrap();
    await refetchReadiness();
    await refetchEvent();
    return response;
  }, [electionId, markReadyForReview, refetchEvent, refetchReadiness]);

  const getShareUrl = useCallback(async (): Promise<string> => {
    return `${window.location.origin}/votacion/elecciones/${electionId}/publica`;
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
    await Promise.all([
      refetchEvent(),
      refetchRoles(),
      refetchOptions(),
      refetchPadron(),
      refetchPadronSummary(),
      refetchReadiness(),
    ]);
  }, [refetchEvent, refetchRoles, refetchOptions, refetchPadron, refetchPadronSummary, refetchReadiness]);

  return {
    votingEvent: event,
    ballotPreview,
    configSummary,
    reviewReadiness: reviewReadiness ?? null,
    electionStatus,
    loading:
      loadingEvent ||
      loadingRoles ||
      loadingOptions ||
      loadingPadron ||
      loadingPadronSummary ||
      loadingReadiness,
    error: null,
    openReview,
    openingReview,
    activateElection,
    activating,
    activationResult,
    getShareUrl,
    copyToClipboard,
    refetch,
  };
};
