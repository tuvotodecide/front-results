import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TvdContractPage from "@/domains/superadmin/screens/TvdContractPage";
import TvdParametersPage from "@/domains/superadmin/screens/TvdParametersPage";
import * as clipboardService from "@/domains/superadmin/services/clipboard";
import type { TvdContractsReadModel } from "@/shared/tvd/superadminTvdTypes";
import { renderWithAuthStore } from "../utils/renderWithStore";

const ethersMocks = vi.hoisted(() => ({
  failRpc: false,
}));

vi.mock("ethers", async () => {
  const actual = await vi.importActual<typeof import("ethers")>("ethers");

  class MockProvider {
    getTransactionReceipt = vi.fn(async () => {
      if (ethersMocks.failRpc) throw new Error("rpc");
      return { status: 1, blockNumber: 123 };
    });

    getTransaction = vi.fn(async () => null);

    getBlock = vi.fn(async () => {
      if (ethersMocks.failRpc) throw new Error("rpc");
      return { timestamp: 1_785_000_000 };
    });
  }

  class MockContract {
    constructor(private readonly address: string) {}

    decimals = vi.fn(async () => {
      if (ethersMocks.failRpc) throw new Error("rpc");
      return 18;
    });

    required = vi.fn(async () => {
      if (ethersMocks.failRpc) throw new Error("rpc");
      return 2n;
    });

    getOwners = vi.fn(async () => {
      if (ethersMocks.failRpc) throw new Error("rpc");
      return [
        "0x1111111111111111111111111111111111111111",
        "0x2222222222222222222222222222222222222222",
        "0x3333333333333333333333333333333333333333",
      ];
    });

    platformWallet = vi.fn(async () => {
      if (ethersMocks.failRpc) throw new Error("rpc");
      return "0x7777777777777777777777777777777777777777";
    });

    tvdPerCredit = vi.fn(async () => {
      if (ethersMocks.failRpc) throw new Error("rpc");
      return 1_000_000_000_000_000_000n;
    });

    burnBps = vi.fn(async () => {
      if (ethersMocks.failRpc) throw new Error("rpc");
      return 1000n;
    });

    rewardByVote = vi.fn(async () => {
      if (ethersMocks.failRpc) throw new Error("rpc");
      return this.address === "0x5555555555555555555555555555555555555555"
        ? 0n
        : 1n;
    });

    campaignsCount = vi.fn(async () => {
      if (ethersMocks.failRpc) throw new Error("rpc");
      return 0n;
    });

    campaignCount = vi.fn(async () => {
      if (ethersMocks.failRpc) throw new Error("rpc");
      return 0n;
    });
  }

  return {
    ...actual,
    JsonRpcProvider: MockProvider,
    Contract: MockContract,
  };
});

