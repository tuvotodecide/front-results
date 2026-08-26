import VotacionPrivateGuard from "@/domains/votacion/guards/VotacionPrivateGuard";
import ElectionConfigReview from "@/features/electionConfig/ElectionConfigReview";
import OperationalRechargePage from "@/features/adminTvd/screens/OperationalRechargePage";
import { renderWithAuthStore } from "../../../utils/renderWithStore";
import { vi } from "vitest";

const state = vi.hoisted(() => ({
  event: null as Record<string, unknown> | null,
  readiness: null as Record<string, unknown> | null,
  workflow: null as Record<string, unknown> | null,
  activePublication: null as Record<string, unknown> | null,
  latestPublication: null as Record<string, unknown> | null,
  createPublication: vi.fn(),
  refetchPublication: vi.fn(),
  refetchEvent: vi.fn(),
  refetchReadiness: vi.fn(),
  refetchPadron: vi.fn(),
}));

let searchParams = new URLSearchParams();
export const securityRouterReplace = vi.fn();
export const securityNavigate = vi.fn();
export const securityVisualBalanceRefetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: securityRouterReplace }),
  usePathname: () => "/votacion/recarga-operativa",
}));

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useNavigate: () => securityNavigate,
  useParams: () => ({ electionId: "evt-1" }),
  useSearchParams: () => [searchParams, vi.fn()] as const,
}));

vi.mock("@/features/adminTvd/hooks/useTvdVisualBalance", () => ({
  useTvdVisualBalance: () => ({
    data: {
      wallet: "0x1111111111111111111111111111111111111111",
      chainId: 80002,
      tokenAddress: "0x3333333333333333333333333333333333333333",
      assignmentContractAddress: "0x2222222222222222222222222222222222222222",
      decimals: 18,
      liquidBalanceSmallestUnit: "5000000000000000000",
      assignedBalanceSmallestUnit: "0",
      totalBalanceSmallestUnit: "5000000000000000000",
      liquidBalanceFormatted: "5",
      assignedBalanceFormatted: "0",
      totalBalanceFormatted: "5",
      readAt: "2026-07-21T12:00:00.000Z",
    },
    error: null,
    isLoading: false,
    refetch: securityVisualBalanceRefetch,
  }),
}));

vi.mock("@/store/votingEvents", () => ({
  useGetVotingEventQuery: () => ({ data: state.event, isLoading: false, refetch: state.refetchEvent }),
  useGetEventRolesQuery: () => ({ data: [{ id: "role-1", name: "Presidencia" }], isLoading: false, refetch: vi.fn() }),
  useGetEventOptionsQuery: () => ({ data: [{ id: "option-1", name: "Lista Verde", color: "#459151", candidates: [{ id: "candidate-1", roleName: "Presidencia", name: "Ana" }] }], isLoading: false, refetch: vi.fn() }),
  useGetPadronVersionsQuery: () => ({ data: [], isLoading: false, refetch: state.refetchPadron }),
  useGetPadronWorkflowSummaryQuery: () => ({ data: state.workflow, isLoading: false, refetch: state.refetchPadron }),
  useGetPadronSummaryQuery: () => ({ data: { enabledToVote: 12, disabledToVote: 0 }, isLoading: false, refetch: state.refetchPadron }),
  useGetEventReviewReadinessQuery: () => ({ data: state.readiness, isLoading: false, refetch: state.refetchReadiness }),
  useGetActiveOfficialPublicationRequestQuery: () => ({ data: { request: state.activePublication, latestAttempt: state.latestPublication }, isLoading: false, refetch: state.refetchPublication }),
  useCreateOfficialPublicationRequestMutation: () => [state.createPublication, { isLoading: false }],
  useCancelOfficialPublicationRequestMutation: () => [vi.fn(), { isLoading: false }],
  useMarkEventReadyForReviewMutation: () => [vi.fn(), { isLoading: false }],
  useDeleteVotingEventMutation: () => [vi.fn(), { isLoading: false }],
  useUpdateEventScheduleMutation: () => [vi.fn(), { isLoading: false }],
  useUpdateVotingEventMutation: () => [vi.fn(), { isLoading: false }],
  useCreatePresentialSessionMutation: () => [vi.fn(), { isLoading: false }],
  useCreateEventNewsMutation: () => [vi.fn(), { isLoading: false }],
}));

