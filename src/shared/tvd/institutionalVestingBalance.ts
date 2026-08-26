import { Contract, JsonRpcProvider, isAddress } from "ethers";
import { getTvdServerBlockchainConfig } from "./tvdBlockchainConfig";
import { formatTvdAmount, ZERO_ADDRESS } from "./tvdBlockchainFormatters";

const TOKEN_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export type InstitutionalVestingBalanceRead = {
  /** Saldo crudo del vesting institucional, en la unidad más pequeña del token TVD. */
  raw: string;
  decimals: number;
  /** Saldo legible con sufijo, ej. "12345.67 TVD". */
  formatted: string;
  readAt: string;
};

export class InstitutionalVestingBalanceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "TVD_TOKEN_ADDRESS_MISSING"
      | "INSTITUTIONAL_VESTING_ADDRESS_MISSING"
      | "TVD_RPC_UNAVAILABLE",
  ) {
    super(message);
    this.name = "InstitutionalVestingBalanceError";
  }
}

const getServerAddress = (key: string) => {
  const configured = String(
    typeof process !== "undefined" ? process.env[key] ?? "" : "",
  ).trim();
  if (!configured || !isAddress(configured)) return null;
  return configured.toLowerCase() === ZERO_ADDRESS ? null : configured;
};

/**
 * Lee `balanceOf(INSTITUTIONAL_VESTING_ADDRESS)` en el contrato TVD_TOKEN_ADDRESS.
 *
 * Sólo puede ejecutarse en servidor: ambas direcciones y el RPC no están
 * expuestas al navegador. Los componentes cliente la consumen a través de
 * `/api/tvd/institutional-vesting-balance`.
 */
export const readInstitutionalVestingBalance =
  async (): Promise<InstitutionalVestingBalanceRead> => {
    const tokenAddress = getServerAddress("TVD_TOKEN_ADDRESS");
    if (!tokenAddress) {
      throw new InstitutionalVestingBalanceError(
        "La dirección del token TVD no está configurada.",
        "TVD_TOKEN_ADDRESS_MISSING",
      );
    }

    const vestingAddress = getServerAddress("INSTITUTIONAL_VESTING_ADDRESS");
    if (!vestingAddress) {
      throw new InstitutionalVestingBalanceError(
        "La dirección del vesting institucional no está configurada.",
        "INSTITUTIONAL_VESTING_ADDRESS_MISSING",
      );
    }

    const { rpcUrl, expectedChainId } = getTvdServerBlockchainConfig();
    if (!rpcUrl) {
      throw new InstitutionalVestingBalanceError(
        "No hay un RPC configurado para leer la blockchain.",
        "TVD_RPC_UNAVAILABLE",
      );
    }

    try {
      const provider = new JsonRpcProvider(rpcUrl, expectedChainId ?? undefined, {
        staticNetwork: true,
      });
      const contract = new Contract(tokenAddress, TOKEN_ABI, provider);
      const [raw, decimalsRaw]: [bigint, bigint] = await Promise.all([
        contract.balanceOf(vestingAddress),
        contract.decimals(),
      ]);

      if (typeof raw !== "bigint" || raw < 0n) {
        throw new Error("balanceOf devolvió un valor inválido");
      }
      const decimals = Number(decimalsRaw);
      if (!Number.isSafeInteger(decimals) || decimals < 0 || decimals > 36) {
        throw new Error("decimals devolvió un valor inválido");
      }

      return {
        raw: raw.toString(),
        decimals,
        formatted: formatTvdAmount(raw, decimals),
        readAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof InstitutionalVestingBalanceError) throw error;
      throw new InstitutionalVestingBalanceError(
        "No se pudo leer el saldo del vesting institucional desde la blockchain.",
        "TVD_RPC_UNAVAILABLE",
      );
    }
  };
