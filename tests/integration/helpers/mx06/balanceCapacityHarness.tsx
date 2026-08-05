import "./rechargeHarness";
import ElectionConfigReview from "@/features/electionConfig/ElectionConfigReview";
import { renderWithAuthStore } from "../../../utils/renderWithStore";
import { vi } from "vitest";

const electionDependencies = vi.hoisted(() => ({
  useElectionPublish: vi.fn(),
  mutation: vi.fn(() => ({ unwrap: () => Promise.resolve({}) })),
}));

vi.mock("@/features/electionConfig/data/useElectionPublish", () => ({
  useElectionPublish: (...args: unknown[]) => electionDependencies.useElectionPublish(...args),
}));

vi.mock("@/store/votingEvents", () => ({
  useDeleteVotingEventMutation: () => [electionDependencies.mutation, { isLoading: false }],
  useUpdateEventScheduleMutation: () => [electionDependencies.mutation, { isLoading: false }],
  useUpdateVotingEventMutation: () => [electionDependencies.mutation, { isLoading: false }],
  useCreatePresentialSessionMutation: () => [electionDependencies.mutation, { isLoading: false }],
  useCreateEventNewsMutation: () => [electionDependencies.mutation, { isLoading: false }],
}));

export type CapacityFixture = {
  eventId: string;
  participantCount: number;
  padronVersionId: string;
  tokensPerParticipant: string;
  requiredTokens: string;
  requiredSmallestUnit: string;
  availableTokens: string;
  availableSmallestUnit: string;
  missingTokens: string;
  missingSmallestUnit: string;
  canPublish: boolean;
  reasonCode: "INSUFFICIENT_TVD_BALANCE" | null;
  balanceSource: "BLOCKCHAIN";
  usableBalanceField: "liquidBalanceSmallestUnit";
  walletAddress: string;
};

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export function createCapacityFixture(
  overrides: Partial<CapacityFixture> = {},
): CapacityFixture {
  return {
    eventId: "evt-1",
    participantCount: 12,
    padronVersionId: "padron-1",
    tokensPerParticipant: "1",
    requiredTokens: "12",
    requiredSmallestUnit: "12000000000000000000",
    availableTokens: "5",
    availableSmallestUnit: "5000000000000000000",
    missingTokens: "7",
    missingSmallestUnit: "7000000000000000000",
    canPublish: false,
    reasonCode: "INSUFFICIENT_TVD_BALANCE",
    balanceSource: "BLOCKCHAIN",
    usableBalanceField: "liquidBalanceSmallestUnit",
    walletAddress: "0x1111111111111111111111111111111111111111",
    ...overrides,
  };
}

export function configureCapacityMocks(responses: CapacityFixture[]) {
  const capacityResponses = [...responses];
  const requests: Array<{ url: string; headers: Headers }> = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    requests.push({ url: `${url.pathname}${url.search}`, headers: request.headers });
    if (url.pathname.endsWith("/voting/events/evt-1/tvd-capacity")) {
      return jsonResponse(
        capacityResponses.shift() ?? responses[responses.length - 1],
      );
    }
    return jsonResponse({ code: "NOT_FOUND" }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { requests, fetchMock };
}

export function renderCapacityReview() {
  electionDependencies.useElectionPublish.mockReturnValue({
    votingEvent: {
      id: "evt-1",
      tenantId: "tenant-1",
      name: "Elección TVD",
      objective: "Elección institucional",
      state: "READY_FOR_REVIEW",
      status: "READY_FOR_REVIEW",
      votingStart: "2099-07-22T10:00:00.000Z",
      votingEnd: "2099-07-22T12:00:00.000Z",
      resultsPublishAt: "2099-07-22T13:00:00.000Z",
      publishDeadline: "2099-07-21T10:00:00.000Z",
      publicEligibilityEnabled: false,
      presentialKioskEnabled: false,
      allowPostPublicationPadronEnable: true,
    },
    ballotPreview: {
      electionId: "evt-1",
      electionTitle: "Elección TVD",
      electionObjective: "Elección institucional",
      isReferendum: false,
      parties: [],
    },
    configSummary: {
      positionsOk: true,
      partiesOk: true,
      padronOk: true,
      positionsCount: 1,
      partiesCount: 1,
      votersCount: 12,
      enabledToVoteCount: 12,
      disabledToVoteCount: 0,
    },
    publicationMissingIdentityCount: 0,
    publicationPadronCount: 12,
    reviewReadiness: {
      id: "evt-1",
      state: "READY_FOR_REVIEW",
      isReady: true,
      pending: [],
      publishDeadline: "2099-07-21T10:00:00.000Z",
      publicationWindow: {
        deadline: "2099-07-21T10:00:00.000Z",
        expired: false,
        canConfirmOfficialPublication: true,
        hoursUntilDeadline: 24,
      },
    },
    loading: false,
    openReview: vi.fn(),
    openingReview: false,
    activateElection: vi.fn(),
    activating: false,
    activationResult: null,
    getShareUrl: vi.fn(),
    copyToClipboard: vi.fn(),
    refetch: vi.fn(),
  });

  return renderWithAuthStore(<ElectionConfigReview />, {
    token: "jwt-token",
    accessToken: "jwt-token",
    role: "TENANT_ADMIN",
    active: true,
    tenantId: "tenant-1",
    activeContext: {
      type: "TENANT",
      tenantId: "tenant-1",
      tenantName: "Colegio Demo",
      role: "TENANT_ADMIN",
    },
    user: {
      id: "user-1",
      email: "admin@demo.bo",
      name: "Admin Demo",
      role: "TENANT_ADMIN",
      active: true,
      tenantId: "tenant-1",
      tenantName: "Colegio Demo",
    },
  });
}

export function resetCapacityMocks() {
  electionDependencies.useElectionPublish.mockReset();
  electionDependencies.mutation.mockClear();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
}
