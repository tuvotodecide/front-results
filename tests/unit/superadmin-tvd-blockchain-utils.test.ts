import { Interface, zeroPadValue } from "ethers";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getTxDateTime,
  getTxTokenTransfers,
  readDeploymentDateFromReceipt,
  readDeploymentDateFromTransaction,
  summarizeTvdReadStatus,
} from "@/shared/tvd/superadminTvdReadService";
import { getTvdServerBlockchainConfig } from "@/shared/tvd/tvdBlockchainConfig";
import {
  buildExplorerAddressUrl,
  convertBurnBpsToPercentage,
  formatTvdAmount,
  getKnownBaseNetwork,
  isRewardEnabled,
  truncateAddress,
} from "@/shared/tvd/tvdBlockchainFormatters";

describe("utilidades blockchain TVD Superadmin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("selecciona el nombre de red desde chain id conocido", () => {
    expect(getKnownBaseNetwork(8453).name).toBe("Base");
    expect(getKnownBaseNetwork(84532).name).toBe("Base Sepolia");
  });

  it("construye URL de BaseScan por dirección", () => {
    expect(
      buildExplorerAddressUrl(
        "https://sepolia.basescan.org/",
        "0x1234567890abcdef1234567890abcdef12345678",
      ),
    ).toBe(
      "https://sepolia.basescan.org/address/0x1234567890abcdef1234567890abcdef12345678",
    );
  });

  it("trunca direcciones sin alterar el valor fuente", () => {
    expect(truncateAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x1234...5678",
    );
  });

  it("formatea montos TVD sin convertir uint256 a Number", () => {
    expect(formatTvdAmount(1_000_000_000_000_000_000n, 18)).toBe("1 TVD");
    expect(formatTvdAmount(500_000_000_000_000_000n, 18)).toBe("0.5 TVD");
  });

  it("convierte BPS a porcentaje dentro de rango seguro", () => {
    expect(convertBurnBpsToPercentage(1000n)).toBe("10%");
    expect(convertBurnBpsToPercentage(125n)).toBe("1.25%");
  });

  it("calcula estado de recompensas con bigint", () => {
    expect(isRewardEnabled(0n)).toBe(false);
    expect(isRewardEnabled(1n)).toBe(true);
  });

  it("obtiene fecha ISO desde receipt y bloque", async () => {
    const provider = {
        getTransactionReceipt: async () => ({ status: 1, blockNumber: 123 }),
        getTransaction: async () => null,
        getBlock: async () => ({ timestamp: 1_700_000_000 }),
      } as never;
    const result = await readDeploymentDateFromReceipt(
      provider,
      "0xabc",
    );

    expect(result).toEqual({
      status: "available",
      isoDate: "2023-11-14T22:13:20.000Z",
      message: null,
    });
  });

  it("controla txHash vacío, receipt inexistente y bloque inexistente", async () => {
    await expect(readDeploymentDateFromReceipt({} as never, null)).resolves.toMatchObject({
      status: "not_configured",
    });

    await expect(
      readDeploymentDateFromReceipt(
        {
          getTransactionReceipt: async () => null,
          getTransaction: async () => null,
          getBlock: async () => null,
        } as never,
        "0xabc",
      ),
    ).resolves.toMatchObject({ status: "not_available" });

    await expect(
      readDeploymentDateFromReceipt(
        {
          getTransactionReceipt: async () => ({ status: 1, blockNumber: 456 }),
          getTransaction: async () => null,
          getBlock: async () => null,
        } as never,
        "0xabc",
      ),
    ).resolves.toMatchObject({ status: "not_available", message: "Bloque no encontrado" });
  });

  it("marca lectura parcial cuando hay error secundario", () => {
    expect(summarizeTvdReadStatus(true, [])).toBe("available");
    expect(
      summarizeTvdReadStatus(true, [{ code: "TVD_MULTISIG_RPC_ERROR", message: "falló" }]),
    ).toBe("partial");
  });

  it("selecciona Base Sepolia en dev y Base en producción", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TVD_CHAIN_ID", "");
    expect(getTvdServerBlockchainConfig()).toMatchObject({
      chainId: 84532,
      name: "Base Sepolia",
      explorerBaseUrl: "https://sepolia.basescan.org",
      rpcUrl: "https://base-sepolia.drpc.org",
    });

    vi.stubEnv("NODE_ENV", "production");
    expect(getTvdServerBlockchainConfig()).toMatchObject({
      chainId: 8453,
      name: "Base",
      explorerBaseUrl: "https://basescan.org",
      rpcUrl: "https://base.drpc.org",
    });
  });

  it("obtiene fecha desde transaction.blockNumber y maneja tx pendiente o inexistente", async () => {
    const provider = {
      getTransaction: vi.fn(async (hash: string) =>
        hash === "0xpending" ? { blockNumber: null } : { blockNumber: 9 },
      ),
      getBlock: vi.fn(async () => ({ timestamp: 1_700_000_100 })),
    } as never;

    await expect(getTxDateTime(provider, "0xok")).resolves.toEqual(
      new Date("2023-11-14T22:15:00.000Z"),
    );
    await expect(readDeploymentDateFromTransaction(provider, "0xpending")).resolves.toMatchObject({
      status: "pending",
    });
    await expect(
      readDeploymentDateFromTransaction(
        {
          getTransaction: vi.fn(async () => null),
          getBlock: vi.fn(),
        } as never,
        "0xmissing",
      ),
    ).resolves.toMatchObject({ status: "not_available" });
  });

  it("parsea transfers filtrando por contrato TVD", async () => {
    const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
    const otherToken = "0x9999999999999999999999999999999999999999";
    const iface = new Interface([
      "event Transfer(address indexed from, address indexed to, uint256 value)",
    ]);
    const transfer = iface.encodeEventLog(iface.getEvent("Transfer")!, [
      "0x0000000000000000000000000000000000000000",
      "0x1111111111111111111111111111111111111111",
      10n,
    ]);
    const otherTransfer = iface.encodeEventLog(iface.getEvent("Transfer")!, [
      "0x0000000000000000000000000000000000000000",
      "0x2222222222222222222222222222222222222222",
      20n,
    ]);
    const provider = {
      getTransactionReceipt: vi.fn(async () => ({
        logs: [
          { address: otherToken, topics: otherTransfer.topics, data: otherTransfer.data },
          { address: tokenAddress, topics: transfer.topics, data: transfer.data },
          { address: tokenAddress, topics: [zeroPadValue("0x01", 32)], data: "0x" },
        ],
      })),
    } as never;

    await expect(getTxTokenTransfers(provider, tokenAddress, "0xtx")).resolves.toEqual([
      {
        tokenAddress,
        from: "0x0000000000000000000000000000000000000000",
        to: "0x1111111111111111111111111111111111111111",
        valueRaw: 10n,
      },
    ]);
  });
});