export type SecurityFetchCall = { url: string; method: string; headers: Headers; body: string | null };

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export function createSecurityFixtures() {
  const quote = {
    fiatAmount: "10.50", fiatAmountMinor: "1050", fiatCurrency: "BOB" as const,
    estimatedTvd: "4.2", estimatedTvdSmallestUnit: "4200000000000000000",
    bobPerToken: "2.5", exchangeRateVersion: 7, quotedAt: "2026-07-21T12:00:00.000Z",
  };
  const qrPayment = {
    id: "payment-1", tenantId: "tenant-1", requestedByUserId: "user-1", amount: "10.50",
    amountMinor: "1050", currency: "BOB" as const, status: "QR_ACTIVE" as const,
    provider: "RED_ENLACE" as const, merchantReference: "123456", providerReference: "654321",
    qrImage: "iVBORw0KGgo=", qrExpiresAt: "2099-07-21T12:30:00.000Z", confirmationSource: null,
    tvdQuote: { fiatAmountMinor: "1050", fiatCurrency: "BOB" as const, bobPerToken: "2.5", exchangeRateVersion: 7, tokenAmount: "4.2", tokenAmountSmallestUnit: "4200000000000000000", quotedAt: "2026-07-21T12:00:00.000Z" },
    tokenAccreditation: null, previousPaymentId: null, regeneratedToPaymentId: null,
    regenerationStatus: "NOT_REGENERABLE" as const, regenerationReason: "PAYMENT_STATUS_QR_ACTIVE",
    createdAt: "2026-07-21T12:00:00.000Z", updatedAt: "2026-07-21T12:00:00.000Z", confirmedAt: null,
  };
  const confirmedPayment = {
    paymentId: "payment-1", amount: "10.50", amountMinor: "1050", currency: "BOB" as const,
    status: "PAYMENT_CONFIRMED" as const, provider: "RED_ENLACE" as const,
    merchantReference: "123456", providerReference: "654321", qrImage: qrPayment.qrImage,
    qrExpiresAt: qrPayment.qrExpiresAt, confirmationSource: "WEBHOOK", createdAt: "2026-07-21T12:00:00.000Z",
    updatedAt: "2026-07-21T12:01:00.000Z", confirmedAt: "2026-07-21T12:01:00.000Z",
    tvdQuote: qrPayment.tvdQuote, accreditationId: "accreditation-1", accreditationStatus: "PENDING",
    txHash: null, regenerationStatus: "NOT_REGENERABLE", regenerationReason: "PAYMENT_ALREADY_CONFIRMED",
  };
  return {
    quote,
    qrPayment,
    confirmedPayment,
    // Techo de recarga: saldo TVD del vesting institucional, holgado para no
    // limitar los escenarios de seguridad y estados de UI.
    institutionalVestingBalance: {
      raw: "1000000000000000000000", decimals: 18, formatted: "1000 TVD", readAt: "2026-07-21T12:00:00.000Z",
    },
    summary: {
      tenantId: "tenant-1", assignmentId: "assignment-1", wallet: "0x1111111111111111111111111111111111111111",
      walletStatus: "VERIFIED", assignedBalance: { smallestUnit: "0", formatted: "0", decimals: 18 },
      liquidBalance: { smallestUnit: "5000000000000000000", formatted: "5" }, totalBalance: { smallestUnit: "5000000000000000000", formatted: "5" },
      tokenSymbol: "TVD", chainId: 80002, contractAddress: "0x2222222222222222222222222222222222222222",
      lastAccreditation: null, pendingAccreditationsCount: 1,
    },
  };
}

