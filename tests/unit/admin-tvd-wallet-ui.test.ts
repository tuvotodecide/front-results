import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatTvdDisplay,
  getRegularizationErrorMessage,
  getSummaryErrorMessage,
  isWalletUpdateRequiredError,
  validateInstitutionalWalletAddress,
} from "@/features/adminTvd/utils/institutionalWalletUi";

const viemMocks = vi.hoisted(() => {
  const readContract = vi.fn();
  return {
    readContract,
    createPublicClient: vi.fn(() => ({ readContract })),
    http: vi.fn((url: string) => ({ url })),
    formatUnits: vi.fn((value: bigint, decimals: number) => {
      const divisor = 10n ** BigInt(decimals);
      const integer = value / divisor;
      const fraction = value % divisor;
      if (fraction === 0n) return integer.toString();
      return `${integer}.${fraction.toString().padStart(decimals, "0")}`;
    }),
    isAddress: vi.fn((value: string) => /^0x[a-fA-F0-9]{40}$/.test(value)),
    getAddress: vi.fn((value: string) => value),
    zeroAddress: "0x0000000000000000000000000000000000000000",
  };
});

vi.mock("viem", () => viemMocks);

describe("admin TVD wallet UI helpers", () => {
  it.each([
    ["", false],
    ["   ", false],
    ["0x123", false],
    ["0x0000000000000000000000000000000000000000", false],
    ["0x1234567890abcdef1234567890abcdef12345678", true],
  ])("valida wallet institucional %s", (value, expected) => {
    expect(validateInstitutionalWalletAddress(value).valid).toBe(expected);
  });

  it("formatea TVD sin convertir smallest units a number", () => {
    expect(formatTvdDisplay("100.000000000000000000")).toBe("100");
    expect(formatTvdDisplay("1.234567890000000000")).toBe("1.234567");
    expect(formatTvdDisplay("0")).toBe("0");
  });

  it("detecta el error backend de regularización requerida", () => {
    const error = {
      status: 400,
      data: { code: "TVD_WALLET_NOT_VERIFIED" },
    };

    expect(isWalletUpdateRequiredError(error)).toBe(true);
    expect(getSummaryErrorMessage(error)).toBe(
      "Debes vincular tu wallet institucional.",
    );
  });

  it("mapea errores seguros de regularización", () => {
    expect(getRegularizationErrorMessage({ status: 409, data: {} })).toBe(
      "La wallet no está disponible para esta cuenta.",
    );
    expect(getRegularizationErrorMessage({ status: 503, data: {} })).toBe(
      "No pudimos validar la wallet. Intenta nuevamente.",
    );
  });
});

describe("admin TVD visual blockchain balance", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("VITE_TVD_CHAIN_ID", "84532");
    vi.stubEnv("VITE_TVD_CHAIN_RPC_URL", "https://rpc.example.test");
    vi.stubEnv(
      "VITE_TVD_TOKEN_ADDRESS",
      "0x1111111111111111111111111111111111111111",
    );
    vi.stubEnv("VITE_TVD_DECIMALS", "18");
  });

  it("lee balanceOf y assignedBalance para la wallet activa y suma con bigint", async () => {
    const { readTvdOnChainBalance } = await import(
      "@/features/adminTvd/services/tvdOnChainBalance"
    );
    viemMocks.readContract
      .mockResolvedValueOnce(80_000000000000000000n)
      .mockResolvedValueOnce(20_000000000000000000n);

    const balance = await readTvdOnChainBalance(
      "0x2222222222222222222222222222222222222222",
      "0x3333333333333333333333333333333333333333",
      84532,
    );

    expect(balance.liquidBalanceSmallestUnit).toBe("80000000000000000000");
    expect(balance.assignedBalanceSmallestUnit).toBe("20000000000000000000");
    expect(balance.totalBalanceSmallestUnit).toBe("100000000000000000000");
    expect(viemMocks.readContract).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        address: "0x1111111111111111111111111111111111111111",
        functionName: "balanceOf",
        args: ["0x2222222222222222222222222222222222222222"],
      }),
    );
    expect(viemMocks.readContract).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        address: "0x3333333333333333333333333333333333333333",
        functionName: "assignedBalance",
        args: ["0x2222222222222222222222222222222222222222"],
      }),
    );
  });

  it("rechaza configuración incompleta sin llamar RPC", async () => {
    vi.stubEnv("VITE_TVD_TOKEN_ADDRESS", "");
    const { readTvdOnChainBalance } = await import(
      "@/features/adminTvd/services/tvdOnChainBalance"
    );

    await expect(
      readTvdOnChainBalance(
        "0x2222222222222222222222222222222222222222",
        "0x3333333333333333333333333333333333333333",
        84532,
      ),
    ).rejects.toMatchObject({
      code: "TVD_VISUAL_BALANCE_CONFIG_INCOMPLETE",
    });
    expect(viemMocks.readContract).not.toHaveBeenCalled();
  });
});
