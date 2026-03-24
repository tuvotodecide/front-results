export type PadronStatus =
  | 'ELIGIBLE'
  | 'NOT_ELIGIBLE'
  | 'DISABLED'
  | 'NOT_REGISTERED'
  | 'ROLL_IN_VALIDATION'
  | 'PUBLIC_CHECK_DISABLED';

export type PublicEligibilityStatus =
  | 'ELIGIBLE'
  | 'DISABLED'
  | 'NOT_ELIGIBLE'
  | 'ROLL_IN_VALIDATION'
  | 'PUBLIC_CHECK_DISABLED';

export interface PadronCheckEventResult {
  eventId: string;
  tenantId?: string;
  name: string;
  phase: 'UPCOMING' | 'ACTIVE' | 'RESULTS' | 'OTHER';
  status: PublicEligibilityStatus;
  eligible: boolean;
  referenceVersion?: string | null;
}

export type PadronCheckResult =
  | {
      kind: 'single';
      status: PadronStatus;
      carnet: string;
      mesaAsignada?: string;
      recinto?: string;
      referenceVersion?: string | null;
    }
  | {
      kind: 'multi';
      carnet: string;
      events: PadronCheckEventResult[];
    };

export interface IPadronCheckService {
  checkStatus(carnet: string, eventId?: string): Promise<PadronCheckResult>;
}
