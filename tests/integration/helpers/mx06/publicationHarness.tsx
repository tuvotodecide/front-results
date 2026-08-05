import ElectionConfigReview from "@/features/electionConfig/ElectionConfigReview";
import { renderWithAuthStore } from "../../../utils/renderWithStore";
import { vi } from "vitest";

const publicationState = vi.hoisted(() => ({
  event: null as Record<string, unknown> | null,
  readiness: null as Record<string, unknown> | null,
  workflow: null as Record<string, unknown> | null,
  activeRequest: null as Record<string, unknown> | null,
  latestAttempt: null as Record<string, unknown> | null,
  createResponse: null as Record<string, unknown> | null,
  createError: null as unknown,
  createRequest: vi.fn(),
  refetchActive: vi.fn(),
  refetchEvent: vi.fn(),
  refetchReadiness: vi.fn(),
  refetchPadron: vi.fn(),
}));

export const publicationNavigate = vi.fn();

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => publicationNavigate,
  useParams: () => ({ electionId: "evt-1" }),
}));

vi.mock("@/store/votingEvents", () => ({
  useGetVotingEventQuery: () => ({ data: publicationState.event, isLoading: false, refetch: publicationState.refetchEvent }),
  useGetEventRolesQuery: () => ({ data: [{ id: "role-1", name: "Presidencia" }], isLoading: false, refetch: vi.fn() }),
  useGetEventOptionsQuery: () => ({
    data: [{ id: "option-1", name: "Lista Verde", color: "#459151", candidates: [{ id: "candidate-1", roleName: "Presidencia", name: "Ana" }] }],
    isLoading: false,
    refetch: vi.fn(),
  }),
  useGetPadronVersionsQuery: () => ({ data: [], isLoading: false, refetch: publicationState.refetchPadron }),
  useGetPadronWorkflowSummaryQuery: () => ({ data: publicationState.workflow, isLoading: false, refetch: publicationState.refetchPadron }),
  useGetPadronSummaryQuery: () => ({ data: { enabledToVote: 12, disabledToVote: 0 }, isLoading: false, refetch: publicationState.refetchPadron }),
  useGetEventReviewReadinessQuery: () => ({ data: publicationState.readiness, isLoading: false, refetch: publicationState.refetchReadiness }),
  useGetActiveOfficialPublicationRequestQuery: () => ({
    data: { request: publicationState.activeRequest, latestAttempt: publicationState.latestAttempt },
    isLoading: false,
    refetch: publicationState.refetchActive,
  }),
  useCreateOfficialPublicationRequestMutation: () => [publicationState.createRequest, { isLoading: false }],
  useCancelOfficialPublicationRequestMutation: () => [vi.fn(), { isLoading: false }],
  useMarkEventReadyForReviewMutation: () => [vi.fn(), { isLoading: false }],
  useDeleteVotingEventMutation: () => [vi.fn(), { isLoading: false }],
  useUpdateEventScheduleMutation: () => [vi.fn(), { isLoading: false }],
  useUpdateVotingEventMutation: () => [vi.fn(), { isLoading: false }],
  useCreatePresentialSessionMutation: () => [vi.fn(), { isLoading: false }],
  useCreateEventNewsMutation: () => [vi.fn(), { isLoading: false }],
}));

