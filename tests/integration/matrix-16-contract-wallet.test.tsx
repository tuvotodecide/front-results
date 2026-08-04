import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TvdContractPage from "@/domains/superadmin/screens/TvdContractPage";
import TvdManualAssignmentPage from "@/domains/superadmin/screens/TvdManualAssignmentPage";
import TvdParametersPage from "@/domains/superadmin/screens/TvdParametersPage";
import TvdWalletLookupPage from "@/domains/superadmin/screens/TvdWalletLookupPage";
import type {
  TvdWalletLookupInstitutionSummary,
  TvdWalletLookupResponse,
} from "@/store/tvd";
import { renderWithAuthStore } from "../utils/renderWithStore";

const contractModel = {
  status: "available",
  network: {
    chainId: 84532,
    name: "Base Sepolia",
    explorerBaseUrl: "https://sepolia.basescan.org",
  },
  tvdToken: {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    explorerUrl: "https://sepolia.basescan.org/address/0x1234567890abcdef1234567890abcdef12345678",
    txExplorerUrl: "https://sepolia.basescan.org/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    status: "available",
    deploymentDate: {
      status: "available",
      isoDate: "2026-07-23T12:00:00.000Z",
      message: null,
    },
  },
  multisig: {
    address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    txHash: null,
    explorerUrl: "https://sepolia.basescan.org/address/0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    txExplorerUrl: null,
    status: "available",
    required: "2",
    ownersCount: 2,
    thresholdLabel: "2 de 2 firmantes",
    owners: [],
    warning: null,
    readStatus: "available",
    errorMessage: null,
  },
  officialWallets: [
    {
      id: "treasury",
      name: "Tesorería multisig",
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      explorerUrl: "https://sepolia.basescan.org/address/0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      status: "available",
      configKey: "TVD_TREASURY_WALLET",
      initialDistribution: {
        txHash: "0xaaa",
        txExplorerUrl: "https://sepolia.basescan.org/tx/0xaaa",
        amount: "1000 TVD",
        status: "available",
        message: null,
      },
      currentDistribution: { amount: "900 TVD", status: "available", message: null },
    },
  ],
  updatedAt: "2026-07-23T12:30:00.000Z",
  issues: [],
};

const parametersModel = {
  status: "available",
  network: { chainId: 8453, name: "Base", explorerBaseUrl: "https://basescan.org" },
  decimals: 18,
  tvdPerCredit: {
    raw: "1000000000000000000",
    formatted: "1 TVD",
    status: "available",
    message: null,
  },
  burn: {
    raw: "1000",
    formatted: "10%",
    status: "available",
    message: null,
    burnBps: "1000",
    burnPercentage: "10%",
  },
  rewardByVote: {
    raw: "0",
    formatted: "0 TVD",
    status: "available",
    message: null,
    enabled: false,
  },
  campaign: { status: "available", message: "No existe una campaña configurada", count: "0", fields: [] },
  contracts: {
    tvdToken: contractModel.tvdToken,
    electoralCredits: contractModel.tvdToken,
    voteManager: contractModel.tvdToken,
    incentiveCampaigns: contractModel.tvdToken,
  },
  updatedAt: "2026-07-23T12:30:00.000Z",
  issues: [],
};

vi.mock("@/domains/superadmin/hooks/useSuperadminTvdReadModel", () => ({
  useTvdContractsReadModel: () => ({
    data: contractModel,
    isLoading: false,
    error: null,
    retry: vi.fn(),
  }),
  useTvdParametersReadModel: () => ({
    data: parametersModel,
    isLoading: false,
    error: null,
    retry: vi.fn(),
  }),
}));

const walletAddresses = {
  available: "0x1111111111111111111111111111111111111111",
  unregistered: "0x2222222222222222222222222222222222222222",
  associated: "0x3333333333333333333333333333333333333333",
  disabled: "0x4444444444444444444444444444444444444444",
  retry: "0x5555555555555555555555555555555555555555",
  firstLookup: "0x6666666666666666666666666666666666666666",
  secondLookup: "0x7777777777777777777777777777777777777777",
  assignment: "0x8888888888888888888888888888888888888888",
  security: "0x9999999999999999999999999999999999999999",
};

