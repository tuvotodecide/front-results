import { render } from "@testing-library/react";
import { vi } from "vitest";

const statusMocksState = vi.hoisted(() => {
  const makeEvent = () => ({
    id: "evt-status",
    tenantId: "tenant-1",
    name: "Elección de Diputados",
    chainRequestId: "chain-1",
    objective: "Renovación legislativa",
    votingStart: "2026-06-29T08:00:00.000Z",
    votingEnd: "2026-06-29T17:00:00.000Z",
    resultsPublishAt: "2026-06-30T12:45:00.000Z",
    publishDeadline: "2026-06-28T08:00:00.000Z",
    state: "RESULTS_PUBLISHED",
    status: "RESULTS_PUBLISHED",
    publicEligibilityEnabled: true,
    publicEligibility: true,
    publicUrl: "/votacion/elecciones/evt-status/publica",
    presentialKioskEnabled: true,
    allowPostPublicationPadronEnable: true,
  });

  const makeResults = () => ({
    eventId: "evt-status",
    status: "FINAL",
    publishedAt: "2026-06-30T12:45:00.000Z",
    source: "backend",
    roles: [
      {
        roleName: "Diputación",
        total: 100,
        winners: ["Partido Verde"],
        ranking: [
          {
            optionId: "opt-1",
            optionName: "Partido Verde",
            votes: 73,
            percentage: 73,
          },
          {
            optionId: "opt-2",
            optionName: "Partido Azul",
            votes: 27,
            percentage: 27,
          },
        ],
      },
    ],
  });

  const makeEmptyResults = () => ({
    eventId: "evt-status",
    status: "FINAL",
    publishedAt: "2026-06-30T12:45:00.000Z",
    source: "backend",
    roles: [],
  });

  const makePublicElection = () => ({
    id: "evt-status",
    title: "Elección de Diputados",
    subtitle: "Renovación legislativa",
    isReferendum: false,
    status: "FINISHED",
    schedule: {
      from: "29 de junio de 2026, 08:00 hrs",
      to: "29 de junio de 2026, 17:00 hrs",
    },
    results: {
      totalVotes: 101,
      candidates: [
        {
          id: "opt-1",
          name: "Partido Verde",
          party: "Partido Verde",
          colorHex: "#2E7D32",
          votes: 73,
          percent: 72.28,
        },
        {
          id: "opt-2",
          name: "Partido Azul",
          party: "Partido Azul",
          colorHex: "#1e40af",
          votes: 27,
          percent: 26.73,
        },
        {
          id: "blank",
          name: "Votos en Blanco",
          party: "Votos en Blanco",
          colorHex: "#6b7280",
          votes: 1,
          percent: 0.99,
        },
      ],
    },
    winnerCandidateId: "opt-1",
    publicEligibilityEnabled: true,
    ballotParties: [],
  });

  const makeRoles = () => [
    {
      id: "role-1",
      eventId: "evt-status",
      name: "Diputación",
      maxWinners: 1,
      createdAt: "2026-06-01T00:00:00.000Z",
    },
  ];

  const makeOptions = () => [
    {
      id: "opt-1",
      eventId: "evt-status",
      name: "Partido Verde",
      color: "#2E7D32",
      active: true,
      createdAt: "2026-06-01T00:00:00.000Z",
      candidates: [
        {
          id: "cand-1",
          optionId: "opt-1",
          name: "Ana Gómez",
          roleName: "Diputación",
        },
      ],
    },
  ];

  const makeWorkflowSummary = () => ({
    eventId: "evt-status",
    currentVersion: {
      padronVersionId: "padron-1",
      createdAt: "2026-06-28T09:00:00.000Z",
      createdBy: "admin",
      sourceType: "PDF_IMPORT",
      totals: {
        validCount: 2,
        invalidCount: 1,
        duplicateCount: 0,
      },
    },
    activeDraft: null,
  });

  const makePadronData = () => ({
    voters: [
      {
        id: "voter-1",
        carnet: "1234567",
        carnetNorm: "1234567",
        fullName: "María Pérez",
        enabled: true,
        status: "valid",
      },
      {
        id: "voter-2",
        carnet: "7654321",
        carnetNorm: "7654321",
        fullName: "Juan Rojas",
        enabled: true,
        status: "valid",
      },
      {
        id: "voter-3",
        carnet: "9999999",
        carnetNorm: "9999999",
        fullName: "Carla Lima",
        enabled: false,
        status: "valid",
      },
    ],
    total: 3,
    totalPages: 1,
  });

  const makeAnalytics = () => ({
    votingId: "evt-status",
    votingName: "Elección de Diputados",
    status: "RESULTS_PUBLISHED",
    publishedAt: "2026-06-30T12:45:00.000Z",
    totalEnabled: 3,
    totalParticipated: 2,
    totalPending: 1,
    participationPercentage: 66.7,
  });

  return {
    electionId: "evt-status",
    navigate: vi.fn(),
    open: vi.fn(),
    clipboardWriteText: vi.fn().mockResolvedValue(undefined),
    refetch: vi.fn(),
    downloadPadronPdf: vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({
        blob: new Blob(["pdf"], { type: "application/pdf" }),
        fileName: "padron.pdf",
      }),
    })),
    createPresentialSession: vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({
        stationId: "mesa-1",
        kioskAccessToken: "qr-token",
      }),
    })),
    createEventNews: vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({ imageUrl: null }),
    })),
    enableCurrentPadronVoter: vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({}),
    })),
    updateEventSchedule: vi.fn(() => ({
      unwrap: vi.fn().mockResolvedValue({}),
    })),
    getPublicElectionDetail: vi.fn((eventId: string) =>
      Promise.resolve({
        ...makePublicElection(),
        id: eventId,
      }),
    ),
    makeEvent,
    makeResults,
    makeEmptyResults,
    makePublicElection,
    makeRoles,
    makeOptions,
    makeWorkflowSummary,
    makePadronData,
    makeAnalytics,
    event: makeEvent(),
    results: makeResults() as any,
    publicElection: makePublicElection() as any,
    roles: makeRoles() as any[],
    options: makeOptions() as any[],
    workflowSummary: makeWorkflowSummary() as any,
    padronData: makePadronData() as any,
    analytics: makeAnalytics() as any,
  };
});