export type CapacityFixture = {
  availableTokens: string;
  missingTokens: string;
  canPublish: boolean;
  reasonCode: "INSUFFICIENT_TVD_BALANCE" | null;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export function createPublicationRequest(
  status = "PENDING_APPROVAL",
  overrides: Record<string, unknown> = {},
) {
  return {
    requestId: "opr-1",
    eventId: "evt-1",
    status,
    expiresAt: "2099-07-21T12:00:00.000Z",
    votersCount: "12",
    requiredCredits: "12",
    requiredTvd: "12000000000000000000",
    tvdPerCredit: "1000000000000000000",
    signerWallet: "0x1111111111111111111111111111111111111111",
    createdAt: "2099-07-20T12:00:00.000Z",
    updatedAt: "2099-07-20T12:00:00.000Z",
    ...overrides,
  };
}

export function createCapacityFixture(
  overrides: Partial<CapacityFixture> = {},
) {
  const capacity = {
    availableTokens: "20",
    missingTokens: "0",
    canPublish: true,
    reasonCode: null,
    ...overrides,
  };
  return {
    eventId: "evt-1",
    participantCount: 12,
    padronVersionId: "padron-1",
    tokensPerParticipant: "1",
    requiredTokens: "12",
    requiredSmallestUnit: "12000000000000000000",
    availableTokens: capacity.availableTokens,
    availableSmallestUnit: `${capacity.availableTokens}000000000000000000`,
    missingTokens: capacity.missingTokens,
    missingSmallestUnit: `${capacity.missingTokens}000000000000000000`,
    canPublish: capacity.canPublish,
    reasonCode: capacity.reasonCode,
    balanceSource: "BLOCKCHAIN" as const,
    usableBalanceField: "liquidBalanceSmallestUnit",
    walletAddress: "0x1111111111111111111111111111111111111111",
  };
}

export function configurePublicationMocks({
  capacityResponses = [createCapacityFixture()],
  eventState = "READY_FOR_REVIEW",
  padronReady = true,
  activeRequest = null,
  latestAttempt = null,
  createResponse = { created: true, request: createPublicationRequest() },
  createError = null,
}: {
  capacityResponses?: ReturnType<typeof createCapacityFixture>[];
  eventState?: string;
  padronReady?: boolean;
  activeRequest?: Record<string, unknown> | null;
  latestAttempt?: Record<string, unknown> | null;
  createResponse?: Record<string, unknown>;
  createError?: unknown;
} = {}) {
  const capacityQueue = [...capacityResponses];
  const capacityRequests: Array<{ url: string; headers: Headers }> = [];
  publicationState.event = {
    id: "evt-1",
    tenantId: "tenant-1",
    name: "Elección TVD",
    objective: "Elección institucional",
    state: eventState,
    status: eventState,
    votingStart: "2099-07-22T10:00:00.000Z",
    votingEnd: "2099-07-22T12:00:00.000Z",
    resultsPublishAt: "2099-07-22T13:00:00.000Z",
    publishDeadline: "2099-07-21T10:00:00.000Z",
    publicEligibilityEnabled: false,
    presentialKioskEnabled: false,
    allowPostPublicationPadronEnable: true,
  };
  publicationState.readiness = {
    id: "evt-1",
    state: eventState,
    isReady: padronReady,
    pending: padronReady ? [] : ["padron"],
    publishDeadline: "2099-07-21T10:00:00.000Z",
    publicationWindow: {
      deadline: "2099-07-21T10:00:00.000Z",
      expired: false,
      canConfirmOfficialPublication: padronReady,
      hoursUntilDeadline: 24,
    },
  };
  publicationState.workflow = {
    eventId: "evt-1",
    currentVersion: padronReady
      ? { padronVersionId: "padron-1", totals: { validCount: 12, invalidCount: 0 } }
      : null,
    activeDraft: null,
  };
  publicationState.activeRequest = activeRequest;
  publicationState.latestAttempt = latestAttempt;
  publicationState.createResponse = createResponse;
  publicationState.createError = createError;
  publicationState.createRequest.mockReset();
  publicationState.createRequest.mockImplementation(() => ({
    unwrap: async () => {
      if (publicationState.createError) throw publicationState.createError;
      return publicationState.createResponse;
    },
  }));
  publicationState.refetchActive.mockReset();
  publicationState.refetchEvent.mockReset();
  publicationState.refetchReadiness.mockReset();
  publicationState.refetchPadron.mockReset();

  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    capacityRequests.push({ url: `${url.pathname}${url.search}`, headers: request.headers });
    if (url.pathname.endsWith("/voting/events/evt-1/tvd-capacity")) {
      return jsonResponse(capacityQueue.shift() ?? capacityResponses[capacityResponses.length - 1]);
    }
    return jsonResponse({ code: "NOT_FOUND" }, 404);
  }));

  return {
    capacityRequests,
    createRequest: publicationState.createRequest,
    refetchActive: publicationState.refetchActive,
    setRequest(request: Record<string, unknown> | null, latest = false) {
      if (latest) publicationState.latestAttempt = request;
      else publicationState.activeRequest = request;
    },
    setEventState(state: string) {
      publicationState.event = { ...publicationState.event, state, status: state };
    },
  };
}

export function renderPublicationReview() {
  return renderWithAuthStore(<ElectionConfigReview />, {
    token: "jwt-token",
    accessToken: "jwt-token",
    role: "TENANT_ADMIN",
    active: true,
    tenantId: "tenant-1",
    activeContext: { type: "TENANT", tenantId: "tenant-1", tenantName: "Colegio Demo", role: "TENANT_ADMIN" },
    user: { id: "user-1", email: "admin@demo.bo", name: "Admin Demo", role: "TENANT_ADMIN", active: true, tenantId: "tenant-1", tenantName: "Colegio Demo" },
  });
}

export function resetPublicationMocks() {
  publicationNavigate.mockReset();
  publicationState.createRequest.mockReset();
  publicationState.refetchActive.mockReset();
  publicationState.refetchEvent.mockReset();
  publicationState.refetchReadiness.mockReset();
  publicationState.refetchPadron.mockReset();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
}
