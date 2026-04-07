import type { IPublicElectionRepository, PublicElectionDetail, PublicElectionStatus } from '../types';
import { publicEnv } from '@/shared/env/public';

const API_BASE_URL = publicEnv.baseApiUrl;

interface PublicElectionCandidateDto {
  id?: string | number | null;
  name?: string | null;
  roleName?: string | null;
  photoUrl?: string | null;
}

interface PublicElectionOptionDto {
  id?: string | number | null;
  name?: string | null;
  color?: string | null;
  logoUrl?: string | null;
  candidates?: PublicElectionCandidateDto[] | null;
}

interface PublicElectionResultDto {
  option?: string | null;
  votes?: number | string | null;
}

interface PublicElectionDetailDto {
  id?: string | number | null;
  name?: string | null;
  objective?: string | null;
  phase?: string | null;
  state?: string | null;
  votingStart?: string | null;
  votingEnd?: string | null;
  resultsAvailable?: boolean | null;
  publicEligibilityEnabled?: boolean | null;
  options?: PublicElectionOptionDto[] | null;
  results?: PublicElectionResultDto[] | null;
}

interface PublicElectionLandingResponseDto {
  active?: PublicElectionDetailDto[];
  upcoming?: PublicElectionDetailDto[];
  results?: PublicElectionDetailDto[];
}

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
  if (phase === 'RESULTS' || phase === 'RESULTS_PUBLISHED') return 'FINISHED';
  if (phase === 'ACTIVE' || phase === 'VOTING') return 'LIVE';
  return 'UPCOMING';
};

const mapDetailToPublic = (raw: PublicElectionDetailDto): PublicElectionDetail => {
  type MappedCandidate = {
    id: string;
    name: string;
    party: string;
    avatarUrl?: string;
    colorHex: string;
    votes: number;
    percent: number;
  };

  const status = mapPhaseToStatus(raw?.phase ?? raw?.state);
  const schedule = formatSchedule(raw?.votingStart, raw?.votingEnd);
  const options = Array.isArray(raw?.options) ? raw.options : [];

  const resultRows = Array.isArray(raw?.results) ? raw.results : [];
  const votesByOption = new Map<string, number>(
    resultRows.map((result) => [String(result?.option ?? ''), Number(result?.votes ?? 0)]),
  );

  const mappedOptionCandidates: MappedCandidate[] = options.map((option, idx: number) => {
    const partyName = String(option?.name ?? `Opción ${idx + 1}`);
    const firstCandidate = Array.isArray(option?.candidates) && option.candidates.length > 0
      ? option.candidates[0]
      : null;
    const votes = votesByOption.get(partyName) ?? 0;

    return {
      id: String(option?.id ?? `option-${idx + 1}`),
      name: firstCandidate?.name ?? partyName,
      party: partyName,
      avatarUrl: firstCandidate?.photoUrl ?? undefined,
      colorHex: option?.color ?? colorPalette[idx % colorPalette.length],
      votes,
      percent: 0,
    };
  });

  const baseCandidates: MappedCandidate[] = mappedOptionCandidates;
  const computedTotalVotes = baseCandidates.reduce((sum, candidate) => sum + candidate.votes, 0);
  const candidates: MappedCandidate[] = baseCandidates.map((candidate) => ({
    ...candidate,
    percent: computedTotalVotes > 0
      ? Number(((candidate.votes * 100) / computedTotalVotes).toFixed(2))
      : 0,
  }));

  const totalVotes = computedTotalVotes;

  const maxVotes = candidates.reduce(
    (max, candidate) => Math.max(max, candidate.votes),
    0,
  );
  const topCandidates = candidates.filter((candidate) => candidate.votes === maxVotes);
  const winnerCandidate = topCandidates.length === 1 ? topCandidates[0] : null;

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
    winnerCandidateId: winnerCandidate?.id ?? null,
    publicEligibilityEnabled: Boolean(raw?.publicEligibilityEnabled),
    ballotParties: options.map((option, index: number) => ({
      id: String(option?.id ?? `option-${index + 1}`),
      name: option?.name ?? '',
      colorHex: option?.color ?? colorPalette[index % colorPalette.length],
      logoUrl: option?.logoUrl ?? undefined,
      candidates: Array.isArray(option?.candidates)
        ? option.candidates.map((candidate, candidateIndex: number) => ({
            id: String(candidate?.id ?? `${String(option?.id ?? index)}-${candidateIndex + 1}`),
            fullName: candidate?.name ?? '',
            positionName: candidate?.roleName ?? '',
            photoUrl: candidate?.photoUrl ?? undefined,
          }))
        : [],
    })),
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

    const data = (await response.json()) as PublicElectionLandingResponseDto;
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

    const data = (await response.json()) as PublicElectionDetailDto;
    return mapDetailToPublic(data);
  }
}

export const publicElectionRepository = new PublicElectionRepositoryApi();
