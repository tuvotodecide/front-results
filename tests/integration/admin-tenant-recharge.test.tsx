import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import OperationalRechargePage from "@/features/adminTvd/screens/OperationalRechargePage";
import { setActiveContext } from "@/store/auth/authSlice";
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
  previousPaymentId: null,
  regeneratedToPaymentId: null,
  regenerationStatus: "NOT_REGENERABLE",
  regenerationReason: "PAYMENT_STATUS_QR_ACTIVE",
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
  regenerationStatus: "NOT_REGENERABLE",
  regenerationReason: "PAYMENT_ALREADY_CONFIRMED",
};

const activePaymentDetailResponse = {
  ...confirmedPaymentResponse,
  status: "QR_ACTIVE",
  confirmedAt: null,
  accreditationId: null,
  accreditationStatus: null,
  txHash: null,
  qrImage: qrPaymentResponse.qrImage,
  regenerationStatus: "NOT_REGENERABLE",
  regenerationReason: "PAYMENT_STATUS_QR_ACTIVE",
};

const confirmedAccreditationResponse = {
  ...confirmedPaymentResponse,
  accreditationStatus: "CONFIRMED",
  txHash: "0xabc123",
};

const blockedAccreditationResponse = {
  ...confirmedPaymentResponse,
  accreditationStatus: "BLOCKED_CONFIGURATION",
  blockchainStatus: "ACCREDITATION_BLOCKED_CONFIGURATION",
  flowStatus: "ACCREDITATION_BLOCKED_CONFIGURATION",
  lastAccreditationErrorCode: "TVD_SIGNER_ROLE_MISSING",
};

const expiredPaymentDetailResponse = {
  ...activePaymentDetailResponse,
  status: "EXPIRED",
  qrExpiresAt: "2026-07-21T12:00:00.000Z",
  regenerationStatus: "REGENERABLE",
  regenerationReason: "QR_EXPIRED_QUOTE_VALID",
};

const ambiguousPaymentDetailResponse = {
  ...activePaymentDetailResponse,
  status: "RECONCILIATION_PENDING",
  regenerationStatus: "RECONCILIATION_REQUIRED",
  regenerationReason: "PAYMENT_REGENERATION_RECONCILIATION_REQUIRED",
};