export const statusMocks = statusMocksState;

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => statusMocks.navigate,
  useParams: () => ({ electionId: statusMocks.electionId }),
}));

vi.mock("@/features/electionConfig/renderUtils", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/electionConfig/renderUtils")>(
      "@/features/electionConfig/renderUtils",
    );

  return {
    ...actual,
    useClientNow: () => new Date("2026-07-01T12:00:00.000Z").getTime(),
  };
});

vi.mock("@/shared/system/runtimeEnv", () => ({
  getRuntimeEnv: () => "https://basescan.org/address/0xcontract",
}));

vi.mock("react-redux", () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

vi.mock("@/store/auth/authSlice", () => ({
  selectTenantId: () => "tenant-1",
  selectActiveContext: () => ({
    type: "TENANT",
    tenantId: "tenant-1",
    role: "TENANT_ADMIN",
  }),
  selectUserRole: () => "TENANT_ADMIN",
}));

vi.mock("@/features/padronCheck", () => ({
  PadronCheckModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div role="dialog">Verificación de participación</div> : null,
}));

vi.mock("@/features/electionConfig/components/ParticipationAnalyticsModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div role="dialog">Reporte de participación</div> : null,
}));

vi.mock("@/features/publicElectionDetail/data/PublicElectionRepository.api", () => ({
  publicElectionRepository: {
    getPublicElectionDetail: (...args: [string]) =>
      statusMocks.getPublicElectionDetail(...args),
  },
}));

vi.mock("@/features/electionConfig/components/PositionsTable", () => ({
  default: ({ positions }: { positions: Array<{ name: string }> }) => (
    <div data-testid="positions-table">
      {positions.map((position) => (
        <span key={position.name}>{position.name}</span>
      ))}
    </div>
  ),
}));