const association: TvdWalletLookupInstitutionSummary = {
  tenantId: "tenant-1",
  tenantName: "Institución Uno",
  tenantActive: true,
  assignmentId: "assignment-1",
  userId: "user-1",
  institutionalRole: "TENANT_ADMIN",
  assignmentStatus: "APPROVED",
  assignmentActive: true,
  userActive: true,
  walletStatus: "VERIFIED",
  walletVerifiedAt: "2026-07-22T10:00:00.000Z",
  walletVerificationSource: "IDENTITY",
};

const walletResponse = (
  accountAddress: string,
  overrides: Partial<TvdWalletLookupResponse> = {},
): TvdWalletLookupResponse => ({
  accountAddress,
  registeredInIdentity: true,
  identityStatus: "REGISTERED",
  associationStatus: "ASSOCIATED",
  canUse: true,
  reasonCode: "WALLET_ASSOCIATED",
  associations: [association],
  ...overrides,
});

const availableWallet = walletResponse(walletAddresses.available, {
  associationStatus: "UNASSOCIATED",
  canUse: true,
  reasonCode: "WALLET_AVAILABLE",
  associations: [],
});

const unregisteredWallet = walletResponse(walletAddresses.unregistered, {
  registeredInIdentity: false,
  identityStatus: "NOT_REGISTERED",
  associationStatus: "UNASSOCIATED",
  canUse: false,
  reasonCode: "WALLET_NOT_REGISTERED",
  associations: [],
});

const associatedWallet = walletResponse(walletAddresses.associated);

