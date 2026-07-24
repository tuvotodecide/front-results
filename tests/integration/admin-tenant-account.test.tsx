import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InstitutionalAccountPage from "@/features/adminTvd/screens/InstitutionalAccountPage";
import { readTvdOnChainBalance } from "@/features/adminTvd/services/tvdOnChainBalance";
import type { AuthState } from "@/store/auth/authSlice";
import type { TvdMySummaryResponse } from "@/store/tvd";
import type { TvdOnChainBalance } from "@/features/adminTvd/services/tvdOnChainBalance";
import { renderWithAuthStore } from "../utils/renderWithStore";

vi.mock("@/features/adminTvd/services/tvdOnChainBalance", () => ({
  readTvdOnChainBalance: vi.fn(),
}));

const activeWallet = "0x1234567890abcdef1234567890abcdef12345678" as const;
const secondWallet = "0x2222222222222222222222222222222222222222" as const;

const summaryResponse: TvdMySummaryResponse = {
  tenantId: "tenant-1",
  assignmentId: "assignment-1",
  wallet: activeWallet,
  walletStatus: "VERIFIED",
  assignedBalance: {
    smallestUnit: "20000000000000000000",
    formatted: "20",
    decimals: 18,
  },
  liquidBalance: {
    smallestUnit: "80000000000000000000",
    formatted: "80",
  },
  totalBalance: {
    smallestUnit: "100000000000000000000",
    formatted: "100",
  },
  tokenSymbol: "TVD",
  chainId: 84532,
  contractAddress: "0x3333333333333333333333333333333333333333",
  lastAccreditation: null,
  pendingAccreditationsCount: 0,
};

const visualBalance: TvdOnChainBalance = {
  wallet: activeWallet,
  chainId: 84532,
  tokenAddress: "0x1111111111111111111111111111111111111111",
  assignmentContractAddress: "0x3333333333333333333333333333333333333333",
  decimals: 18,
  liquidBalanceSmallestUnit: "80000000000000000000",
  assignedBalanceSmallestUnit: "20000000000000000000",
  totalBalanceSmallestUnit: "100000000000000000000",
  liquidBalanceFormatted: "80",
  assignedBalanceFormatted: "20",
  totalBalanceFormatted: "100",
  readAt: "2026-07-21T12:00:00.000Z",
};