vi.mock("@/features/electionConfig/components/PartiesTable", () => ({
  default: ({
    parties,
  }: {
    parties: Array<{
      name: string;
      candidates?: Array<{ fullName: string; positionName: string }>;
    }>;
  }) => (
    <div data-testid="parties-table">
      {parties.map((party) => (
        <div key={party.name}>
          <span>{party.name}</span>
          {(party.candidates ?? []).map((candidate) => (
            <span key={candidate.fullName}>{candidate.fullName}</span>
          ))}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/store/votingEvents", () => ({
  useGetVotingEventQuery: () => ({
    data: statusMocks.event,
    isLoading: false,
  }),
  useGetVotingEventsQuery: () => ({
    data: [statusMocks.event],
  }),
  useGetEventRolesQuery: () => ({
    data: statusMocks.roles,
    isLoading: false,
  }),
  useGetEventOptionsQuery: () => ({
    data: statusMocks.options,
    isLoading: false,
  }),
  useGetPadronWorkflowSummaryQuery: () => ({
    data: statusMocks.workflowSummary,
    isLoading: false,
    refetch: statusMocks.refetch,
  }),
  useGetPadronVotersQuery: () => ({
    data: statusMocks.padronData,
    isLoading: false,
    refetch: statusMocks.refetch,
  }),
  useGetPadronStagingQuery: () => ({
    data: { data: [], total: 0, totalPages: 1 },
    isLoading: false,
  }),
  useGetEventResultsQuery: () => ({
    data: statusMocks.results,
  }),
  useGetParticipationAnalyticsQuery: (_eventId: string, options?: { skip?: boolean }) => ({
    data: options?.skip ? undefined : statusMocks.analytics,
    isFetching: false,
    isError: false,
  }),
  useUpdateEventScheduleMutation: () => [
    statusMocks.updateEventSchedule,
    { isLoading: false },
  ],
  useCreatePresentialSessionMutation: () => [
    statusMocks.createPresentialSession,
    { isLoading: false },
  ],
  useLazyDownloadPadronPdfQuery: () => [statusMocks.downloadPadronPdf],
  useCreateEventNewsMutation: () => [
    statusMocks.createEventNews,
    { isLoading: false },
  ],
  useEnableCurrentPadronVoterMutation: () => [
    statusMocks.enableCurrentPadronVoter,
    { isLoading: false },
  ],
}));

import ActiveElectionStatusPage from "@/features/electionConfig/ActiveElectionStatusPage";

export const resetStatusMocks = () => {
  vi.clearAllMocks();
  statusMocks.electionId = "evt-status";
  statusMocks.event = statusMocks.makeEvent();
  statusMocks.results = statusMocks.makeResults();
  statusMocks.publicElection = statusMocks.makePublicElection();
  statusMocks.roles = statusMocks.makeRoles();
  statusMocks.options = statusMocks.makeOptions();
  statusMocks.workflowSummary = statusMocks.makeWorkflowSummary();
  statusMocks.padronData = statusMocks.makePadronData();
  statusMocks.analytics = statusMocks.makeAnalytics();
  statusMocks.clipboardWriteText = vi.fn().mockResolvedValue(undefined);
  statusMocks.open = vi.fn();
  statusMocks.getPublicElectionDetail = vi.fn((eventId: string) =>
    Promise.resolve(
      statusMocks.publicElection
        ? {
            ...statusMocks.publicElection,
            id: eventId,
          }
        : null,
    ),
  );

  const clipboard = { writeText: statusMocks.clipboardWriteText };
  Object.defineProperty(window.navigator, "clipboard", {
    value: clipboard,
    configurable: true,
  });
  Object.defineProperty(window.Navigator.prototype, "clipboard", {
    get: () => clipboard,
    configurable: true,
  });
  Object.defineProperty(window, "open", {
    value: statusMocks.open,
    configurable: true,
  });
  Object.defineProperty(window.URL, "createObjectURL", {
    value: vi.fn(() => "blob:padron"),
    configurable: true,
  });
  Object.defineProperty(window.URL, "revokeObjectURL", {
    value: vi.fn(),
    configurable: true,
  });
  Object.defineProperty(HTMLAnchorElement.prototype, "click", {
    value: vi.fn(),
    configurable: true,
  });
};

export const renderStatusPage = () => render(<ActiveElectionStatusPage />);