const disabledWallet = walletResponse(walletAddresses.disabled, {
  associationStatus: "DISABLED",
  canUse: false,
  reasonCode: "WALLET_DISABLED",
  associations: [{ ...association, walletVerificationSource: null }],
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const createWalletFetch = (...responses: Response[]) => {
  const requests: Request[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push(request);
    return responses.shift() ?? jsonResponse({ code: "UNEXPECTED_REQUEST" }, 500);
  });
  return { fetchMock, requests };
};

const renderGlobal = (ui: ReactElement) =>
  renderWithAuthStore(ui, {
    token: "superadmin-token",
    role: "SUPERADMIN",
    active: true,
    activeContext: { type: "GLOBAL_ADMIN", role: "SUPERADMIN" },
    user: {
      id: "superadmin-1",
      email: "superadmin@test.dev",
      name: "Superadmin",
      role: "SUPERADMIN",
      active: true,
    },
  });

const lookup = async (user: ReturnType<typeof userEvent.setup>, address: string) => {
  await user.type(screen.getByLabelText(/Dirección de wallet/i), address);
  await user.click(screen.getByRole("button", { name: /^Consultar$/i }));
};

const expectWalletRequest = (request: Request | undefined, address: string) => {
  expect(request).toBeDefined();
  if (!request) return;
  const url = new URL(request.url);
  expect(url.pathname).toBe("/api/v1/tvd/admin/wallet-lookup");
  expect(url.searchParams.get("accountAddress")).toBe(address);
};

const findWalletResult = async () => {
  const heading = await screen.findByRole("heading", { name: "Detalle de billetera" });
  const result = heading.closest("article");
  if (!(result instanceof HTMLElement)) {
    throw new Error("No se encontró el contenedor del detalle de billetera.");
  }
  return result;
};

const findWalletState = async (membershipLabel: string) => {
  const result = await findWalletResult();
  expect(within(result).getByText(membershipLabel)).toBeInTheDocument();
  return result;
};

const openConsumptionDetail = async (user: ReturnType<typeof userEvent.setup>) => {
  const row = (await screen.findByText("Consumo por voto válido")).closest("tr");
  if (!row) throw new Error("No se encontró la fila de consumo por voto válido.");
  await user.click(within(row).getByRole("button", { name: "Editar" }));
};

describe("MX-16 | integración de contrato, parámetros y billeteras", () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.useRealTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          id: "rate-1",
          fiatCurrency: "BOB",
          bobPerToken: "1",
          validFrom: "2026-07-23T00:00:00.000Z",
          createdAt: "2026-07-23T00:00:00.000Z",
          reason: "Configuración de prueba",
        }),
      ),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("[MX-16][ADM-CTR-P0-001][INTEGRACION] muestra contrato disponible, cadena, txHash y acciones de copia actuales", async () => {
    renderGlobal(<TvdContractPage />);

    expect(await screen.findByText("Base Sepolia")).toBeInTheDocument();
    expect(screen.getByText("0x1234...5678")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Copiar" })).toHaveLength(4);
  });

  it("[MX-16][ADM-CTR-P0-001][ACEPTACION] publica enlaces externos seguros para dirección y transacción", async () => {
    renderGlobal(<TvdContractPage />);
    const links = await screen.findAllByRole("link", {
      name: /Ver en BaseScan|Ver transacción/i,
    });
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[0]).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("[MX-16][ADM-CTR-P1-002][INTEGRACION] presenta distribución inicial y balance actual de un fondo oficial", async () => {
    renderGlobal(<TvdContractPage />);
    expect(await screen.findByText("Tesorería multisig")).toBeInTheDocument();
    expect(screen.getByText("1000 TVD")).toBeInTheDocument();
    expect(screen.getByText("900 TVD")).toBeInTheDocument();
  });

  it("[MX-16][ADM-PRM-P0-001][INTEGRACION] renderiza parámetros leídos y permite abrir solo el detalle informativo", async () => {
    const user = userEvent.setup();
    renderGlobal(<TvdParametersPage />);
    await openConsumptionDetail(user);
    expect(
      screen.getByRole("dialog", { name: "Consumo por voto válido" }),
    ).toBeInTheDocument();
  });

  it("[MX-16][ADM-PRM-P0-001][ACEPTACION] cierra el detalle sin persistir cambios del parámetro", async () => {
    const user = userEvent.setup();
    renderGlobal(<TvdParametersPage />);
    await openConsumptionDetail(user);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(
      screen.queryByRole("dialog", { name: "Consumo por voto válido" }),
    ).not.toBeInTheDocument();
  });

  it("[MX-16][ADM-WAL-P0-001][INTEGRACION] muestra un error recuperable y reintenta el lookup global con la misma dirección", async () => {
    const user = userEvent.setup();
    const retryResponse = walletResponse(walletAddresses.retry);
    const { fetchMock, requests } = createWalletFetch(
      jsonResponse({ code: "IDENTITY_UNAVAILABLE", message: "temporal" }, 503),
      jsonResponse(retryResponse),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderGlobal(<TvdWalletLookupPage />);
    await lookup(user, walletAddresses.retry);
    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByText("No pudimos validar la wallet. Intenta nuevamente."),
    ).toBeInTheDocument();
    await user.click(within(alert).getByRole("button", { name: "Reintentar" }));

    await findWalletState("Sí pertenece");
    expectWalletRequest(requests[0], walletAddresses.retry);
    expectWalletRequest(requests[1], walletAddresses.retry);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["registrada", walletAddresses.available, availableWallet, "No pertenece"],
    ["no registrada", walletAddresses.unregistered, unregisteredWallet, "No pertenece"],
    ["asociada", walletAddresses.associated, associatedWallet, "Sí pertenece"],
    ["deshabilitada", walletAddresses.disabled, disabledWallet, "No pertenece"],
  ] as Array<[string, string, TvdWalletLookupResponse, string]>)(
    "[MX-16][ADM-WAL-P0-001][ACEPTACION][%s] muestra el estado actual de pertenencia sin secretos",
    async (_scenario, address, response, membershipLabel) => {
      const user = userEvent.setup();
      const { fetchMock, requests } = createWalletFetch(jsonResponse(response));
      vi.stubGlobal("fetch", fetchMock);

      renderGlobal(<TvdWalletLookupPage />);
      const result = await (async () => {
        await lookup(user, address);
        return findWalletState(membershipLabel);
      })();

      expectWalletRequest(requests[0], address);
      expect(result).not.toHaveTextContent(
        /serializedTransaction|identity-api-key|private key|secret/i,
      );
    },
  );

  it("[MX-16][ADM-WAL-P1-002][INTEGRACION] carga wallets al elegir institución y limpia la wallet al cambiarla", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request ? input : new Request(input, init);
        const pathname = new URL(request.url).pathname;
        calls.push(pathname);
        if (pathname.endsWith("/tvd/admin/institutions")) {
          return jsonResponse({
            items: [
              {
                tenantId: "tenant-1",
                name: "Institución Uno",
                active: true,
                assignmentsCount: 1,
                eligibleWalletsCount: 1,
              },
              {
                tenantId: "tenant-2",
                name: "Institución Dos",
                active: true,
                assignmentsCount: 1,
                eligibleWalletsCount: 1,
              },
            ],
            page: 1,
            limit: 10,
            total: 2,
            hasNextPage: false,
          });
        }
        if (pathname.endsWith("/tvd/admin/institutions/tenant-1/wallets")) {
          return jsonResponse({
            tenantId: "tenant-1",
            tenantName: "Institución Uno",
            tenantActive: true,
            wallets: [
              {
                assignmentId: "assignment-1",
                userId: "user-1",
                institutionalRole: "TENANT_ADMIN",
                status: "APPROVED",
                active: true,
                userActive: true,
                wallet: walletAddresses.assignment,
                walletNormalized: walletAddresses.assignment,
                walletStatus: "VERIFIED",
                walletVerifiedAt: "2026-07-22T10:00:00.000Z",
                walletVerificationSource: "IDENTITY",
                eligible: true,
              },
            ],
          });
        }
        if (pathname.endsWith("/tvd/admin/institutions/tenant-2/wallets")) {
          return jsonResponse({
            tenantId: "tenant-2",
            tenantName: "Institución Dos",
            tenantActive: true,
            wallets: [],
          });
        }
        return jsonResponse({ code: "NOT_FOUND" }, 404);
      }),
    );

    renderGlobal(<TvdManualAssignmentPage />);
    await user.click(
      await screen.findByRole("button", { name: /Institución Uno/i }),
    );
    await user.click(
      await screen.findByRole("button", {
        name: new RegExp(walletAddresses.assignment, "i"),
      }),
    );
    await user.click(screen.getByRole("button", { name: "Cambiar institución" }));
    await user.click(
      await screen.findByRole("button", { name: /Institución Dos/i }),
    );
    expect(
      await screen.findByText("Esta institución no tiene wallets registradas."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: new RegExp(walletAddresses.assignment, "i") }),
    ).not.toBeInTheDocument();
    expect(calls).toContain("/api/v1/tvd/admin/institutions/tenant-1/wallets");
    expect(calls).toContain("/api/v1/tvd/admin/institutions/tenant-2/wallets");
  });

  it("[MX-16][ADM-SEC-P0-002][INTEGRACION] sanitiza el error de wallet antes de mostrarlo", async () => {
    const user = userEvent.setup();
    const { fetchMock } = createWalletFetch(
      jsonResponse(
        { message: "serializedTransaction private-key identity-api-key" },
        500,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderGlobal(<TvdWalletLookupPage />);
    await lookup(user, walletAddresses.security);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("El servicio no está disponible. Intenta nuevamente.");
    expect(alert).not.toHaveTextContent("private-key");
  });

  it("[MX-16][ADM-CON-P1-002][INTEGRACION] no mantiene el resultado anterior al consultar una segunda wallet", async () => {
    const user = userEvent.setup();
    const firstResponse = walletResponse(walletAddresses.firstLookup);
    const secondResponse = walletResponse(walletAddresses.secondLookup, {
      associationStatus: "UNASSOCIATED",
      canUse: true,
      reasonCode: "WALLET_AVAILABLE",
      associations: [],
    });
    const { fetchMock, requests } = createWalletFetch(
      jsonResponse(firstResponse),
      jsonResponse(secondResponse),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderGlobal(<TvdWalletLookupPage />);
    await lookup(user, walletAddresses.firstLookup);
    const firstResult = await findWalletState("Sí pertenece");
    expect(firstResult).toHaveTextContent(walletAddresses.firstLookup);

    const input = screen.getByLabelText(/Dirección de wallet/i);
    await user.clear(input);
    await user.type(input, walletAddresses.secondLookup);
    expect(screen.queryByRole("heading", { name: "Detalle de billetera" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Consultar$/i }));

    const secondResult = await findWalletState("No pertenece");
    expect(secondResult).toHaveTextContent(walletAddresses.secondLookup);
    expect(secondResult).not.toHaveTextContent(walletAddresses.firstLookup);
    expectWalletRequest(requests[0], walletAddresses.firstLookup);
    expectWalletRequest(requests[1], walletAddresses.secondLookup);
  });
});
