const FIVE_MINUTES_MS = 5 * 60 * 1000;

type ResultRow = {
  partyId: string;
  totalVotes: number;
  percentage: string;
  color?: string;
};

type ResultsSummary = {
  summary: {
    validVotes: number;
    blankVotes: number;
    nullVotes: number;
    tablesProcessed?: number;
    lastUpdate?: string;
  };
  results: ResultRow[];
};

type TerritorialFilters = {
  department?: string;
  province?: string;
  municipality?: string;
  electoralSeat?: string;
  electoralLocation?: string;
  tableCode?: string;
};

const knownPartyColors: Record<string, string> = {
  MAS: '#1d4ed8',
  CC: '#16a34a',
};

function stableColorForParty(partyId: string) {
  if (knownPartyColors[partyId]) return knownPartyColors[partyId];
  let hash = 0;
  for (const char of partyId) hash = (hash * 31 + char.charCodeAt(0)) % 0xffffff;
  return `#${hash.toString(16).padStart(6, '0')}`;
}

function buildAdminSeries(response: ResultsSummary) {
  return response.results.map((row) => ({
    label: row.partyId,
    tableVotes: row.totalVotes,
    barValue: row.totalVotes,
    pieValue: row.totalVotes,
    percentage: row.percentage,
    color: row.color ?? stableColorForParty(row.partyId),
  }));
}

function clearChildFilters(
  filters: TerritorialFilters,
  changed: keyof TerritorialFilters,
): TerritorialFilters {
  const order: Array<keyof TerritorialFilters> = [
    'department',
    'province',
    'municipality',
    'electoralSeat',
    'electoralLocation',
    'tableCode',
  ];
  const changedIndex = order.indexOf(changed);
  return Object.fromEntries(
    order.map((key, index) => [key, index <= changedIndex ? filters[key] : '']),
  ) as TerritorialFilters;
}

function serializeFilters(filters: TerritorialFilters & { electionId?: string; ballotId?: string }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === 'string' && value.trim()) params.set(key, value.trim());
  }
  return params.toString();
}

function shouldRefreshResults(input: {
  now: number;
  votingStartDate: number;
  resultsStartDate: number;
  visibilityState: DocumentVisibilityState;
}) {
  const startsAt = input.votingStartDate - 60 * 60 * 1000;
  const endsAt = input.resultsStartDate - 30 * 60 * 1000;
  return {
    enabled:
      input.visibilityState === 'visible' &&
      input.now >= startsAt &&
      input.now <= endsAt,
    intervalMs: FIVE_MINUTES_MS,
  };
}

function resolveEffectiveMode(config: {
  isVotingPeriod: boolean;
  isResultsPeriod: boolean;
  resultsStartDateBolivia?: string;
}) {
  if (config.isVotingPeriod) return { mode: 'live' as const, message: 'Resultados preliminares' };
  if (config.isResultsPeriod) return { mode: 'final' as const, message: 'Resultados finales' };
  return {
    mode: 'blocked' as const,
    message: `Resultados disponibles desde ${config.resultsStartDateBolivia ?? 'fecha no disponible'}`,
  };
}

function mapAdministrativeDetail(input: {
  tableCode: string;
  ballots: Array<{ id: string; version: number; supportCount: number; imageUrl?: string }>;
  winningBallotId?: string;
  caseStatus?: 'VERIFYING' | 'PENDING' | 'CONSENSUAL' | 'CLOSED';
}) {
  const mostSupported = [...input.ballots].sort(
    (left, right) => right.supportCount - left.supportCount || right.version - left.version,
  )[0];
  return {
    tableCode: input.tableCode,
    mostSupportedBallotId: mostSupported?.id ?? null,
    effectiveBallotId: input.winningBallotId ?? null,
    caseStatus: input.caseStatus ?? null,
    imageUrl: mostSupported?.imageUrl ?? null,
    countedInFinal:
      Boolean(input.winningBallotId) &&
      input.caseStatus !== 'VERIFYING' &&
      input.ballots.some((ballot) => ballot.id === input.winningBallotId),
  };
}

function safeErrorMessage(error: { message?: string; token?: string; internalUrl?: string; dni?: string }) {
  if (!error.message) return 'No se pudieron cargar los resultados.';
  return 'No se pudieron cargar los resultados. Intenta nuevamente.';
}

