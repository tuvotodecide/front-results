import { useEffect, useState } from 'react';

export const THIRTY_SIX_HOURS_MS = 36 * 60 * 60 * 1000;

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
