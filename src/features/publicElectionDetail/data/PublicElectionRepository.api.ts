import type { IPublicElectionRepository, PublicElectionDetail, PublicElectionStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_BASE_API_URL || 'http://localhost:3000/api/v1';

const colorPalette = [
  '#1e40af',
  '#059669',
  '#dc2626',
  '#7c3aed',
  '#0ea5e9',
  '#f59e0b',
  '#16a34a',
  '#f97316',
];

const formatSchedule = (from?: string | null, to?: string | null) => {
  const format = (value?: string | null) => {
    if (!value) return 'Fecha no definida';
    const date = new Date(value);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' hrs';
  };

  return {
    from: format(from),
    to: format(to),
  };
};

const mapPhaseToStatus = (phase?: string | null): PublicElectionStatus => {
  if (phase === 'RESULTS') return 'FINISHED';
  if (phase === 'ACTIVE') return 'LIVE';
  return 'UPCOMING';
};

const mapDetailToPublic = (raw: any): PublicElectionDetail => {
  const status = mapPhaseToStatus(raw?.phase ?? raw?.state);
  const schedule = formatSchedule(raw?.votingStart, raw?.votingEnd);

  const roles = raw?.results?.roles ?? [];
  const primaryRole = Array.isArray(roles) && roles.length > 0 ? roles[0] : null;
  const ranking = primaryRole?.ranking ?? [];

  const candidates = Array.isArray(ranking)
    ? ranking.map((opt: any, idx: number) => ({
        id: `${primaryRole?.roleName ?? 'role'}-${idx + 1}`,
        name: opt?.optionName ?? '',
        party: opt?.optionName ?? '',
        colorHex: colorPalette[idx % colorPalette.length],
        votes: Number(opt?.votes ?? 0),
        percent: Number(opt?.percentage ?? 0),
      }))
    : [];

  const totalVotes =
    primaryRole?.total !== undefined
      ? Number(primaryRole.total)
      : candidates.reduce((sum, c) => sum + c.votes, 0);

  const winnerOptionName = primaryRole?.winners?.[0]?.optionName ?? null;
  const winnerCandidate =
    winnerOptionName &&
    candidates.find((c) => c.name === winnerOptionName);

  return {
    id: String(raw?.id ?? ''),
    title: raw?.name ?? '',
    subtitle: raw?.objective ?? '',
    status,
    schedule,
    results:
      raw?.resultsAvailable && candidates.length > 0
        ? { totalVotes, candidates }
        : null,
    winnerCandidateId: winnerCandidate?.id ?? (candidates[0]?.id ?? null),
    publicEligibilityEnabled: Boolean(raw?.publicEligibilityEnabled),
    ballotParties: Array.isArray(raw?.options)
      ? raw.options.map((option: any, index: number) => ({
          id: String(option?.id ?? `option-${index + 1}`),
          name: option?.name ?? '',
          colorHex: option?.color ?? colorPalette[index % colorPalette.length],
          logoUrl: option?.logoUrl ?? undefined,
          candidates: Array.isArray(option?.candidates)
            ? option.candidates.map((candidate: any, candidateIndex: number) => ({
                id: String(candidate?.id ?? `${String(option?.id ?? index)}-${candidateIndex + 1}`),
                fullName: candidate?.name ?? '',
                positionName: candidate?.roleName ?? '',
                photoUrl: candidate?.photoUrl ?? undefined,
              }))
            : [],
        }))
      : [],
  };
};

export class PublicElectionRepositoryApi implements IPublicElectionRepository {
  async listPublicElections(): Promise<PublicElectionDetail[]> {
    const response = await fetch(`${API_BASE_URL}/voting/events/public/landing`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error('No se pudo cargar el landing público');
    }

    const data = await response.json();
    const list = [
      ...(Array.isArray(data?.active) ? data.active : []),
      ...(Array.isArray(data?.upcoming) ? data.upcoming : []),
      ...(Array.isArray(data?.results) ? data.results : []),
    ];

    return list.map((event) =>
      mapDetailToPublic({
        ...event,
        resultsAvailable: false,
        results: null,
      }),
    );
  }

  async getPublicElectionDetail(electionId: string): Promise<PublicElectionDetail | null> {
    const response = await fetch(
      `${API_BASE_URL}/voting/events/public/detail/${encodeURIComponent(electionId)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('No se pudo cargar el detalle público');
    }

    const data = await response.json();
    return mapDetailToPublic(data);
  }
}

export const publicElectionRepository = new PublicElectionRepositoryApi();
