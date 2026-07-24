import {
  createPublicClient,
  formatUnits,
  getAddress,
  http,
  isAddress,
  zeroAddress,
} from "viem";
import type { Address } from "viem";
import { getRuntimeEnv } from "@/shared/system/runtimeEnv";

const tokenAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const assignmentAbi = [
  {
    type: "function",
    name: "assignedBalance",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export type TvdOnChainBalanceConfig = {
  chainId: number;
  rpcUrl: string;
  tokenAddress: Address;
  assignmentContractAddress: Address;
  decimals: number;
};

export type TvdOnChainBalance = {
  wallet: Address;
  chainId: number;
  tokenAddress: Address;
  assignmentContractAddress: Address;
  decimals: number;
  liquidBalanceSmallestUnit: string;
  assignedBalanceSmallestUnit: string;
  totalBalanceSmallestUnit: string;
  liquidBalanceFormatted: string;
  assignedBalanceFormatted: string;
  totalBalanceFormatted: string;
  readAt: string;
};

export class TvdVisualBalanceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "TVD_VISUAL_BALANCE_CONFIG_INCOMPLETE"
      | "TVD_VISUAL_BALANCE_INVALID_WALLET"
      | "TVD_VISUAL_BALANCE_RPC_UNAVAILABLE",
  ) {
    super(message);
    this.name = "TvdVisualBalanceError";
  }
}

const parsePositiveInteger = (value: string | undefined): number | null => {
  const normalized = String(value ?? "").trim();
  if (!/^[1-9]\d*$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

const parseNonNegativeInteger = (value: string | undefined): number | null => {
  const normalized = String(value ?? "").trim();
  if (!/^(?:0|[1-9]\d*)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed <= 36 ? parsed : null;
};

const parseAddress = (value: string | null | undefined): Address | null => {
  const normalized = String(value ?? "").trim();
  if (!isAddress(normalized)) return null;
  const address = getAddress(normalized);
  return address === zeroAddress ? null : address;
};

export const getTvdOnChainBalanceConfig = (
  assignmentContractAddress?: string | null,
  chainIdOverride?: number | null,
): TvdOnChainBalanceConfig => {
  const rpcUrl = String(
    getRuntimeEnv("VITE_TVD_CHAIN_RPC_URL", "NEXT_PUBLIC_TVD_CHAIN_RPC_URL") ??
      "",
  ).trim();
  const chainId =
    chainIdOverride ??
    parsePositiveInteger(
      getRuntimeEnv("VITE_TVD_CHAIN_ID", "NEXT_PUBLIC_TVD_CHAIN_ID"),
    );
  const tokenAddress = parseAddress(
    getRuntimeEnv("VITE_TVD_TOKEN_ADDRESS", "NEXT_PUBLIC_TVD_TOKEN_ADDRESS"),
  );
  const assignmentAddress = parseAddress(
    assignmentContractAddress ??
      getRuntimeEnv(
        "VITE_TVD_ASSIGNMENT_CONTRACT_ADDRESS",
        "NEXT_PUBLIC_TVD_ASSIGNMENT_CONTRACT_ADDRESS",
      ),
  );
  const decimals = parseNonNegativeInteger(
    getRuntimeEnv("VITE_TVD_DECIMALS", "NEXT_PUBLIC_TVD_DECIMALS"),
  );

  if (!rpcUrl || !chainId || !tokenAddress || !assignmentAddress || decimals === null) {
    throw new TvdVisualBalanceError(
      "La lectura visual de TVD no está configurada.",
      "TVD_VISUAL_BALANCE_CONFIG_INCOMPLETE",
    );
  }

  return {
    chainId,
    rpcUrl,
    tokenAddress,
    assignmentContractAddress: assignmentAddress,
    decimals,
  };
};

export const readTvdOnChainBalance = async (
  walletAddress: string,
  assignmentContractAddress?: string | null,
  chainIdOverride?: number | null,
): Promise<TvdOnChainBalance> => {
  const wallet = parseAddress(walletAddress);
  if (!wallet) {
    throw new TvdVisualBalanceError(
      "La wallet institucional no es válida.",
      "TVD_VISUAL_BALANCE_INVALID_WALLET",
    );
  }

  const config = getTvdOnChainBalanceConfig(
    assignmentContractAddress,
    chainIdOverride,
  );
  const client = createPublicClient({
    chain: {
      id: config.chainId,
      name: `TVD ${config.chainId}`,
      nativeCurrency: {
        name: "Native",
        symbol: "NATIVE",
        decimals: 18,
      },
      rpcUrls: {
        default: { http: [config.rpcUrl] },
      },
    },
    transport: http(config.rpcUrl),
  });

  try {
    const [liquidBalance, assignedBalance] = await Promise.all([
      client.readContract({
        address: config.tokenAddress,
        abi: tokenAbi,
        functionName: "balanceOf",
        args: [wallet],
      }),
      client.readContract({
        address: config.assignmentContractAddress,
        abi: assignmentAbi,
        functionName: "assignedBalance",
        args: [wallet],
      }),
    ]);
    const totalBalance = liquidBalance + assignedBalance;

    return {
      wallet,
      chainId: config.chainId,
      tokenAddress: config.tokenAddress,
      assignmentContractAddress: config.assignmentContractAddress,
      decimals: config.decimals,
      liquidBalanceSmallestUnit: liquidBalance.toString(),
      assignedBalanceSmallestUnit: assignedBalance.toString(),
      totalBalanceSmallestUnit: totalBalance.toString(),
      liquidBalanceFormatted: formatUnits(liquidBalance, config.decimals),
      assignedBalanceFormatted: formatUnits(assignedBalance, config.decimals),
      totalBalanceFormatted: formatUnits(totalBalance, config.decimals),
      readAt: new Date().toISOString(),
    };
  } catch {
    throw new TvdVisualBalanceError(
      "No pudimos consultar el saldo actual.",
      "TVD_VISUAL_BALANCE_RPC_UNAVAILABLE",
    );
  }
};
