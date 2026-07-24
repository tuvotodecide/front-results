import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  useGetEventOptionsQuery,
  useGetEventReviewReadinessQuery,
  useGetEventRolesQuery,
  useGetPadronSummaryQuery,
  useGetPadronVersionsQuery,
  useGetPadronWorkflowSummaryQuery,
  useGetVotingEventQuery,
  useCancelOfficialPublicationRequestMutation,
  useCreateOfficialPublicationRequestMutation,
  useGetActiveOfficialPublicationRequestQuery,
  useMarkEventReadyForReviewMutation,
  OfficialPublicationAdminResponse,
  OfficialPublicationRequestSummary,
  OfficialPublicationRequestStatus,
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
  publicationMissingIdentityCount: number;
  publicationPadronCount: number;
  reviewReadiness: ReviewReadinessResponse | null;
  electionStatus: ElectionStatus;
  loading: boolean;
  error: string | null;
  openReview: () => Promise<ReviewReadinessResponse>;
  openingReview: boolean;
  activateElection: () => Promise<ActivationResult>;
  activating: boolean;
  activationResult: ActivationResult | null;
  officialPublicationRequest?: OfficialPublicationRequestSummary | null;
  officialPublicationMessage?: string | null;
  officialPublicationIsActive?: boolean;
  officialPublicationCanRetry?: boolean;
  officialPublicationCanCancel?: boolean;
  officialPublicationTxUrl?: string | null;
  cancelOfficialPublication?: () => Promise<void>;
  cancelingOfficialPublication?: boolean;
  getShareUrl: () => Promise<string>;
  copyToClipboard: (text: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const ACTIVE_OFFICIAL_PUBLICATION_STATUSES = new Set<OfficialPublicationRequestStatus>([
  'PREPARING',
  'PENDING_APPROVAL',
  'CLAIMED',
  'SIGNING',
  'SUBMITTED',
  'CHAIN_PENDING',
  'CHAIN_CONFIRMED',
  'FINALIZING',
]);

const CANCELABLE_OFFICIAL_PUBLICATION_STATUSES = new Set<OfficialPublicationRequestStatus>([
  'PREPARING',
  'PENDING_APPROVAL',
  'CLAIMED',
  'SIGNING',
]);

const RETRYABLE_OFFICIAL_PUBLICATION_STATUSES = new Set<OfficialPublicationRequestStatus>([
  'FAILED_RETRYABLE',
  'EXPIRED',
]);

export const getOfficialPublicationStatusMessage = (
  status?: OfficialPublicationRequestStatus | null,
) => {
  switch (status) {
    case 'PREPARING':
      return 'Estamos preparando la solicitud de publicación.';
    case 'PENDING_APPROVAL':
    case 'CLAIMED':
    case 'SIGNING':
      return 'Esperando confirmación desde la aplicación móvil.';
    case 'SUBMITTED':
    case 'CHAIN_PENDING':
      return 'Firmado correctamente. Esperando confirmación en blockchain.';
    case 'CHAIN_CONFIRMED':
    case 'FINALIZING':
      return 'Operación confirmada. Finalizando la publicación oficial.';
    case 'COMPLETED':
      return 'La votación fue publicada oficialmente.';
    case 'REJECTED':
      return 'La solicitud de publicación fue rechazada desde la aplicación móvil.';
    case 'EXPIRED':
      return 'El tiempo para confirmar esta publicación ya terminó.';
    case 'CANCELLED':
      return 'La solicitud de publicación fue cancelada.';
    case 'FAILED_RETRYABLE':
      return 'No se pudo completar la publicación. Puedes volver a intentarlo.';
    case 'FAILED_FINAL':
    case 'NEEDS_REVIEW':
      return 'La publicación requiere revisión.';
    default:
      return null;
  }
};

const getExplorerTxUrl = (txHash?: string | null) => {
  if (!txHash) return null;
  return `https://sepolia.basescan.org/tx/${txHash}`;
};

export const useElectionPublish = (electionId: string): UseElectionPublishReturn => {
  const { data: event, isLoading: loadingEvent, refetch: refetchEvent } =
    useGetVotingEventQuery(electionId, { skip: !electionId });
  const { data: roles = [], isLoading: loadingRoles, refetch: refetchRoles } =
    useGetEventRolesQuery(electionId, { skip: !electionId });
  const { data: options = [], isLoading: loadingOptions, refetch: refetchOptions } =
    useGetEventOptionsQuery(electionId, { skip: !electionId });
  const { data: padronVersions = [], isLoading: loadingPadron, refetch: refetchPadron } =
    useGetPadronVersionsQuery(electionId, { skip: !electionId });
  const {
    data: padronWorkflow,
    isLoading: loadingPadronWorkflow,
    refetch: refetchPadronWorkflow,
  } = useGetPadronWorkflowSummaryQuery(electionId, { skip: !electionId });
  const { data: padronSummary, isLoading: loadingPadronSummary, refetch: refetchPadronSummary } =
    useGetPadronSummaryQuery(electionId, { skip: !electionId });
  const { data: reviewReadiness, isLoading: loadingReadiness, refetch: refetchReadiness } =
    useGetEventReviewReadinessQuery(electionId, { skip: !electionId });
  const {
    data: activeOfficialPublication,
    isLoading: loadingOfficialPublication,
    refetch: refetchOfficialPublication,
  } = useGetActiveOfficialPublicationRequestQuery(electionId, {
    skip: !electionId,
  });

  const [markReadyForReview, { isLoading: openingReview }] = useMarkEventReadyForReviewMutation();
  const [createOfficialPublicationRequest, { isLoading: activating }] =
    useCreateOfficialPublicationRequestMutation();
  const [cancelOfficialPublicationRequest, { isLoading: cancelingOfficialPublication }] =
    useCancelOfficialPublicationRequestMutation();
  const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);
  const officialPublicationActiveRequest = activeOfficialPublication?.request ?? null;
  const officialPublicationLatestAttempt = activeOfficialPublication?.latestAttempt ?? null;
  const officialPublicationRequest =
    officialPublicationActiveRequest ?? officialPublicationLatestAttempt ?? null;
  const officialPublicationStatus = officialPublicationRequest?.status ?? null;
  const officialPublicationIsActive = officialPublicationActiveRequest?.status
    ? ACTIVE_OFFICIAL_PUBLICATION_STATUSES.has(officialPublicationActiveRequest.status)
    : false;
  const officialPublicationCanRetry = officialPublicationStatus
    ? RETRYABLE_OFFICIAL_PUBLICATION_STATUSES.has(officialPublicationStatus)
    : false;
  const officialPublicationCanCancel = Boolean(
    officialPublicationActiveRequest?.status &&
      CANCELABLE_OFFICIAL_PUBLICATION_STATUSES.has(officialPublicationActiveRequest.status) &&
      !officialPublicationActiveRequest?.txHash,
  );
  const officialPublicationMessage =
    getOfficialPublicationStatusMessage(officialPublicationStatus);
  const officialPublicationTxUrl = getExplorerTxUrl(officialPublicationRequest?.txHash);

  useEffect(() => {
    if (!officialPublicationIsActive) return undefined;
    const interval = window.setInterval(() => {
      void refetchOfficialPublication();
      if (
        officialPublicationStatus === 'CHAIN_CONFIRMED' ||
        officialPublicationStatus === 'FINALIZING'
      ) {
        void refetchEvent();
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [
    officialPublicationIsActive,
    officialPublicationStatus,
    refetchEvent,
    refetchOfficialPublication,
  ]);

  useEffect(() => {
    if (officialPublicationStatus !== 'COMPLETED') return;
    void Promise.all([
      refetchEvent(),
      refetchReadiness(),
      refetchPadron(),
      refetchPadronWorkflow(),
      refetchPadronSummary(),
    ]);
  }, [
    officialPublicationStatus,
    refetchEvent,
    refetchPadron,
    refetchPadronSummary,
    refetchPadronWorkflow,
    refetchReadiness,
  ]);
  const publicationMissingIdentityCount = Number(
    padronWorkflow?.activeDraft?.summary.missingIdentityCount ?? 0,
  );
  const publicationPadronCount = Number(
    padronWorkflow?.activeDraft?.summary.stagingCount ?? 0,
  );

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
      electionObjective: event.objective,
      isReferendum: Boolean(event.isReferendum),
      parties,
    };
  }, [event, options]);

  const configSummary: ConfigSummary | null = useMemo(() => {
    const reviewPending = new Set(reviewReadiness?.pending ?? []);
    const activeDraft = padronWorkflow?.activeDraft ?? null;
    const padronValidationPendingBlocks =
      !activeDraft && reviewPending.has('padron_validation');
    const padronPending =
      reviewPending.has('padron') ||
      reviewPending.has('padron_invalid') ||
      padronValidationPendingBlocks;
    const positionsCount = roles.length;
    const partiesCount = options.length;
    const partiesWithCandidates = options.filter((o) => (o.candidates ?? []).length > 0).length;
    const currentPadron = padronWorkflow?.currentVersion
      ? {
          validCount: Number(padronWorkflow.currentVersion.totals.validCount ?? 0),
          invalidCount: Number(padronWorkflow.currentVersion.totals.invalidCount ?? 0),
        }
      : padronVersions.find((v) => v.isCurrent) ?? padronVersions[0];
    const votersCount = activeDraft
      ? Number(activeDraft.summary.stagingCount ?? 0)
      : Number(currentPadron?.validCount ?? 0);
    const invalidCount = activeDraft
      ? Number(activeDraft.summary.invalidCount ?? 0) + Number(activeDraft.summary.duplicateCount ?? 0)
      : Number(currentPadron?.invalidCount ?? 0);
    const enabledToVoteCount = activeDraft
      ? Number(activeDraft.summary.enabledCount ?? 0)
      : Number(padronSummary?.enabledToVote ?? 0);
    const disabledToVoteCount = activeDraft
      ? Number(activeDraft.summary.disabledCount ?? 0)
      : Number(padronSummary?.disabledToVote ?? 0);

    return {
      positionsOk: positionsCount > 0,
      partiesOk: partiesWithCandidates > 0,
      padronOk:
        votersCount > 0 &&
        invalidCount === 0 &&
        !padronPending,
      positionsCount,
      partiesCount,
      votersCount,
      enabledToVoteCount,
      disabledToVoteCount,
    };
  }, [options, padronSummary, padronVersions, padronWorkflow, reviewReadiness?.pending, roles]);

  const electionStatus: ElectionStatus = useMemo(() => {
    if (!event) return 'DRAFT';
    if (event.status === 'OFFICIALLY_PUBLISHED' || event.status === 'ACTIVE') return 'ACTIVE';
    if (event.status === 'CLOSED' || event.status === 'RESULTS_PUBLISHED') return 'CLOSED';
    return 'DRAFT';
  }, [event]);

  const activateElection = useCallback(async (): Promise<ActivationResult> => {
    let response: OfficialPublicationAdminResponse;
    try {
      response = await createOfficialPublicationRequest({ eventId: electionId }).unwrap();
    } catch (error) {
      await refetchOfficialPublication();
      throw error;
    }
    await refetchOfficialPublication();

    const publicUrl = `${window.location.origin}/votacion/elecciones/${electionId}/publica`;
    const shareText = `Participa en la votación: ${publicUrl}`;
    const out: ActivationResult = {
      publicUrl,
      shareText,
      electionStatus: response.request?.status === 'COMPLETED' ? 'ACTIVE' : 'DRAFT',
      startsAt: event?.votingStart ?? '',
      nullifiers: [],
    };

    setActivationResult(out);
    await Promise.all([
      refetchReadiness(),
      refetchEvent(),
      refetchPadron(),
      refetchPadronWorkflow(),
      refetchPadronSummary(),
      refetchOfficialPublication(),
    ]);
    return out;
  }, [
    createOfficialPublicationRequest,
    electionId,
    event?.votingStart,
    refetchEvent,
    refetchOfficialPublication,
    refetchPadron,
    refetchPadronSummary,
    refetchPadronWorkflow,
    refetchReadiness,
  ]);

  const openReview = useCallback(async (): Promise<ReviewReadinessResponse> => {
    const response = await markReadyForReview(electionId).unwrap();
    await refetchReadiness();
    await refetchEvent();
    return response;
  }, [electionId, markReadyForReview, refetchEvent, refetchReadiness]);

  const cancelOfficialPublication = useCallback(async () => {
    const requestId = officialPublicationRequest?.requestId;
    if (!requestId) return;
    await cancelOfficialPublicationRequest({ requestId }).unwrap();
    await Promise.all([refetchOfficialPublication(), refetchEvent()]);
  }, [
    cancelOfficialPublicationRequest,
    officialPublicationRequest?.requestId,
    refetchEvent,
    refetchOfficialPublication,
  ]);

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
      refetchPadronWorkflow(),
      refetchPadronSummary(),
      refetchReadiness(),
      refetchOfficialPublication(),
    ]);
  }, [
    refetchEvent,
    refetchOfficialPublication,
    refetchOptions,
    refetchPadron,
    refetchPadronSummary,
    refetchPadronWorkflow,
    refetchReadiness,
    refetchRoles,
  ]);

  return {
    votingEvent: event,
    ballotPreview,
    configSummary,
    publicationMissingIdentityCount,
    publicationPadronCount,
    reviewReadiness: reviewReadiness ?? null,
    electionStatus,
    loading:
      loadingEvent ||
      loadingRoles ||
      loadingOptions ||
      loadingPadron ||
      loadingPadronWorkflow ||
      loadingPadronSummary ||
      loadingReadiness ||
      loadingOfficialPublication,
    error: null,
    openReview,
    openingReview,
    activateElection,
    activating,
    activationResult,
    officialPublicationRequest,
    officialPublicationMessage,
    officialPublicationIsActive,
    officialPublicationCanRetry,
    officialPublicationCanCancel,
    officialPublicationTxUrl,
    cancelOfficialPublication,
    cancelingOfficialPublication,
    getShareUrl,
    copyToClipboard,
    refetch,
  };
};
