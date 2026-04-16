import { useEffect, useState } from 'react';

export const THIRTY_SIX_HOURS_MS = 36 * 60 * 60 * 1000;
export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

type EventTimelineInput = {
  status?: string | null;
  state?: string | null;
  votingStart?: string | null;
  votingEnd?: string | null;
  resultsPublishAt?: string | null;
  publishDeadline?: string | null;
  canEditPadronInLimitedMode?: boolean;
};

export const stableCreatedAt = (value?: string | null) => value ?? '';

export const getOptionColors = (source: {
  color?: string | null;
  colorHex?: string | null;
  colors?: string[] | null;
}) => {
  const colors = Array.isArray(source.colors)
    ? source.colors.filter((color): color is string => Boolean(color?.trim()))
    : [];

  if (colors.length > 0) return colors;
  return [source.colorHex ?? source.color ?? '#000000'];
};

export const useClientNow = () => {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(new Date().getTime());
  }, []);

  return nowMs;
};

export const hasDraftAlreadyStarted = (
  event: { status?: string | null; state?: string | null; votingStart?: string | null } | undefined,
  nowMs: number | null,
) => {
  if (!event || nowMs === null) return false;
  const state = event.status ?? event.state;
  return (
    state === 'DRAFT' &&
    Boolean(event.votingStart && new Date(event.votingStart).getTime() <= nowMs)
  );
};

const toTimestamp = (value?: string | null) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const getPublishDeadlineMs = (event?: EventTimelineInput | null) => {
  if (!event) return null;

  const explicitDeadline = toTimestamp(event.publishDeadline);
  if (explicitDeadline !== null) {
    return explicitDeadline;
  }

  const votingStart = toTimestamp(event.votingStart);
  if (votingStart === null) {
    return null;
  }

  return votingStart - TWENTY_FOUR_HOURS_MS;
};

export const isDuringVotingWindow = (
  event?: EventTimelineInput | null,
  nowMs?: number | null,
) => {
  if (!event || nowMs === null || nowMs === undefined) return false;
  const votingStart = toTimestamp(event.votingStart);
  const votingEnd = toTimestamp(event.votingEnd);
  if (votingStart === null || votingEnd === null) return false;
  return nowMs >= votingStart && nowMs <= votingEnd;
};

export const hasVotingEnded = (
  event?: EventTimelineInput | null,
  nowMs?: number | null,
) => {
  if (!event || nowMs === null || nowMs === undefined) return false;
  const votingEnd = toTimestamp(event.votingEnd);
  if (votingEnd === null) return false;
  return nowMs > votingEnd;
};

export const areResultsAvailable = (
  event?: EventTimelineInput | null,
  nowMs?: number | null,
) => {
  if (!event || nowMs === null || nowMs === undefined) return false;
  const resultsPublishAt = toTimestamp(event.resultsPublishAt);
  if (resultsPublishAt === null) return false;
  return nowMs >= resultsPublishAt;
};

export const isOfficiallyPublished = (
  event?: EventTimelineInput | null,
) => {
  if (!event) return false;
  const state = event.state ?? event.status;
  return state === 'OFFICIALLY_PUBLISHED';
};

export const canEditElectionBeforeCutoff = (
  event?: EventTimelineInput | null,
  nowMs?: number | null,
) => {
  if (!event || nowMs === null || nowMs === undefined) return false;

  const state = event.state ?? event.status;
  if (state === 'PUBLICATION_EXPIRED') {
    return false;
  }

  if (
    state === 'OFFICIALLY_PUBLISHED' ||
    state === 'ACTIVE' ||
    state === 'CLOSED' ||
    state === 'RESULTS_PUBLISHED'
  ) {
    return false;
  }

  if (isDuringVotingWindow(event, nowMs) || hasVotingEnded(event, nowMs) || areResultsAvailable(event, nowMs)) {
    return false;
  }

  const publishDeadlineMs = getPublishDeadlineMs(event);
  if (publishDeadlineMs === null) {
    return true;
  }

  return nowMs < publishDeadlineMs;
};

export const isAfterPublishCutoffBeforeVoting = (
  event?: EventTimelineInput | null,
  nowMs?: number | null,
) => {
  if (!event || nowMs === null || nowMs === undefined) return false;
  if (event.state === 'PUBLICATION_EXPIRED' || event.status === 'PUBLICATION_EXPIRED') {
    return false;
  }
  if (isOfficiallyPublished(event)) {
    return false;
  }
  if (canEditElectionBeforeCutoff(event, nowMs)) {
    return false;
  }
  if (isDuringVotingWindow(event, nowMs) || hasVotingEnded(event, nowMs) || areResultsAvailable(event, nowMs)) {
    return false;
  }
  return true;
};

export const canEditPadronInLimitedMode = (
  event?: EventTimelineInput | null,
  nowMs?: number | null,
) => {
  if (!event) return false;
  if (!event.canEditPadronInLimitedMode) return false;

  const state = event.state ?? event.status;
  if (
    state === 'PUBLICATION_EXPIRED' ||
    state === 'CLOSED' ||
    state === 'RESULTS_PUBLISHED'
  ) {
    return false;
  }

  return (
    isOfficiallyPublished(event) ||
    state === 'ACTIVE' ||
    isDuringVotingWindow(event, nowMs)
  );
};

export const formatDateTimeForUi = (value?: string | null) => {
  if (!value) return 'No definida';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/La_Paz',
  }).format(new Date(value));
};
