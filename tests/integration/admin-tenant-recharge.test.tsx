import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import OperationalRechargePage from "@/features/adminTvd/screens/OperationalRechargePage";
import { renderWithAuthStore } from "../utils/renderWithStore";

let searchParams = new URLSearchParams();
const visualBalanceRefetch = vi.fn();

vi.mock("@/domains/votacion/navigation/compat-private", () => ({
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

type FetchCall = {
  url: string;
  method: string;
  headers: Headers;
  body: string | null;
};

const fetchCalls: FetchCall[] = [];
const paymentDetailQueue: unknown[] = [];

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const summaryResponse = {
  tenantId: "tenant-1",
  assignmentId: "assignment-1",
  wallet: "0x1111111111111111111111111111111111111111",
  walletStatus: "VERIFIED",
  assignedBalance: {
    smallestUnit: "30000000000000000000",
    formatted: "30",
    decimals: 18,
  },
  liquidBalance: {
    smallestUnit: "50000000000000000000",
    formatted: "50",
  },
  totalBalance: {
    smallestUnit: "80000000000000000000",
    formatted: "80",
  },
  tokenSymbol: "TVD",
  chainId: 80002,
  contractAddress: "0x2222222222222222222222222222222222222222",
  lastAccreditation: null,
  pendingAccreditationsCount: 0,
};

const quoteResponse = {
  fiatAmount: "10.50",
  fiatAmountMinor: "1050",
  fiatCurrency: "BOB",
  estimatedTvd: "4.2",
  estimatedTvdSmallestUnit: "4200000000000000000",
  bobPerToken: "2.5",
  exchangeRateVersion: 7,
  quotedAt: "2026-07-21T12:00:00.000Z",
};

const qrPaymentResponse = {
  id: "payment-1",
  tenantId: "tenant-1",
  requestedByUserId: "user-1",
  amount: "10.50",
  amountMinor: "1050",
  currency: "BOB",
  status: "QR_ACTIVE",
  provider: "RED_ENLACE",
  merchantReference: "123456",
  providerReference: "654321",
  qrImage: "iVBORw0KGgo=",
  qrExpiresAt: "2026-07-21T12:30:00.000Z",
  confirmationSource: null,
  tvdQuote: {
    fiatAmountMinor: "1050",
    fiatCurrency: "BOB",
    bobPerToken: "2.5",
    exchangeRateVersion: 7,
    tokenAmount: "4.2",
    tokenAmountSmallestUnit: "4200000000000000000",
    quotedAt: "2026-07-21T12:00:00.000Z",
  },
  tokenAccreditation: null,
  createdAt: "2026-07-21T12:00:00.000Z",
  updatedAt: "2026-07-21T12:00:00.000Z",
  confirmedAt: null,
};

const confirmedPaymentResponse = {
  paymentId: "payment-1",
  amount: "10.50",
  amountMinor: "1050",
  currency: "BOB",
  status: "PAYMENT_CONFIRMED",
  provider: "RED_ENLACE",
  merchantReference: "123456",
  providerReference: "654321",
  qrExpiresAt: "2026-07-21T12:30:00.000Z",
  confirmationSource: "WEBHOOK",
  createdAt: "2026-07-21T12:00:00.000Z",
  updatedAt: "2026-07-21T12:01:00.000Z",
  confirmedAt: "2026-07-21T12:01:00.000Z",
  tvdQuote: qrPaymentResponse.tvdQuote,
  accreditationId: "accreditation-1",
  accreditationStatus: "PENDING",
  txHash: null,
};

const activePaymentDetailResponse = {
  ...confirmedPaymentResponse,
  status: "QR_ACTIVE",
  confirmedAt: null,
  accreditationId: null,
  accreditationStatus: null,
  txHash: null,
};

const confirmedAccreditationResponse = {
  ...confirmedPaymentResponse,
  accreditationStatus: "CONFIRMED",
  txHash: "0xabc123",
};

const renderRechargePage = () =>
  renderWithAuthStore(<OperationalRechargePage />, {
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

const installFetchMock = () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request =
      input instanceof Request
        ? input
        : new Request(input, init);
    const url = new URL(request.url);
    fetchCalls.push({
      url: `${url.pathname}${url.search}`,
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" ? null : await request.text(),
    });

    if (url.pathname.endsWith("/tvd/me/summary")) {
      return jsonResponse(summaryResponse);
    }
    if (url.pathname.endsWith("/tvd/me/quote")) {
      return jsonResponse(quoteResponse);
    }
    if (url.pathname.endsWith("/payments/qr")) {
      return jsonResponse(qrPaymentResponse);
    }
    if (url.pathname.endsWith("/tvd/me/payments/payment-1")) {
      return jsonResponse(paymentDetailQueue.shift() ?? confirmedPaymentResponse);
    }
    if (url.pathname.endsWith("/tvd/me/payments")) {
      return jsonResponse({
        items: [confirmedPaymentResponse],
        page: 1,
        limit: 5,
        total: 1,
        hasNextPage: false,
      });
    }
    return jsonResponse({ code: "NOT_FOUND" }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("Admin tenant operational recharge", () => {
  beforeEach(() => {
    // Timers reales: RTK Query y user-event coordinan mejor con el debounce de la pantalla.
    vi.clearAllMocks();
    fetchCalls.length = 0;
    paymentDetailQueue.length = 0;
    visualBalanceRefetch.mockReset();
    searchParams = new URLSearchParams();
    installFetchMock();
  });

  afterEach(() => {
        vi.unstubAllGlobals();
  });

  it("consulta cotizacion real y no muestra paquetes ni saldo mock", async () => {
    const user = userEvent.setup();
    renderRechargePage();

    expect(await screen.findByText("Colegio Demo")).toBeInTheDocument();
    expect(screen.queryByText("Básico")).not.toBeInTheDocument();
    expect(screen.queryByText("Estándar")).not.toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Monto BOB a pagar"));
    await user.type(screen.getByLabelText("Monto BOB a pagar"), "10.50");

    expect(await screen.findByText("4.2 TVD")).toBeInTheDocument();
    expect(screen.getByText("Bs. 2.5 por TVD")).toBeInTheDocument();
    expect(
      fetchCalls.some((call) =>
        call.url.includes("/tvd/me/quote?amount=10.50&currency=BOB"),
      ),
    ).toBe(true);
  });

  it("bloquea montos invalidos antes de consultar cotizacion o crear QR", async () => {
    const user = userEvent.setup();
    renderRechargePage();

    await user.type(screen.getByLabelText("Monto BOB a pagar"), "0");

    expect(screen.getByText("El monto debe ser mayor que cero.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generar QR/i })).toBeDisabled();
    expect(fetchCalls.some((call) => call.url.includes("/tvd/me/quote"))).toBe(false);

    await user.clear(screen.getByLabelText("Monto BOB a pagar"));
    await user.type(screen.getByLabelText("Monto BOB a pagar"), "10.555");

    expect(
      screen.getByText("Usa un monto en BOB con hasta dos decimales."),
    ).toBeInTheDocument();
  });

  it("crea QR real con Idempotency-Key y no envia wallet, tasa, glosa ni x-api-key", async () => {
    const user = userEvent.setup();
    paymentDetailQueue.push(activePaymentDetailResponse);
    renderRechargePage();

    await user.clear(screen.getByLabelText("Monto BOB a pagar"));
    await user.type(screen.getByLabelText("Monto BOB a pagar"), "10.50");
    await screen.findByText("4.2 TVD");

    const createButton = screen.getByRole("button", { name: /Generar QR/i });
    await user.dblClick(createButton);

    expect(await screen.findByAltText("Código QR para pagar la recarga TVD")).toBeInTheDocument();

    const qrPosts = fetchCalls.filter((call) => call.url.endsWith("/payments/qr"));
    expect(qrPosts).toHaveLength(1);
    expect(qrPosts[0].headers.get("Authorization")).toBe("Bearer jwt-token");
    expect(qrPosts[0].headers.get("Idempotency-Key")).toBeTruthy();
    expect(qrPosts[0].headers.get("x-api-key")).toBeNull();

    const body = JSON.parse(qrPosts[0].body ?? "{}") as Record<string, unknown>;
    expect(body).toEqual({
      amount: "10.50",
      currency: "BOB",
      description: "Recarga operativa",
    });
    expect(body.walletAddress).toBeUndefined();
    expect(body.bobPerToken).toBeUndefined();
    expect(body.estimatedTvd).toBeUndefined();
    expect(body.glosa).toBeUndefined();
  });

  it("muestra pago confirmado y acreditacion pendiente como estados separados", async () => {
    const user = userEvent.setup();
    paymentDetailQueue.push(confirmedPaymentResponse);
    renderRechargePage();

    await user.clear(screen.getByLabelText("Monto BOB a pagar"));
    await user.type(screen.getByLabelText("Monto BOB a pagar"), "10.50");
    await screen.findByText("4.2 TVD");
    await user.click(screen.getByRole("button", { name: /Generar QR/i }));

    expect(await screen.findByText("Pago recibido correctamente.")).toBeInTheDocument();
    expect(
      screen.getByText("Pago recibido; acreditación TVD en proceso."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Pago fallido")).not.toBeInTheDocument();
  });

  it("actualiza saldo visual al confirmar acreditacion y permite copiar referencia", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    paymentDetailQueue.push(confirmedAccreditationResponse);
    renderRechargePage();

    await user.clear(screen.getByLabelText("Monto BOB a pagar"));
    await user.type(screen.getByLabelText("Monto BOB a pagar"), "10.50");
    await screen.findByText("4.2 TVD");
    await user.click(screen.getByRole("button", { name: /Generar QR/i }));

    expect(await screen.findByText("TVD acreditados correctamente.")).toBeInTheDocument();
    await waitFor(() => expect(visualBalanceRefetch).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /Copiar/i }));

    expect(writeText).toHaveBeenCalledWith("123456");
    expect(screen.getByText("Referencia copiada.")).toBeInTheDocument();
  });
});
