import { Contract, JsonRpcProvider, isAddress } from "ethers";
import { getTvdServerBlockchainConfig } from "./tvdBlockchainConfig";
import { formatTvdAmount, ZERO_ADDRESS } from "./tvdBlockchainFormatters";

// tvdPerCredit() devuelve el costo de 1 crédito (1 participante) en TVD,
// expresado siempre con 18 decimales.
const ELECTORAL_CREDITS_ABI = ["function tvdPerCredit() view returns (uint256)"];

export const TVD_PER_CREDIT_DECIMALS = 18;

export type TvdPerCreditRead = {
  /** Valor crudo en la unidad más pequeña (18 decimales). */
  raw: string;
  decimals: number;
  /** Valor legible con sufijo, ej. "1 TVD". */
  formatted: string;
  readAt: string;
};

export class ElectoralCreditsRateError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "ELECTORAL_CREDITS_ADDRESS_MISSING"
      | "ELECTORAL_CREDITS_RPC_UNAVAILABLE",
  ) {
    super(message);
    this.name = "ElectoralCreditsRateError";
  }
}

const getElectoralCreditsAddress = () => {
  const configured = String(
    typeof process !== "undefined"
      ? process.env.ELECTORAL_CREDITS_ADDRESS ?? ""
      : "",
  ).trim();

  if (!configured || !isAddress(configured)) return null;
  return configured.toLowerCase() === ZERO_ADDRESS ? null : configured;
};

/**
 * Lee `tvdPerCredit()` del contrato de créditos electorales.
 *
 * Sólo puede ejecutarse en servidor: `ELECTORAL_CREDITS_ADDRESS` y `TVD_RPC_URL`
 * no están expuestas al navegador. Los componentes cliente la consumen a través
 * de `/api/tvd/tvd-per-credit`.
 */
export const readTvdPerCredit = async (): Promise<TvdPerCreditRead> => {
  const address = getElectoralCreditsAddress();
  if (!address) {
    throw new ElectoralCreditsRateError(
      "La dirección del contrato de créditos electorales no está configurada.",
      "ELECTORAL_CREDITS_ADDRESS_MISSING",
    );
  }

  const { rpcUrl, expectedChainId } = getTvdServerBlockchainConfig();
  if (!rpcUrl) {
    throw new ElectoralCreditsRateError(
      "No hay un RPC configurado para leer la blockchain.",
      "ELECTORAL_CREDITS_RPC_UNAVAILABLE",
    );
  }

  try {
    const provider = new JsonRpcProvider(
      rpcUrl,
      expectedChainId ?? undefined,
      { staticNetwork: true },
    );
    const contract = new Contract(address, ELECTORAL_CREDITS_ABI, provider);
    const raw: bigint = await contract.tvdPerCredit();

    if (typeof raw !== "bigint" || raw < 0n) {
      throw new Error("tvdPerCredit devolvió un valor inválido");
    }

    return {
      raw: raw.toString(),
      decimals: TVD_PER_CREDIT_DECIMALS,
      formatted: formatTvdAmount(raw, TVD_PER_CREDIT_DECIMALS),
      readAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof ElectoralCreditsRateError) throw error;
    throw new ElectoralCreditsRateError(
      "No se pudo leer el costo por participante desde la blockchain.",
      "ELECTORAL_CREDITS_RPC_UNAVAILABLE",
    );
  }
};
