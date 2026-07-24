import type { TvdNetworkInfo } from "./superadminTvdTypes";
import { getKnownBaseNetwork, parseSafePositiveInteger } from "./tvdBlockchainFormatters";
import { getRuntimeEnv } from "@/shared/system/runtimeEnv";

export type TvdBlockchainReadConfig = TvdNetworkInfo & {
  rpcUrl: string | null;
  expectedChainId: number | null;
  issues: string[];
};

const readPublicEnv = (viteKey: string, nextPublicKey: string) =>
  String(getRuntimeEnv(viteKey, nextPublicKey) ?? "").trim();

export const getTvdBlockchainReadConfig = (): TvdBlockchainReadConfig => {
  const chainId = parseSafePositiveInteger(
    readPublicEnv("VITE_TVD_CHAIN_ID", "NEXT_PUBLIC_TVD_CHAIN_ID"),
  );
  const knownNetwork = getKnownBaseNetwork(chainId);
  const configuredName = readPublicEnv(
    "VITE_TVD_NETWORK_NAME",
    "NEXT_PUBLIC_TVD_NETWORK_NAME",
  );
  const configuredExplorer = readPublicEnv(
    "VITE_TVD_BLOCK_EXPLORER_URL",
    "NEXT_PUBLIC_TVD_BLOCK_EXPLORER_URL",
  );

  return {
    chainId,
    expectedChainId: chainId,
    name: configuredName || knownNetwork.name,
    explorerBaseUrl: configuredExplorer || knownNetwork.explorerBaseUrl,
    rpcUrl: readPublicEnv("VITE_TVD_CHAIN_RPC_URL", "NEXT_PUBLIC_TVD_CHAIN_RPC_URL") || null,
    issues: [],
  };
};

const serverEnv = (key: string) =>
  typeof process !== "undefined" ? String(process.env[key] ?? "").trim() : "";

const isProductionRuntime = () =>
  serverEnv("NODE_ENV") === "production" ||
  serverEnv("VERCEL_ENV") === "production" ||
  serverEnv("NEXT_PUBLIC_VERCEL_ENV") === "production";

export const getTvdServerBlockchainConfig = (): TvdBlockchainReadConfig => {
  const configuredChainId = parseSafePositiveInteger(serverEnv("TVD_CHAIN_ID"));
  const chainId = configuredChainId ?? (isProductionRuntime() ? 8453 : 84532);
  const knownNetwork = getKnownBaseNetwork(chainId);
  const configuredName = serverEnv("TVD_NETWORK_NAME");
  const configuredExplorer = serverEnv("TVD_BLOCK_EXPLORER_URL");
  const configuredRpc = serverEnv("TVD_RPC_URL");

  return {
    chainId,
    expectedChainId: chainId,
    name: configuredName || knownNetwork.name,
    explorerBaseUrl: configuredExplorer || knownNetwork.explorerBaseUrl,
    rpcUrl:
      configuredRpc ||
      (chainId === 8453 ? "https://base.drpc.org" : "https://base-sepolia.drpc.org"),
    issues: configuredChainId ? [] : ["TVD_CHAIN_ID"],
  };
};