export function createSecurityCapacity(overrides: Record<string, unknown> = {}) {
  return {
    eventId: "evt-1", participantCount: 12, padronVersionId: "padron-1", tokensPerParticipant: "1",
    requiredTokens: "12", requiredSmallestUnit: "12000000000000000000", availableTokens: "5",
    availableSmallestUnit: "5000000000000000000", missingTokens: "7", missingSmallestUnit: "7000000000000000000",
    canPublish: false, reasonCode: "INSUFFICIENT_TVD_BALANCE", balanceSource: "BLOCKCHAIN",
    usableBalanceField: "liquidBalanceSmallestUnit", walletAddress: "0x1111111111111111111111111111111111111111",
    ...overrides,
  };
}

export function createSecurityPublication(status = "PENDING_APPROVAL", overrides: Record<string, unknown> = {}) {
  return {
    requestId: "opr-1", eventId: "evt-1", status, expiresAt: "2099-07-21T12:00:00.000Z",
    votersCount: "12", requiredCredits: "12", requiredTvd: "12000000000000000000",
    tvdPerCredit: "1000000000000000000", signerWallet: "0x1111111111111111111111111111111111111111",
    createdAt: "2099-07-20T12:00:00.000Z", updatedAt: "2099-07-20T12:00:00.000Z", ...overrides,
  };
}

export function configureSecurityUiMocks({
  capacityResponses = [createSecurityCapacity()],
  paymentDetails = {} as Record<string, unknown[]>,
  createQr = () => jsonResponse(createSecurityFixtures().qrPayment),
}: {
  capacityResponses?: Record<string, unknown>[];
  paymentDetails?: Record<string, unknown[]>;
  createQr?: (call: SecurityFetchCall) => Response | Promise<Response>;
} = {}) {
  const fixtures = createSecurityFixtures();
  const capacityQueue = [...capacityResponses];
  const paymentQueues = new Map(Object.entries(paymentDetails).map(([id, values]) => [id, [...values]]));
  const fetchCalls: SecurityFetchCall[] = [];
  state.event = { id: "evt-1", tenantId: "tenant-1", name: "Elección TVD", objective: "Elección institucional", state: "READY_FOR_REVIEW", status: "READY_FOR_REVIEW", votingStart: "2099-07-22T10:00:00.000Z", votingEnd: "2099-07-22T12:00:00.000Z", resultsPublishAt: "2099-07-22T13:00:00.000Z", publishDeadline: "2099-07-21T10:00:00.000Z", publicEligibilityEnabled: false, presentialKioskEnabled: false, allowPostPublicationPadronEnable: true };
  state.readiness = { id: "evt-1", state: "READY_FOR_REVIEW", isReady: true, pending: [], publishDeadline: "2099-07-21T10:00:00.000Z", publicationWindow: { deadline: "2099-07-21T10:00:00.000Z", expired: false, canConfirmOfficialPublication: true, hoursUntilDeadline: 24 } };
  state.workflow = { eventId: "evt-1", currentVersion: { padronVersionId: "padron-1", totals: { validCount: 12, invalidCount: 0 } }, activeDraft: null };
  state.activePublication = null;
  state.latestPublication = null;
  state.createPublication.mockReset();
  state.createPublication.mockImplementation(() => ({ unwrap: async () => ({ created: true, request: createSecurityPublication() }) }));
  state.refetchPublication.mockReset();
  state.refetchEvent.mockReset();
  state.refetchReadiness.mockReset();
  state.refetchPadron.mockReset();
  vi.stubGlobal("crypto", { randomUUID: () => "mx06-security-ui-key", getRandomValues: (bytes: Uint8Array) => bytes });
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    // Las rutas internas de Next se piden con URL relativa; el Request nativo de Node exige una absoluta.
    const request = input instanceof Request ? input : new Request(new URL(String(input), "http://localhost"), init);
    const url = new URL(request.url);
    const call = { url: `${url.pathname}${url.search}`, method: request.method, headers: request.headers, body: request.method === "GET" ? null : await request.clone().text() };
    fetchCalls.push(call);
    if (url.pathname === "/api/tvd/institutional-vesting-balance") return jsonResponse({ success: true, data: fixtures.institutionalVestingBalance });
    if (url.pathname.endsWith("/tvd/me/summary")) return jsonResponse(fixtures.summary);
    if (url.pathname.endsWith("/tvd/me/quote")) return jsonResponse(fixtures.quote);
    if (url.pathname.endsWith("/payments/qr")) return createQr(call);
    const paymentId = url.pathname.match(/\/tvd\/me\/payments\/(payment-[^/]+)$/)?.[1];
    if (paymentId) return jsonResponse(paymentQueues.get(paymentId)?.shift() ?? fixtures.confirmedPayment);
    if (url.pathname.endsWith("/tvd/me/payments")) return jsonResponse({ items: [], page: 1, limit: 5, total: 0, hasNextPage: false });
    if (url.pathname.endsWith("/voting/events/evt-1/tvd-capacity")) return jsonResponse(capacityQueue.shift() ?? capacityResponses[capacityResponses.length - 1]);
    return jsonResponse({ code: "NOT_FOUND" }, 404);
  }));
  return {
    fixtures,
    fetchCalls,
    setPublication(request: Record<string, unknown> | null, latest = false) {
      if (latest) state.latestPublication = request;
      else state.activePublication = request;
    },
    setEventState(eventState: string) {
      state.event = { ...state.event, state: eventState, status: eventState };
    },
  };
}

