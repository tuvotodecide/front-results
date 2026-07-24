import { formatUnits } from "ethers";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const truncateAddress = (value?: string | null) => {
  if (!value) return "No configurado";
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

export const buildExplorerAddressUrl = (
  explorerBaseUrl: string | null | undefined,
  address: string | null | undefined,
) => {
  if (!explorerBaseUrl || !address) return null;
  return `${explorerBaseUrl.replace(/\/$/, "")}/address/${address}`;
};

export const buildExplorerTxUrl = (
  explorerBaseUrl: string | null | undefined,
  txHash: string | null | undefined,
) => {
  if (!explorerBaseUrl || !txHash) return null;
  return `${explorerBaseUrl.replace(/\/$/, "")}/tx/${txHash}`;
};

export const getKnownBaseNetwork = (chainId: number | null) => {
  if (chainId === 8453) {
    return {
      name: "Base",
      explorerBaseUrl: "https://basescan.org",
    };
  }
  if (chainId === 84532) {
    return {
      name: "Base Sepolia",
      explorerBaseUrl: "https://sepolia.basescan.org",
    };
  }
  return {
    name: chainId ? `Red ${chainId}` : "No configurada",
    explorerBaseUrl: null,
  };
};

export const parseSafePositiveInteger = (value?: string | null) => {
  const normalized = String(value ?? "").trim();
  if (!/^[1-9]\d*$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

export const formatTvdAmount = (
  rawValue: bigint,
  decimals: number,
  suffix = "TVD",
) => {
  const formatted = formatUnits(rawValue, decimals);
  const trimmed = formatted.includes(".")
    ? formatted.replace(/0+$/, "").replace(/\.$/, "")
    : formatted;
  return `${trimmed} ${suffix}`;
};

export const convertBurnBpsToPercentage = (burnBps: bigint) => {
  if (burnBps < 0n || burnBps > 1_000_000n) {
    throw new Error("BPS fuera de rango seguro");
  }
  const percentage = Number(burnBps) / 100;
  return Number.isInteger(percentage)
    ? `${percentage}%`
    : `${percentage.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;
};

export const isRewardEnabled = (rewardByVote: bigint) => rewardByVote > 0n;
