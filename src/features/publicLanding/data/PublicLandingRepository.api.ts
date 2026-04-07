import type { IPublicLandingRepository } from './PublicLandingRepository';
import type { ActiveElection, PublicLandingData } from '../types';
import { publicLandingRepositoryMock } from './PublicLandingRepository.mock';
import { publicEnv } from '@/shared/env/public';

const API_BASE_URL = publicEnv.baseApiUrl;

interface PublicLandingEventDto {
  id?: string | number | null;
  name?: string | null;
  objective?: string | null;
  votingStart?: string | null;
  votingEnd?: string | null;
}

interface PublicLandingResponseDto {
  active?: PublicLandingEventDto[];
  upcoming?: PublicLandingEventDto[];
  results?: PublicLandingEventDto[];
}

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

const formatClosesIn = (end?: string | null) => {
  if (!end) return undefined;
  const ms = new Date(end).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return undefined;
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const mapLandingEvent = (
  event: PublicLandingEventDto,
  status: ActiveElection['status'],
): ActiveElection => ({
  id: String(event?.id ?? ''),
  title: event?.name ?? '',
  organization: event?.objective ?? '',
  status,
  closesIn: status === 'ACTIVA' ? formatClosesIn(event?.votingEnd) : undefined,
  votingSchedule: event?.votingStart || event?.votingEnd
    ? formatSchedule(event?.votingStart ?? null, event?.votingEnd ?? null)
    : undefined,
  isFeatured: false,
});

export class PublicLandingRepositoryApi implements IPublicLandingRepository {
  async getLandingData(): Promise<PublicLandingData> {
    const base = await publicLandingRepositoryMock.getLandingData();
    const { featured, others } = await this.getActiveElections();
    return {
      ...base,
      activeElections: {
        ...base.activeElections,
        featured,
        others,
      },
    };
  }

  async getActiveElections(): Promise<{ featured: ActiveElection | null; others: ActiveElection[] }> {
    const response = await fetch(`${API_BASE_URL}/voting/events/public/landing`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error('No se pudieron cargar las elecciones públicas');
    }

    const data = (await response.json()) as PublicLandingResponseDto;
    const active = Array.isArray(data?.active) ? data.active : [];
    const upcoming = Array.isArray(data?.upcoming) ? data.upcoming : [];
    const results = Array.isArray(data?.results) ? data.results : [];

    const mappedActive = active.map((e) => mapLandingEvent(e, 'ACTIVA'));
    const mappedUpcoming = upcoming.map((e) => mapLandingEvent(e, 'PROXIMA'));
    const mappedResults = results.map((e) => mapLandingEvent(e, 'FINALIZADA'));

    const featuredBase = mappedActive[0] ?? mappedUpcoming[0] ?? mappedResults[0] ?? null;
    const featured = featuredBase ? { ...featuredBase, isFeatured: true } : null;
    const all = [...mappedActive, ...mappedUpcoming, ...mappedResults];
    const others = featured
      ? all.filter((e) => e.id !== featured.id).map((e) => ({ ...e, isFeatured: false }))
      : [];

    return { featured, others };
  }
}

export const publicLandingRepository = new PublicLandingRepositoryApi();