const tenantAuth = {
  token: "jwt-token", accessToken: "jwt-token", role: "TENANT_ADMIN", active: true, tenantId: "tenant-1",
  availableContexts: [{ type: "TENANT" as const, tenantId: "tenant-1", tenantName: "Colegio Demo", role: "TENANT_ADMIN" }],
  activeContext: { type: "TENANT" as const, tenantId: "tenant-1", tenantName: "Colegio Demo", role: "TENANT_ADMIN" },
  user: { id: "user-1", email: "admin@demo.bo", name: "Admin Demo", role: "TENANT_ADMIN" as const, active: true, tenantId: "tenant-1", tenantName: "Colegio Demo", status: "ACTIVE" as const },
};

export const renderSecurityRecharge = () => renderWithAuthStore(<OperationalRechargePage />, tenantAuth);
export const renderSecurityReview = () => renderWithAuthStore(<ElectionConfigReview />, tenantAuth);
export const renderUnauthorizedSecurityRecharge = () => renderWithAuthStore(
  <VotacionPrivateGuard><OperationalRechargePage /></VotacionPrivateGuard>,
  {
    token: "untrusted-token", accessToken: "untrusted-token", role: "publico", active: true, tenantId: "tenant-other",
    availableContexts: [{ type: "TERRITORIAL", role: "MAYOR", votingDepartmentId: "lp" }],
    activeContext: { type: "TERRITORIAL", role: "MAYOR", votingDepartmentId: "lp" },
    accessStatus: {
      tenant: {
        hasApprovedAccess: false, latestStatus: "REVOKED", canRequest: false, shouldSelectTenantContext: false,
        message: "Acceso institucional revocado.", items: [{ tenantId: "tenant-other", status: "REVOKED" }],
      },
      territorial: { hasApprovedAccess: true, status: "APPROVED", canRequest: false, message: "Acceso territorial activo." },
    },
    user: { id: "user-other", email: "outside@demo.bo", name: "Usuario externo", role: "publico", active: true, tenantId: "tenant-other", status: "ACTIVE" },
  },
);

export function resetSecurityUiMocks() {
  searchParams = new URLSearchParams();
  securityRouterReplace.mockReset();
  securityNavigate.mockReset();
  securityVisualBalanceRefetch.mockReset();
  state.createPublication.mockReset();
  state.refetchPublication.mockReset();
  state.refetchEvent.mockReset();
  state.refetchReadiness.mockReset();
  state.refetchPadron.mockReset();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
}
