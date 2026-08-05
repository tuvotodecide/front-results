import OperationalRechargePage from "@/features/adminTvd/screens/OperationalRechargePage";
import { renderWithAuthStore } from "../../../utils/renderWithStore";
import { vi } from "vitest";

let searchParams = new URLSearchParams();
export const navigationSetSearchParams = vi.fn();
export const navigationNavigate = vi.fn();
export const visualBalanceRefetch = vi.fn();

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
  useSearchParams: () => [searchParams, navigationSetSearchParams] as const,
  useNavigate: () => navigationNavigate,
  useParams: () => ({ electionId: "evt-1" }),
}));

vi.mock("@/features/adminTvd/hooks/useTvdVisualBalance", () => ({
  useTvdVisualBalance: () => ({
    data: {
      wallet: "0x1111111111111111111111111111111111111111",
      chainId: 80002,
      tokenAddress: "0x3333333333333333333333333333333333333333",
      assignmentContractAddress: "0x2222222222222222222222222222222222222222",
      decimals: 18,
      liquidBalanceSmallestUnit: "50000000000000000000",
      assignedBalanceSmallestUnit: "30000000000000000000",
      totalBalanceSmallestUnit: "80000000000000000000",
      liquidBalanceFormatted: "50",
      assignedBalanceFormatted: "30",
      totalBalanceFormatted: "80",
      readAt: "2026-07-21T12:00:00.000Z",
    },
    error: null,
    isLoading: false,
    refetch: visualBalanceRefetch,
  }),
}));

export type RechargeFetchCall = {
  url: string;
  method: string;
  headers: Headers;
  body: string | null;
};

export type RechargeFixtures = ReturnType<typeof createRechargeFixtures>;

export type RechargeMockOptions = {
  fixtures?: RechargeFixtures;
  paymentDetails?: Record<string, unknown[]>;
  historyItems?: unknown[];
  createQr?: (call: RechargeFetchCall) => Response | Promise<Response>;
  regenerateQr?: (call: RechargeFetchCall) => Response | Promise<Response>;
  quote?: (call: RechargeFetchCall) => Response | Promise<Response>;
};

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export function createRechargeFixtures() {
  const quote = {
    fiatAmount: "10.50",
    fiatAmountMinor: "1050",
    fiatCurrency: "BOB" as const,
    estimatedTvd: "4.2",
    estimatedTvdSmallestUnit: "4200000000000000000",
    bobPerToken: "2.5",
    exchangeRateVersion: 7,
    quotedAt: "2026-07-21T12:00:00.000Z",
  };
  const qrPayment = {
    id: "payment-1",
    tenantId: "tenant-1",
    requestedByUserId: "user-1",
    amount: "10.50",
    amountMinor: "1050",
    currency: "BOB" as const,
    status: "QR_ACTIVE" as const,
    provider: "RED_ENLACE" as const,
    merchantReference: "123456",
    providerReference: "654321",
    qrImage: "iVBORw0KGgo=",
    qrExpiresAt: "2099-07-21T12:30:00.000Z",
    confirmationSource: null,
    tvdQuote: {
      fiatAmountMinor: "1050",
      fiatCurrency: "BOB" as const,
      bobPerToken: "2.5",
      exchangeRateVersion: 7,
      tokenAmount: "4.2",
      tokenAmountSmallestUnit: "4200000000000000000",
      quotedAt: "2026-07-21T12:00:00.000Z",
    },
    tokenAccreditation: null,
    previousPaymentId: null,
    regeneratedToPaymentId: null,
    regenerationStatus: "NOT_REGENERABLE" as const,
    regenerationReason: "PAYMENT_STATUS_QR_ACTIVE",
    createdAt: "2026-07-21T12:00:00.000Z",
    updatedAt: "2026-07-21T12:00:00.000Z",
    confirmedAt: null,
  };
  const activePayment = {
    paymentId: "payment-1",
    amount: "10.50",
    amountMinor: "1050",
    currency: "BOB" as const,
    status: "QR_ACTIVE" as const,
    provider: "RED_ENLACE" as const,
    merchantReference: "123456",
    providerReference: "654321",
    qrImage: qrPayment.qrImage,
    qrExpiresAt: qrPayment.qrExpiresAt,
    confirmationSource: null,
    createdAt: "2026-07-21T12:00:00.000Z",
    updatedAt: "2026-07-21T12:00:00.000Z",
    confirmedAt: null,
    tvdQuote: qrPayment.tvdQuote,
    accreditationId: null,
    accreditationStatus: null,
    txHash: null,
    regenerationStatus: "NOT_REGENERABLE" as const,
    regenerationReason: "PAYMENT_STATUS_QR_ACTIVE",
  };
  const confirmedPayment = {
    ...activePayment,
    status: "PAYMENT_CONFIRMED" as const,
    confirmationSource: "WEBHOOK",
    confirmedAt: "2026-07-21T12:01:00.000Z",
    accreditationId: "accreditation-1",
    accreditationStatus: "PENDING",
    regenerationReason: "PAYMENT_ALREADY_CONFIRMED",
  };

  return {
    summary: {
      tenantId: "tenant-1",
      assignmentId: "assignment-1",
      wallet: "0x1111111111111111111111111111111111111111",
      walletStatus: "VERIFIED",
      assignedBalance: { smallestUnit: "30000000000000000000", formatted: "30", decimals: 18 },
      liquidBalance: { smallestUnit: "50000000000000000000", formatted: "50" },
      totalBalance: { smallestUnit: "80000000000000000000", formatted: "80" },
      tokenSymbol: "TVD",
      chainId: 80002,
      contractAddress: "0x2222222222222222222222222222222222222222",
      lastAccreditation: null,
      pendingAccreditationsCount: 0,
    },
    quote,
    qrPayment,
    activePayment,
    confirmedPayment,
    expiredPayment: {
      ...activePayment,
      status: "EXPIRED" as const,
      qrExpiresAt: "2026-07-21T12:00:00.000Z",
      regenerationStatus: "REGENERABLE" as const,
      regenerationReason: "QR_EXPIRED_QUOTE_VALID",
    },
    rejectedPayment: {
      ...activePayment,
      status: "FAILED" as const,
      qrImage: null,
      regenerationReason: "PROVIDER_REJECTED",
    },
    reconciliationPayment: {
      ...activePayment,
      status: "RECONCILIATION_PENDING" as const,
      qrImage: null,
      regenerationStatus: "RECONCILIATION_REQUIRED" as const,
      regenerationReason: "PAYMENT_REGENERATION_RECONCILIATION_REQUIRED",
    },
    regeneratedQrPayment: {
      ...qrPayment,
      id: "payment-2",
      merchantReference: "223344",
      providerReference: "443322",
      previousPaymentId: "payment-1",
      qrExpiresAt: "2099-07-21T13:00:00.000Z",
    },
  };
}

