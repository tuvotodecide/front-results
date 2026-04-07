import type {
  IPadronCheckService,
  PadronCheckResult,
  PadronCheckEventResult,
  PublicEligibilityStatus,
} from './types';
import { publicEnv } from '@/shared/env/public';

const API_BASE_URL = publicEnv.baseApiUrl || 'http://localhost:3000/api/v1';
type EligibilityEventRecord = {
  eventId?: string;
  tenantId?: string;
  name?: string;
  phase?: string;
  status?: string;
  eligible?: boolean;
  referenceVersion?: string | null;
};

export class PadronCheckServiceApi implements IPadronCheckService {
  async checkStatus(carnet: string, eventId?: string): Promise<PadronCheckResult> {
    const trimmed = carnet.trim();

    if (eventId) {
      const url = `${API_BASE_URL}/voting/events/${eventId}/eligibility/public?carnet=${encodeURIComponent(
        trimmed,
      )}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al verificar estado en el padrón');
      }

      const data = await response.json();
      const status = String(data?.status ?? 'NOT_ELIGIBLE').toUpperCase();

      if (status === 'ELIGIBLE') {
        return {
          kind: 'single',
          status: 'ELIGIBLE',
          carnet: trimmed,
          referenceVersion: data?.referenceVersion ?? null,
        };
      }

      if (status === 'NOT_ELIGIBLE') {
        return {
          kind: 'single',
          status: 'NOT_ELIGIBLE',
          carnet: trimmed,
          referenceVersion: data?.referenceVersion ?? null,
        };
      }

      if (status === 'DISABLED') {
        return {
          kind: 'single',
          status: 'DISABLED',
          carnet: trimmed,
          referenceVersion: data?.referenceVersion ?? null,
        };
      }

      if (status === 'ROLL_IN_VALIDATION') {
        return {
          kind: 'single',
          status: 'ROLL_IN_VALIDATION',
          carnet: trimmed,
          referenceVersion: data?.referenceVersion ?? null,
        };
      }

      if (status === 'PUBLIC_CHECK_DISABLED') {
        return { kind: 'single', status: 'PUBLIC_CHECK_DISABLED', carnet: trimmed };
      }

      return { kind: 'single', status: 'NOT_REGISTERED', carnet: trimmed };
    }

    const url = `${API_BASE_URL}/voting/events/public/eligibility-by-carnet?carnet=${encodeURIComponent(
      trimmed,
    )}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al verificar estado en el padrón');
    }

    const data = await response.json();
    const events = Array.isArray(data?.events)
      ? data.events.map((event: EligibilityEventRecord): PadronCheckEventResult => ({
          eventId: String(event?.eventId ?? ''),
          tenantId: event?.tenantId ? String(event.tenantId) : undefined,
          name: event?.name ?? '',
          phase: (event?.phase ?? 'OTHER') as 'UPCOMING' | 'ACTIVE' | 'RESULTS' | 'OTHER',
          status: (String(event?.status ?? 'PUBLIC_CHECK_DISABLED').toUpperCase() ||
            'PUBLIC_CHECK_DISABLED') as PublicEligibilityStatus,
          eligible: Boolean(event?.eligible),
          referenceVersion: event?.referenceVersion ?? null,
        }))
      : [];

    return {
      kind: 'multi',
      carnet: String(data?.carnet ?? trimmed),
      events,
    };
  }
}

export const padronCheckService = new PadronCheckServiceApi();
