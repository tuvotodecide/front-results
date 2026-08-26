import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const balanceOf = vi.fn();
const decimals = vi.fn();
const contractArgs: unknown[][] = [];

// Sólo se sustituye el acceso a la red: formatUnits e isAddress siguen siendo
// los reales para no validar direcciones ni montos contra una imitación.
vi.mock("ethers", async (importActual) => {
  const actual = await importActual<typeof import("ethers")>();
  return {
    ...actual,
    JsonRpcProvider: class {},
    Contract: class {
      balanceOf = balanceOf;
      decimals = decimals;
      constructor(...args: unknown[]) {
        contractArgs.push(args);
      }
    },
  };
});

const {
  InstitutionalVestingBalanceError,
  readInstitutionalVestingBalance,
} = await import("@/shared/tvd/institutionalVestingBalance");

const TOKEN_ADDRESS = "0x0156D96BAbC74139a5cdb2cf2C90FDA1F6B53562";
const VESTING_ADDRESS = "0x334cD0dEA742eb3610F9Da2CA290464D3C4b00d2";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("saldo TVD del vesting institucional", () => {
  beforeEach(() => {
    contractArgs.length = 0;
    balanceOf.mockReset().mockResolvedValue(1000n * 10n ** 18n);
    decimals.mockReset().mockResolvedValue(18n);
    vi.stubEnv("TVD_TOKEN_ADDRESS", TOKEN_ADDRESS);
    vi.stubEnv("INSTITUTIONAL_VESTING_ADDRESS", VESTING_ADDRESS);
    vi.stubEnv("TVD_RPC_URL", "https://rpc.example/base-sepolia");
    vi.stubEnv("TVD_CHAIN_ID", "84532");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("[MX-06][TVD-QR-P0-011][UNITARIA] lee balanceOf del vesting sobre el contrato TVD", async () => {
    await expect(readInstitutionalVestingBalance()).resolves.toMatchObject({
      raw: "1000000000000000000000",
      decimals: 18,
      formatted: "1000 TVD",
    });

    // El balance se consulta sobre el token, preguntando por el vesting.
    expect(contractArgs[0]?.[0]).toBe(TOKEN_ADDRESS);
    expect(balanceOf).toHaveBeenCalledWith(VESTING_ADDRESS);
  });

  it("[MX-06][TVD-QR-P0-011][UNITARIA] exige ambas direcciones configuradas y descarta la dirección cero", async () => {
    vi.stubEnv("TVD_TOKEN_ADDRESS", "");
    await expect(readInstitutionalVestingBalance()).rejects.toMatchObject({
      code: "TVD_TOKEN_ADDRESS_MISSING",
    });

    vi.stubEnv("TVD_TOKEN_ADDRESS", "no-es-una-direccion");
    await expect(readInstitutionalVestingBalance()).rejects.toMatchObject({
      code: "TVD_TOKEN_ADDRESS_MISSING",
    });

    vi.stubEnv("TVD_TOKEN_ADDRESS", TOKEN_ADDRESS);
    vi.stubEnv("INSTITUTIONAL_VESTING_ADDRESS", ZERO_ADDRESS);
    await expect(readInstitutionalVestingBalance()).rejects.toMatchObject({
      code: "INSTITUTIONAL_VESTING_ADDRESS_MISSING",
    });

    expect(balanceOf).not.toHaveBeenCalled();
  });

  it("[MX-06][TVD-QR-P0-011][UNITARIA] no inventa un techo cuando la lectura on-chain falla", async () => {
    balanceOf.mockRejectedValue(new Error("network"));

    const error = await readInstitutionalVestingBalance().catch((caught) => caught);
    expect(error).toBeInstanceOf(InstitutionalVestingBalanceError);
    expect(error).toMatchObject({ code: "TVD_RPC_UNAVAILABLE" });

    // Unos decimales absurdos tampoco pueden producir un saldo utilizable.
    balanceOf.mockResolvedValue(1000n * 10n ** 18n);
    decimals.mockResolvedValue(99n);
    await expect(readInstitutionalVestingBalance()).rejects.toMatchObject({
      code: "TVD_RPC_UNAVAILABLE",
    });
  });
});