export function configureRechargeMocks({
  fixtures = createRechargeFixtures(),
  paymentDetails = {},
  historyItems = [],
  createQr = () => jsonResponse(fixtures.qrPayment),
  regenerateQr = () => jsonResponse(fixtures.regeneratedQrPayment),
  quote = () => jsonResponse(fixtures.quote),
}: RechargeMockOptions = {}) {
  const fetchCalls: RechargeFetchCall[] = [];
  let idempotencySequence = 0;
  const detailQueues = new Map(
    Object.entries(paymentDetails).map(([paymentId, responses]) => [
      paymentId,
      [...responses],
    ]),
  );
  const takePaymentDetail = (paymentId: string) => {
    const queue = detailQueues.get(paymentId);
    if (queue?.length) return queue.shift();
    return paymentId === "payment-2"
      ? {
          ...fixtures.activePayment,
          paymentId: "payment-2",
          merchantReference: "223344",
          providerReference: "443322",
          qrExpiresAt: "2099-07-21T13:00:00.000Z",
        }
      : fixtures.activePayment;
  };
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    const call: RechargeFetchCall = {
      url: `${url.pathname}${url.search}`,
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" ? null : await request.clone().text(),
    };
    fetchCalls.push(call);

    if (url.pathname.endsWith("/tvd/me/summary")) return jsonResponse(fixtures.summary);
    if (url.pathname.endsWith("/tvd/me/quote")) return quote(call);
    if (url.pathname.endsWith("/payments/qr")) return createQr(call);
    if (url.pathname.endsWith("/payments/payment-1/regenerate")) return regenerateQr(call);
    const paymentMatch = url.pathname.match(/\/tvd\/me\/payments\/(payment-[^/]+)$/);
    if (paymentMatch) return jsonResponse(takePaymentDetail(paymentMatch[1]));
    if (url.pathname.endsWith("/tvd/me/payments")) {
      return jsonResponse({
        items: historyItems,
        page: 1,
        limit: 5,
        total: historyItems.length,
        hasNextPage: false,
      });
    }
    return jsonResponse({ code: "NOT_FOUND" }, 404);
  });

  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("crypto", {
    randomUUID: () => {
      idempotencySequence += 1;
      return `mx06-qr-idempotency-key-${idempotencySequence}`;
    },
    getRandomValues: (bytes: Uint8Array) => bytes,
  });

  return {
    fetchCalls,
    fetchMock,
    fixtures,
    queuePaymentDetail(paymentId: string, response: unknown) {
      const queue = detailQueues.get(paymentId) ?? [];
      queue.push(response);
      detailQueues.set(paymentId, queue);
    },
  };
}

export function renderRechargePage() {
  return renderWithAuthStore(<OperationalRechargePage />, {
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

export function setRechargeSearchParams(value = "") {
  searchParams = new URLSearchParams(value);
}

export function resetRechargeMocks() {
  searchParams = new URLSearchParams();
  navigationSetSearchParams.mockReset();
  navigationNavigate.mockReset();
  visualBalanceRefetch.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
}