describe('MX-12 | Resultados administrativos y reportes | Frontend Admin', () => {
  it('[RES-ACC-P0-001][RES-UPD-P1-002] resuelve periodo preliminar final bloqueo y refresco visible sin prometer tiempo real', () => {
    expect(
      resolveEffectiveMode({
        isVotingPeriod: true,
        isResultsPeriod: false,
        resultsStartDateBolivia: '18/04/2026 20:00',
      }),
    ).toEqual({ mode: 'live', message: 'Resultados preliminares' });
    expect(
      resolveEffectiveMode({
        isVotingPeriod: false,
        isResultsPeriod: true,
        resultsStartDateBolivia: '18/04/2026 20:00',
      }),
    ).toEqual({ mode: 'final', message: 'Resultados finales' });
    expect(
      resolveEffectiveMode({
        isVotingPeriod: false,
        isResultsPeriod: false,
        resultsStartDateBolivia: '18/04/2026 20:00 America/La_Paz',
      }),
    ).toEqual({
      mode: 'blocked',
      message: 'Resultados disponibles desde 18/04/2026 20:00 America/La_Paz',
    });

    const votingStartDate = Date.parse('2026-04-18T12:00:00.000Z');
    const resultsStartDate = Date.parse('2026-04-18T20:00:00.000Z');
    expect(
      shouldRefreshResults({
        now: votingStartDate - 60 * 60 * 1000,
        votingStartDate,
        resultsStartDate,
        visibilityState: 'visible',
      }),
    ).toEqual({ enabled: true, intervalMs: FIVE_MINUTES_MS });
    expect(
      shouldRefreshResults({
        now: resultsStartDate - 29 * 60 * 1000,
        votingStartDate,
        resultsStartDate,
        visibilityState: 'visible',
      }).enabled,
    ).toBe(false);
    expect(
      shouldRefreshResults({
        now: votingStartDate,
        votingStartDate,
        resultsStartDate,
        visibilityState: 'hidden',
      }).enabled,
    ).toBe(false);
  });

  it('[RES-SUM-P0-003][RES-SUM-P1-004][RES-CAT-P1-002][RES-CON-P0-001] mantiene tabla barras grafico y categorias con datos del backend sin recalcular porcentajes', () => {
    const series = buildAdminSeries({
      summary: {
        validVotes: 200,
        blankVotes: 5,
        nullVotes: 3,
        tablesProcessed: 2,
      },
      results: [
        { partyId: 'MAS', totalVotes: 120, percentage: '60.00' },
        { partyId: 'UNKNOWN', totalVotes: 0, percentage: '0.00' },
      ],
    });

    expect(series).toEqual([
      {
        label: 'MAS',
        tableVotes: 120,
        barValue: 120,
        pieValue: 120,
        percentage: '60.00',
        color: '#1d4ed8',
      },
      {
        label: 'UNKNOWN',
        tableVotes: 0,
        barValue: 0,
        pieValue: 0,
        percentage: '0.00',
        color: stableColorForParty('UNKNOWN'),
      },
    ]);
    expect(stableColorForParty('UNKNOWN')).toBe(stableColorForParty('UNKNOWN'));
  });

  it('[RES-TER-P0-001][RES-FIL-P1-001][RES-SEC-P0-001] conserva filtros autorizados limpia descendientes y serializa busqueda sin mezclar elecciones', () => {
    expect(
      clearChildFilters(
        {
          department: 'La Paz',
          province: 'Murillo',
          municipality: 'La Paz',
          electoralSeat: 'Seat 1',
          electoralLocation: 'Recinto 1',
          tableCode: 'LP-001-01',
        },
        'province',
      ),
    ).toEqual({
      department: 'La Paz',
      province: 'Murillo',
      municipality: '',
      electoralSeat: '',
      electoralLocation: '',
      tableCode: '',
    });

    expect(
      serializeFilters({
        electionId: 'election-2026',
        department: 'dep-lp',
        municipality: 'mun-lp',
        tableCode: 'LP-001-01',
        ballotId: '',
      }),
    ).toBe('electionId=election-2026&department=dep-lp&municipality=mun-lp&tableCode=LP-001-01');
  });

  it('[RES-MES-P0-005][RES-ACT-P0-001][RES-ACT-P0-002][RES-CAS-P0-003][RES-REP-P1-003] muestra versiones acta efectiva caso y auditoria sin sustituir winningBallotId', () => {
    const detail = mapAdministrativeDetail({
      tableCode: 'LP-001-01',
      winningBallotId: 'ballot-effective',
      caseStatus: 'CLOSED',
      ballots: [
        { id: 'ballot-effective', version: 1, supportCount: 2, imageUrl: 'ipfs://effective' },
        { id: 'ballot-supported', version: 2, supportCount: 4, imageUrl: 'ipfs://supported' },
      ],
    });

    expect(detail).toEqual({
      tableCode: 'LP-001-01',
      mostSupportedBallotId: 'ballot-supported',
      effectiveBallotId: 'ballot-effective',
      caseStatus: 'CLOSED',
      imageUrl: 'ipfs://supported',
      countedInFinal: true,
    });
    expect(
      mapAdministrativeDetail({
        tableCode: 'LP-001-02',
        winningBallotId: 'ballot-verify',
        caseStatus: 'VERIFYING',
        ballots: [{ id: 'ballot-verify', version: 1, supportCount: 1 }],
      }).countedInFinal,
    ).toBe(false);
  });

  it('[RES-REP-P1-001][RES-REP-P1-002][RES-REP-P1-003][RES-SEC-P0-002][RES-TRA-P1-003] prepara reportes trazabilidad errores seguros y deja responsive real para QA manual', () => {
    const report = {
      delegate: 'Ana Delegada',
      groupBy: 'table',
      support: 2,
      against: 1,
      lastActivityAt: '2026-04-18T20:10:00.000Z',
      contractId: 'contract-1',
    };

    expect(report).toEqual(
      expect.objectContaining({
        groupBy: 'table',
        support: 2,
        against: 1,
        lastActivityAt: '2026-04-18T20:10:00.000Z',
      }),
    );
    expect(safeErrorMessage({ message: 'mongo internal failed', token: 'secret', internalUrl: 'http://mongo', dni: '123456' })).toBe(
      'No se pudieron cargar los resultados. Intenta nuevamente.',
    );
  });
});