const tenantAuth = (overrides?: Partial<AuthState>): Partial<AuthState> => ({
  token: "tenant-token",
  accessToken: "tenant-token",
  role: "TENANT_ADMIN",
  active: true,
  tenantId: "tenant-1",
  availableContexts: [
    {
      type: "TENANT",
      role: "TENANT_ADMIN",
      tenantId: "tenant-1",
      tenantName: "Colegio Médico",
    },
  ],
  activeContext: {
    type: "TENANT",
    role: "TENANT_ADMIN",
    tenantId: "tenant-1",
    tenantName: "Colegio Médico",
  },
  user: {
    id: "user-1",
    email: "admin@tenant.test",
    name: "Admin A",
    role: "TENANT_ADMIN",
    active: true,
    status: "ACTIVE",
    tenantId: "tenant-1",
    tenantName: "Colegio Médico",
  },
  ...overrides,
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const setupFetch = (handler: (request: Request) => Response | Promise<Response>) => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    if (!(input instanceof Request)) {
      throw new Error("Expected Request");
    }
    return handler(input);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("Admin tenant institutional account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readTvdOnChainBalance).mockResolvedValue(visualBalance);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined },
    });
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra una sola wallet activa del usuario autenticado y saldo visual on-chain", async () => {
    const fetchMock = setupFetch((request) => {
      expect(request.headers.get("authorization")).toBe("Bearer tenant-token");
      expect(request.headers.get("x-api-key")).toBeNull();
      expect(new URL(request.url).pathname).toBe("/api/v1/tvd/me/summary");
      return jsonResponse(summaryResponse);
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    expect(await screen.findByText(activeWallet)).toBeInTheDocument();
    expect(screen.getByText("Colegio Médico")).toBeInTheDocument();
    expect(screen.getByText("Verificada")).toBeInTheDocument();
    expect(await screen.findByText("100 TVD")).toBeInTheDocument();
    expect(screen.getByText("80 TVD")).toBeInTheDocument();
    expect(screen.getByText("20 TVD")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /Agregar cuenta/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Cuenta administrativa")).not.toBeInTheDocument();
    expect(screen.queryByText("Cuenta operativa")).not.toBeInTheDocument();
    expect(screen.queryByText("Cuenta auxiliar")).not.toBeInTheDocument();
    expect(screen.queryByText(secondWallet)).not.toBeInTheDocument();
    expect(screen.queryByText("180 TVD")).not.toBeInTheDocument();
    expect(screen.queryByText(/seed phrase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/clave privada/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/DNI/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/discoverableHash/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/IDENTITY_API_KEY/i)).not.toBeInTheDocument();

    expect(readTvdOnChainBalance).toHaveBeenCalledWith(
      activeWallet,
      summaryResponse.contractAddress,
      summaryResponse.chainId,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("permite copiar y reintentar saldo visual cuando RPC falla", async () => {
    const user = userEvent.setup();
    vi.mocked(readTvdOnChainBalance)
      .mockRejectedValueOnce(new Error("rpc down"))
      .mockResolvedValueOnce(visualBalance);
    setupFetch(() => jsonResponse(summaryResponse));

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    expect(
      await screen.findByText(/No pudimos consultar el saldo actual/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Actualizar saldo/i }));
    expect(await screen.findByText("100 TVD")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copiar" }));
    expect(screen.getByText("Dirección copiada.")).toBeInTheDocument();
  });

  it("muestra regularización heredada y resuelve wallet por DNI antes de enviar", async () => {
    const user = userEvent.setup();
    setupFetch((request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname.endsWith("/resolve-by-dni")) {
        return jsonResponse({
          registered: false,
          accountAddress: null,
          message: "No se encontró una billetera registrada para este carnet.",
        });
      }
      return jsonResponse({ code: "TVD_WALLET_NOT_VERIFIED" }, 400);
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    await user.click(await screen.findByRole("button", { name: /Regularizar wallet/i }));
    expect(
      screen.getByRole("dialog", { name: "Vincular wallet institucional" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/aplicación móvil/i).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("Wallet candidata")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Carnet de identidad")).toBeInTheDocument();
    expect(screen.getByLabelText("Wallet registrada")).toHaveAttribute("readonly");

    await user.type(screen.getByLabelText("Carnet de identidad"), "12345678");
    expect(
      await screen.findByText(
        "No se encontró una billetera registrada para este carnet. Debe registrarse primero en la aplicación móvil.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vincular wallet" })).toBeDisabled();
  });

  it("regulariza con endpoint real, no envía campos autoritativos y refresca resumen", async () => {
    const user = userEvent.setup();
    const regularizedSummary = {
      ...summaryResponse,
      wallet: secondWallet,
      assignmentId: "assignment-2",
    };
    const responses: Response[] = [
      jsonResponse({ code: "TVD_WALLET_NOT_VERIFIED" }, 400),
      jsonResponse({ registered: true, accountAddress: secondWallet }),
      jsonResponse({
        tenantId: "tenant-1",
        assignmentId: "assignment-2",
        userId: "user-1",
        accountAddress: secondWallet,
        institutionalRole: "PRIMARY",
        status: "APPROVED",
        active: true,
        hasWallet: true,
        requiresWalletUpdate: false,
        walletStatus: "VERIFIED",
        walletVerifiedAt: "2026-07-21T12:00:00.000Z",
        walletVerificationSource: "LEGACY_REGULARIZATION",
        updated: true,
      }),
      jsonResponse(regularizedSummary),
    ];
    const fetchMock = setupFetch((request) => {
      const response = responses.shift();
      if (!response) throw new Error(`Unexpected request: ${request.url}`);
      return response;
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    await user.click(await screen.findByRole("button", { name: /Regularizar wallet/i }));
    await user.type(screen.getByLabelText("Carnet de identidad"), "12345678");
    expect(await screen.findByDisplayValue(secondWallet)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Vincular wallet" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    const resolveRequest = fetchMock.mock.calls[1]?.[0];
    expect(resolveRequest).toBeInstanceOf(Request);
    if (resolveRequest instanceof Request) {
      expect(new URL(resolveRequest.url).pathname).toBe(
        "/api/v1/institutional-wallets/resolve-by-dni",
      );
      expect(JSON.parse(await resolveRequest.clone().text())).toEqual({
        dni: "12345678",
      });
      expect(resolveRequest.headers.get("x-api-key")).toBeNull();
    }

    const mutationRequest = fetchMock.mock.calls[2]?.[0];
    expect(mutationRequest).toBeInstanceOf(Request);
    if (mutationRequest instanceof Request) {
      const url = new URL(mutationRequest.url);
      expect(url.pathname).toBe(
        "/api/v1/institutional-tenants/tenant-1/admins/me/wallet-regularization",
      );
      const body = JSON.parse(await mutationRequest.clone().text()) as Record<string, unknown>;
      expect(body).toEqual({ dni: "12345678", accountAddress: secondWallet });
      expect(body.userId).toBeUndefined();
      expect(body.assignmentId).toBeUndefined();
      expect(body.availableBalance).toBeUndefined();
      expect(mutationRequest.headers.get("x-api-key")).toBeNull();
    }

    expect(
      await screen.findByText("Wallet institucional vinculada correctamente."),
    ).toBeInTheDocument();
    expect(await screen.findByText(secondWallet)).toBeInTheDocument();
  });

  it("mapea conflictos y no permite reemplazar una wallet ya verificada desde la pantalla", async () => {
    const user = userEvent.setup();
    setupFetch((request) => {
      const pathname = new URL(request.url).pathname;
      if (pathname.endsWith("/resolve-by-dni")) {
        return jsonResponse({ registered: true, accountAddress: secondWallet });
      }
      if (pathname.endsWith("/wallet-regularization")) {
        return jsonResponse({ message: "conflict" }, 409);
      }
      return jsonResponse({ code: "TVD_WALLET_NOT_VERIFIED" }, 400);
    });

    renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());

    await user.click(await screen.findByRole("button", { name: /Regularizar wallet/i }));
    await user.type(screen.getByLabelText("Carnet de identidad"), "12345678");
    expect(await screen.findByDisplayValue(secondWallet)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Vincular wallet" }));

    expect(
      await screen.findByText("La wallet no está disponible para esta cuenta."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cambiar wallet/i })).not.toBeInTheDocument();
  });

  it("no muestra datos del tenant anterior al cambiar de contexto", async () => {
    const tenantBWallet = "0x4444444444444444444444444444444444444444";
    setupFetch((request) => {
      const authorization = request.headers.get("authorization");
      if (authorization === "Bearer tenant-b-token") {
        return jsonResponse({
          ...summaryResponse,
          tenantId: "tenant-2",
          assignmentId: "assignment-b",
          wallet: tenantBWallet,
        });
      }
      return jsonResponse(summaryResponse);
    });

    const first = renderWithAuthStore(<InstitutionalAccountPage />, tenantAuth());
    expect(await screen.findByText(activeWallet)).toBeInTheDocument();
    first.unmount();

    renderWithAuthStore(
      <InstitutionalAccountPage />,
      tenantAuth({
        token: "tenant-b-token",
        accessToken: "tenant-b-token",
        tenantId: "tenant-2",
        activeContext: {
          type: "TENANT",
          role: "TENANT_ADMIN",
          tenantId: "tenant-2",
          tenantName: "Universidad Mayor",
        },
        user: {
          id: "user-2",
          email: "admin-b@tenant.test",
          name: "Admin B",
          role: "TENANT_ADMIN",
          active: true,
          status: "ACTIVE",
          tenantId: "tenant-2",
          tenantName: "Universidad Mayor",
        },
      }),
    );

    expect(await screen.findByText(tenantBWallet)).toBeInTheDocument();
    expect(screen.queryByText(activeWallet)).not.toBeInTheDocument();
    expect(screen.queryByText("180 TVD")).not.toBeInTheDocument();
  });
});