const historyContractsResponse = {
  success: true,
  data: {
    tvdToken: {
      address: "0x1234567890abcdef1234567890abcdef12345678",
      txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    multisigWallet: {
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      txHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    },
    electoralCredits: {
      address: "0x4444444444444444444444444444444444444444",
      txHash: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    },
    voteManager: {
      address: "0x5555555555555555555555555555555555555555",
      txHash: "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      implementationAddress: "0x9999999999999999999999999999999999999999",
    },
    incentiveCampaigns: {
      address: "0x6666666666666666666666666666666666666666",
      txHash: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    },
  },
};

const contractReadModel: TvdContractsReadModel = {
  status: "available",
  network: {
    chainId: 84532,
    name: "Base Sepolia",
    explorerBaseUrl: "https://sepolia.basescan.org",
    actualChainId: 84532,
    chainStatus: "available",
    chainMessage: null,
  },
  tvdToken: {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    explorerUrl:
      "https://sepolia.basescan.org/address/0x1234567890abcdef1234567890abcdef12345678",
    txExplorerUrl:
      "https://sepolia.basescan.org/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    status: "available",
    deploymentDate: {
      status: "available",
      isoDate: "2026-07-24T12:30:00.000Z",
      message: null,
    },
  },
  multisig: {
    address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    txHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    explorerUrl:
      "https://sepolia.basescan.org/address/0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    txExplorerUrl:
      "https://sepolia.basescan.org/tx/0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    status: "available",
    required: "2",
    ownersCount: 3,
    thresholdLabel: "2 de 3 firmantes",
    owners: [
      {
        address: "0x1111111111111111111111111111111111111111",
        explorerUrl:
          "https://sepolia.basescan.org/address/0x1111111111111111111111111111111111111111",
      },
      {
        address: "0x2222222222222222222222222222222222222222",
        explorerUrl:
          "https://sepolia.basescan.org/address/0x2222222222222222222222222222222222222222",
      },
      {
        address: "0x3333333333333333333333333333333333333333",
        explorerUrl:
          "https://sepolia.basescan.org/address/0x3333333333333333333333333333333333333333",
      },
    ],
    warning: null,
    readStatus: "available",
    errorMessage: null,
  },
  officialWallets: [
    {
      id: "treasury",
      name: "Tesorería multisig",
      address: "0x4444444444444444444444444444444444444444",
      explorerUrl:
        "https://sepolia.basescan.org/address/0x4444444444444444444444444444444444444444",
      status: "available",
      configKey: "TVD_TREASURY_WALLET",
      initialDistribution: {
        txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        txExplorerUrl:
          "https://sepolia.basescan.org/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        amount: "1000 $TVD",
        status: "available",
        message: null,
      },
      currentDistribution: {
        amount: "900 $TVD",
        status: "available",
        message: null,
      },
    },
    {
      id: "ecosystem",
      name: "Ecosistema",
      address: "0x5555555555555555555555555555555555555555",
      explorerUrl:
        "https://sepolia.basescan.org/address/0x5555555555555555555555555555555555555555",
      status: "available",
      configKey: "TVD_ECOSYSTEM_WALLET",
      initialDistribution: {
        txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        txExplorerUrl:
          "https://sepolia.basescan.org/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        amount: "2000 $TVD",
        status: "available",
        message: null,
      },
      currentDistribution: {
        amount: "1800 $TVD",
        status: "available",
        message: null,
      },
    },
    {
      id: "liquidity",
      name: "Liquidez",
      address: "0x6666666666666666666666666666666666666666",
      explorerUrl:
        "https://sepolia.basescan.org/address/0x6666666666666666666666666666666666666666",
      status: "available",
      configKey: "TVD_LIQUIDITY_WALLET",
      initialDistribution: {
        txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        txExplorerUrl:
          "https://sepolia.basescan.org/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        amount: "3000 $TVD",
        status: "available",
        message: null,
      },
      currentDistribution: {
        amount: "3000 $TVD",
        status: "available",
        message: null,
      },
    },
    {
      id: "core-team",
      name: "Equipo Core",
      address: "0x7777777777777777777777777777777777777777",
      explorerUrl:
        "https://sepolia.basescan.org/address/0x7777777777777777777777777777777777777777",
      status: "available",
      configKey: "TVD_CORE_TEAM_WALLET",
      initialDistribution: {
        txHash: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        txExplorerUrl:
          "https://sepolia.basescan.org/tx/0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        amount: null,
        status: "not_available",
        message: "Transfer inicial no encontrado",
      },
      currentDistribution: {
        amount: "400 $TVD",
        status: "available",
        message: null,
      },
    },
  ],
  updatedAt: "2026-07-24T12:31:00.000Z",
  issues: [],
};

const mockHistoryFetch = (status = 200) => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      status === 200 ? JSON.stringify(historyContractsResponse) : "{}",
      {
        status,
        headers: { "Content-Type": "application/json" },
      },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const mockInternalContractFetch = (
  body: unknown = { success: true, data: contractReadModel },
  status = 200,
) => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const fetchUrl = (fetchMock: ReturnType<typeof vi.fn>) => {
  const input = fetchMock.mock.calls[0]?.[0];
  if (input instanceof Request) return input.url;
  return String(input);
};

const fetchAuth = (fetchMock: ReturnType<typeof vi.fn>) => {
  const [input, init] = fetchMock.mock.calls[0] ?? [];
  if (input instanceof Request) return input.headers.get("authorization");
  const headers = new Headers(init?.headers);
  return headers.get("authorization");
};

describe("vistas Superadmin TVD conectadas a /history/contracts", () => {
  beforeEach(() => {
    ethersMocks.failRpc = false;
    vi.stubEnv("NEXT_PUBLIC_BASE_API_URL", "http://localhost:3005");
    vi.stubEnv("NEXT_PUBLIC_TVD_CHAIN_RPC_URL", "https://sepolia.base.org");
    vi.stubEnv("NEXT_PUBLIC_TVD_CHAIN_ID", "84532");
    vi.stubEnv("NEXT_PUBLIC_TVD_NETWORK_NAME", "Base Sepolia");
    vi.stubEnv(
      "NEXT_PUBLIC_TVD_BLOCK_EXPLORER_URL",
      "https://sepolia.basescan.org",
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("consume la ruta interna server-side del contrato", async () => {
    const fetchMock = mockInternalContractFetch();

    renderWithAuthStore(<TvdContractPage />, {
      token: "superadmin-token",
      role: "SUPERADMIN",
      active: true,
    });

    expect(await screen.findByText(/Base Sepolia/)).toBeInTheDocument();
    expect(fetchUrl(fetchMock)).toBe("/api/superadmin/tvd/contracts");
    expect(fetchAuth(fetchMock)).toBeNull();
  });

  it("renderiza TVD, multisig, fecha, umbral, firmantes y fondos desde la lectura server-side", async () => {
    const user = userEvent.setup();
    const copySpy = vi
      .spyOn(clipboardService, "copyTextToClipboard")
      .mockResolvedValue(undefined);
    mockInternalContractFetch();

    renderWithAuthStore(<TvdContractPage />, {
      token: "superadmin-token",
      role: "SUPERADMIN",
      active: true,
    });

    expect(await screen.findByText("0x1234...5678")).toBeInTheDocument();
    expect(screen.getByText("2 de 3 firmantes")).toBeInTheDocument();
    expect(screen.getByText("Firmantes autorizados (3)")).toBeInTheDocument();
    expect(screen.getByText("Tesorería multisig")).toBeInTheDocument();
    expect(screen.getByText("Ecosistema")).toBeInTheDocument();
    expect(screen.getByText("Liquidez")).toBeInTheDocument();
    expect(screen.getByText("Equipo Core")).toBeInTheDocument();
    expect(screen.getByText("1000 $TVD")).toBeInTheDocument();
    expect(screen.getByText("900 $TVD")).toBeInTheDocument();
    expect(screen.getByText("Transfer inicial no encontrado")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Ver en BaseScan/i })[0])
      .toHaveAttribute(
        "href",
        "https://sepolia.basescan.org/address/0x1234567890abcdef1234567890abcdef12345678",
      );
    expect(
      screen.getAllByRole("link", { name: /Ver transacción/i })[0],
    ).toHaveAttribute(
      "href",
      "https://sepolia.basescan.org/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    expect(screen.getAllByRole("button", { name: /Copiar/i }).length).toBeGreaterThanOrEqual(2);

    await user.click(screen.getAllByRole("button", { name: /Copiar/i })[0]);
    await waitFor(() => {
      expect(copySpy).toHaveBeenCalledWith(
        "0x1234567890abcdef1234567890abcdef12345678",
      );
    });
  });

  it("usa ElectoralCredits, VoteManager e IncentiveCampaigns del backend", async () => {
    mockHistoryFetch();

    renderWithAuthStore(<TvdParametersPage />, {
      token: "superadmin-token",
      role: "SUPERADMIN",
      active: true,
    });

    expect(
      await screen.findByText("Datos consultados en Base Sepolia"),
    ).toBeInTheDocument();
    expect(screen.getByText("1 TVD")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("0 TVD")).toBeInTheDocument();
    expect(screen.getByText("Deshabilitadas")).toBeInTheDocument();
    expect(screen.getByText("No existe una campaña configurada")).toBeInTheDocument();
    expect(screen.getByText("0x4444...4444")).toBeInTheDocument();
    expect(screen.getByText("0x5555...5555")).toBeInTheDocument();
    expect(screen.getByText("0x6666...6666")).toBeInTheDocument();
  });

  it.each([401, 403])("muestra error Backend Results con estado %s", async (status) => {
    mockInternalContractFetch(
      { message: `No fue posible obtener el registro de contratos (${status}).` },
      status,
    );

    renderWithAuthStore(<TvdContractPage />, {
      token: "superadmin-token",
      role: "SUPERADMIN",
      active: true,
    });

    expect(
      await screen.findByText(
        `No fue posible obtener el registro de contratos (${status}).`,
      ),
    ).toBeInTheDocument();
  });

  it("muestra error Backend Results ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    renderWithAuthStore(<TvdContractPage />, {
      token: "superadmin-token",
      role: "SUPERADMIN",
      active: true,
    });

    expect(await screen.findByText(/network/i)).toBeInTheDocument();
  });

  it("mantiene direcciones visibles si falla RPC", async () => {
    mockInternalContractFetch({
      success: true,
      data: {
        ...contractReadModel,
        status: "partial",
        multisig: {
          ...contractReadModel.multisig,
          readStatus: "error",
          errorMessage: "Error RPC al consultar multisig",
          owners: [],
          ownersCount: null,
          thresholdLabel: null,
        },
      },
    });

    renderWithAuthStore(<TvdContractPage />, {
      token: "superadmin-token",
      role: "SUPERADMIN",
      active: true,
    });

    expect(await screen.findByText("0x1234...5678")).toBeInTheDocument();
    expect(screen.getAllByText("0xabcd...abcd").length).toBeGreaterThan(0);
    expect(screen.getByText(/Parcialmente disponible/i)).toBeInTheDocument();
  });
});
