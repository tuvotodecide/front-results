type EnvSource = Record<string, string | undefined>;
type AppMode = "results" | "voting";

const normalizeEnvValue = (value?: string) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const readViteEnv = (): EnvSource => {
  try {
    return Function("return import.meta.env ?? {}")() as EnvSource;
  } catch {
    return {} as EnvSource;
  }
};

const viteEnv = readViteEnv();
const nextEnv: EnvSource =
  typeof process !== "undefined" ? (process.env as EnvSource) : {};

const readEnv = (key: string) => normalizeEnvValue(nextEnv[key] ?? viteEnv[key]);

const readAppMode = (): AppMode => {
  const value = String(readEnv("NEXT_PUBLIC_APP_MODE") ?? readEnv("VITE_APP_MODE") ?? "voting")
    .toLowerCase();
  return value === "results" ? "results" : "voting";
};

const readBaseApiUrl = () =>
  (readEnv("NEXT_PUBLIC_BASE_API_URL") ??
    readEnv("VITE_BASE_API_URL") ??
    "http://localhost:3000/api/v1")!.replace(/\/+$/, "");

export const publicEnv = {
  appMode: readAppMode(),
  baseApiUrl: readBaseApiUrl(),
  baseNftUrl:
    readEnv("NEXT_PUBLIC_BASE_NFT_URL") ??
    readEnv("VITE_BASE_NFT_URL") ??
    "",
  voteContractAddress:
    readEnv("NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS") ??
    readEnv("VITE_VOTE_CONTRACT_ADDRESS") ??
    "",
  voteChainId:
    readEnv("NEXT_PUBLIC_VOTE_CHAIN_ID") ??
    readEnv("VITE_VOTE_CHAIN_ID") ??
    "",
  voteChainName:
    readEnv("NEXT_PUBLIC_VOTE_CHAIN_NAME") ??
    readEnv("VITE_VOTE_CHAIN_NAME") ??
    "",
  voteChainRpcUrl:
    readEnv("NEXT_PUBLIC_VOTE_CHAIN_RPC_URL") ??
    readEnv("VITE_VOTE_CHAIN_RPC_URL") ??
    "",
  voteChainBlockExplorerUrl:
    readEnv("NEXT_PUBLIC_VOTE_CHAIN_BLOCK_EXPLORER_URL") ??
    readEnv("VITE_VOTE_CHAIN_BLOCK_EXPLORER_URL") ??
    "",
  voteChainCurrencyName:
    readEnv("NEXT_PUBLIC_VOTE_CHAIN_CURRENCY_NAME") ??
    readEnv("VITE_VOTE_CHAIN_CURRENCY_NAME") ??
    "",
  voteChainCurrencySymbol:
    readEnv("NEXT_PUBLIC_VOTE_CHAIN_CURRENCY_SYMBOL") ??
    readEnv("VITE_VOTE_CHAIN_CURRENCY_SYMBOL") ??
    "",
} as const;
