import { useEffect, useState } from 'react';

export const MIN_CREATE_LEAD_HOURS = 12;
export const PRE_PUBLICATION_CUTOFF_HOURS = 6;
export const MIN_CREATE_LEAD_MS = MIN_CREATE_LEAD_HOURS * 60 * 60 * 1000;
export const PRE_PUBLICATION_CUTOFF_MS = PRE_PUBLICATION_CUTOFF_HOURS * 60 * 60 * 1000;
export const REFERENDUM_TECHNICAL_ROLE = 'CONSULTA';
export const REFERENDUM_OPTION_LABEL = 'Alternativa';

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

export const toLocalDateTimeValue = (value: Date) => {
  const timezoneOffset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

export const getCurrentLocalDateTime = () => toLocalDateTimeValue(new Date());

export const getMinimumLocalDateTime = (leadMs: number, nowMs = Date.now()) =>
  toLocalDateTimeValue(new Date(nowMs + leadMs));

export const addMinutesToLocalDateTime = (value?: string, minutes = 1, fallback = '') => {
  if (!value) return fallback;
  const base = new Date(value);
  if (Number.isNaN(base.getTime())) return fallback;

  const next = new Date(base.getTime() + minutes * 60 * 1000);
  return toLocalDateTimeValue(next);
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

export type ScheduleFormValues = {
  votingStart: string;
  votingEnd: string;
  resultsPublishAt: string;
};

export type ScheduleFieldErrors = Partial<Record<keyof ScheduleFormValues, string>>;

export const validateScheduleFieldErrors = (
  form: ScheduleFormValues,
  options: {
    nowMs: number;
    minimumStartLeadMs: number;
    minimumStartMessage: string;
  },
): ScheduleFieldErrors => {
  const errors: ScheduleFieldErrors = {};
  const { nowMs, minimumStartLeadMs, minimumStartMessage } = options;

  if (!form.votingStart.trim()) {
    errors.votingStart = 'Debes completar la fecha y hora de inicio.';
  }

  if (!form.votingEnd.trim()) {
    errors.votingEnd = 'Debes completar la fecha y hora de cierre.';
  }

  if (!form.resultsPublishAt.trim()) {
    errors.resultsPublishAt = 'Debes completar la fecha y hora de publicación de resultados.';
  }

  const votingStart = new Date(form.votingStart);
  const votingEnd = new Date(form.votingEnd);
  const resultsPublishAt = new Date(form.resultsPublishAt);

  const hasValidVotingStart =
    form.votingStart.trim() && !Number.isNaN(votingStart.getTime());
  const hasValidVotingEnd =
    form.votingEnd.trim() && !Number.isNaN(votingEnd.getTime());
  const hasValidResults =
    form.resultsPublishAt.trim() && !Number.isNaN(resultsPublishAt.getTime());

  if (form.votingStart.trim() && !hasValidVotingStart) {
    errors.votingStart = 'Debes ingresar una fecha y hora de inicio válida.';
  }

  if (form.votingEnd.trim() && !hasValidVotingEnd) {
    errors.votingEnd = 'Debes ingresar una fecha y hora de cierre válida.';
  }

  if (form.resultsPublishAt.trim() && !hasValidResults) {
    errors.resultsPublishAt = 'Debes ingresar una fecha y hora de resultados válida.';
  }

  if (hasValidVotingStart && votingStart.getTime() < nowMs + minimumStartLeadMs) {
    errors.votingStart = minimumStartMessage;
  }

  if (hasValidVotingStart && hasValidVotingEnd && votingEnd.getTime() <= votingStart.getTime()) {
    errors.votingEnd = 'La fecha de cierre debe ser posterior a la fecha de inicio.';
  }

  if (
    hasValidVotingEnd &&
    hasValidResults &&
    resultsPublishAt.getTime() < votingEnd.getTime() + 60 * 1000
  ) {
    errors.resultsPublishAt =
      'La publicación de resultados debe ser al menos 1 minuto posterior al cierre.';
  }

  return errors;
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

  return votingStart - PRE_PUBLICATION_CUTOFF_MS;
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