const regeneratedQrPaymentResponse = {
  ...qrPaymentResponse,
  id: "payment-2",
  merchantReference: "223344",
  providerReference: "443322",
  previousPaymentId: "payment-1",
  regenerationStatus: "NOT_REGENERABLE",
  regenerationReason: "PAYMENT_STATUS_QR_ACTIVE",
  qrExpiresAt: "2026-07-21T13:00:00.000Z",
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
    if (url.pathname.endsWith("/payments/payment-1/regenerate")) {
      return jsonResponse(regeneratedQrPaymentResponse);
    }
    if (url.pathname.endsWith("/tvd/me/payments/payment-1")) {
      return jsonResponse(paymentDetailQueue.shift() ?? confirmedPaymentResponse);
    }
    if (url.pathname.endsWith("/tvd/me/payments/payment-2")) {
      return jsonResponse({
        ...activePaymentDetailResponse,
        paymentId: "payment-2",
        merchantReference: "223344",
        providerReference: "443322",
        qrExpiresAt: "2026-07-21T13:00:00.000Z",
      });
    }
    if (url.pathname.endsWith("/tvd/me/payments")) {
      return jsonResponse({
        // Los casos de creaciÃ³n deben iniciar en el paso 1. Cada test que
        // necesite recuperar un pago debe declararlo de forma explÃ­cita.
        items: [],
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

  it("TVD-QR-P0-001 | consulta cotizacion real y no muestra paquetes ni saldo mock", async () => {
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

  it("TVD-QR-P0-003 | bloquea montos invalidos antes de consultar cotizacion o crear QR", async () => {
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

  it("TVD-QR-P0-002 TVD-QR-P0-004 TVD-SEC-P0-002 | crea QR real con Idempotency-Key y no envia wallet, tasa, glosa ni x-api-key", async () => {
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

  it("TVD-QR-P1-005 | muestra Descargar QR debajo de la imagen y no llama backend al descargar", async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    const remove = vi.fn();
    const anchor = {
      click,
      remove,
      set href(_value: string) {},
      set download(value: string) {
        expect(value).toBe("qr-recarga-tvd-123456.png");
      },
      set rel(value: string) {
        expect(value).toBe("noopener");
      },
    } as unknown as HTMLAnchorElement;
    paymentDetailQueue.push(activePaymentDetailResponse);
    renderRechargePage();

    await user.clear(screen.getByLabelText("Monto BOB a pagar"));
    await user.type(screen.getByLabelText("Monto BOB a pagar"), "10.50");
    await screen.findByText("4.2 TVD");
    await user.click(screen.getByRole("button", { name: /Generar QR/i }));

    const image = await screen.findByAltText("Código QR para pagar la recarga TVD");
    const downloadButton = screen.getByRole("button", { name: /Descargar QR/i });
    expect(
      image.compareDocumentPosition(downloadButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const before = fetchCalls.length;
    const createElement = vi.spyOn(document, "createElement").mockReturnValue(anchor);
    const appendChild = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:qr"),
      revokeObjectURL: vi.fn(),
    });
    await user.click(downloadButton);
    expect(click).toHaveBeenCalledTimes(1);
    expect(fetchCalls).toHaveLength(before);

    createElement.mockRestore();
    appendChild.mockRestore();
  });

  it("TVD-QR-P0-010 | regenera QR solo cuando backend autoriza y usa endpoint con Idempotency-Key", async () => {
    const user = userEvent.setup();
    paymentDetailQueue.push(expiredPaymentDetailResponse);
    renderRechargePage();

    await user.clear(screen.getByLabelText("Monto BOB a pagar"));
    await user.type(screen.getByLabelText("Monto BOB a pagar"), "10.50");
    await screen.findByText("4.2 TVD");
    await user.click(screen.getByRole("button", { name: /Generar QR/i }));

    const regenerateButton = await screen.findByRole("button", {
      name: /Regenerar QR/i,
    });
    await user.dblClick(regenerateButton);

    expect(await screen.findByText("QR regenerado. Esperando confirmación del pago.")).toBeInTheDocument();
    const regeneratePosts = fetchCalls.filter((call) =>
      call.url.endsWith("/payments/payment-1/regenerate"),
    );
    expect(regeneratePosts).toHaveLength(1);
    expect(regeneratePosts[0].headers.get("Authorization")).toBe("Bearer jwt-token");
    expect(regeneratePosts[0].headers.get("Idempotency-Key")).toBeTruthy();
    expect(regeneratePosts[0].body).toBe("");
  });

  it("TVD-QR-P0-009 TVD-QR-P0-010 | bloquea regeneracion visual cuando backend exige conciliacion", async () => {
    const user = userEvent.setup();
    paymentDetailQueue.push(ambiguousPaymentDetailResponse);
    renderRechargePage();

    await user.clear(screen.getByLabelText("Monto BOB a pagar"));
    await user.type(screen.getByLabelText("Monto BOB a pagar"), "10.50");
    await screen.findByText("4.2 TVD");
    await user.click(screen.getByRole("button", { name: /Generar QR/i }));

    expect(
      await screen.findByText(
        "Estamos verificando el estado del QR anterior. No generaremos otro QR hasta resolverlo para evitar un doble pago.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Regenerar QR/i })).not.toBeInTheDocument();
  });

  it("TVD-QR-P0-001 TVD-UI-P1-002 | limpia QR, quote y polling visual al cambiar de tenant activo", async () => {
    const user = userEvent.setup();
    paymentDetailQueue.push(activePaymentDetailResponse);
    const rendered = renderRechargePage();

    await user.clear(screen.getByLabelText("Monto BOB a pagar"));
    await user.type(screen.getByLabelText("Monto BOB a pagar"), "10.50");
    await screen.findByText("4.2 TVD");
    await user.click(screen.getByRole("button", { name: /Generar QR/i }));

    expect(await screen.findByAltText("Código QR para pagar la recarga TVD")).toBeInTheDocument();

    act(() => {
      rendered.store.dispatch(
        setActiveContext({
          type: "TENANT",
          tenantId: "tenant-2",
          tenantName: "Universidad Demo",
          role: "TENANT_ADMIN",
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.queryByAltText("Código QR para pagar la recarga TVD"),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Generar QR/i })).toBeDisabled();
  });

  it("TVD-QR-P0-006 TVD-RES-P0-001 TVD-UI-P1-001 | muestra pago confirmado y acreditacion pendiente como estados separados", async () => {
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

  it("TVD-RES-P0-003 TVD-UI-P1-002 | detiene polling visual y muestra bloqueo de configuracion de acreditacion", async () => {
    const user = userEvent.setup();
    paymentDetailQueue.push(blockedAccreditationResponse);
    renderRechargePage();

    await user.clear(screen.getByLabelText("Monto BOB a pagar"));
    await user.type(screen.getByLabelText("Monto BOB a pagar"), "10.50");
    await screen.findByText("4.2 TVD");
    await user.click(screen.getByRole("button", { name: /Generar QR/i }));

    expect(
      await screen.findByText(/Acreditación bloqueada por configuración/i),
    ).toBeInTheDocument();
    expect(paymentDetailQueue).toHaveLength(0);
  });

  it("TVD-RES-P0-002 TVD-RES-P0-004 TVD-UI-P1-003 | actualiza saldo visual al confirmar acreditacion y permite copiar referencia", async () => {
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
