type RuntimeEnvMap = Record<string, string | undefined>;

const viteEnv: RuntimeEnvMap | undefined =
  typeof import.meta !== "undefined"
    ? ((import.meta as ImportMeta & { env?: RuntimeEnvMap }).env ?? undefined)
    : undefined;

const processEnv: RuntimeEnvMap | undefined =
  typeof process !== "undefined" ? (process.env as RuntimeEnvMap) : undefined;

const getStaticNextPublicEnv = (key: string): string | undefined => {
  switch (key) {
    case "NEXT_PUBLIC_BASE_API_URL":
      return process.env.NEXT_PUBLIC_BASE_API_URL;
    case "NEXT_PUBLIC_APP_MODE":
      return process.env.NEXT_PUBLIC_APP_MODE;
    case "NEXT_PUBLIC_BASE_NFT_URL":
      return process.env.NEXT_PUBLIC_BASE_NFT_URL;
    case "NEXT_PUBLIC_VOTE_CHAIN_ID":
      return process.env.NEXT_PUBLIC_VOTE_CHAIN_ID;
    case "NEXT_PUBLIC_VOTE_CHAIN_NAME":
      return process.env.NEXT_PUBLIC_VOTE_CHAIN_NAME;
    case "NEXT_PUBLIC_VOTE_CHAIN_RPC_URL":
      return process.env.NEXT_PUBLIC_VOTE_CHAIN_RPC_URL;
    case "NEXT_PUBLIC_VOTE_CHAIN_BLOCK_EXPLORER_URL":
      return process.env.NEXT_PUBLIC_VOTE_CHAIN_BLOCK_EXPLORER_URL;
    case "NEXT_PUBLIC_VOTE_CHAIN_CURRENCY_NAME":
      return process.env.NEXT_PUBLIC_VOTE_CHAIN_CURRENCY_NAME;
    case "NEXT_PUBLIC_VOTE_CHAIN_CURRENCY_SYMBOL":
      return process.env.NEXT_PUBLIC_VOTE_CHAIN_CURRENCY_SYMBOL;
    case "NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS":
      return process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS;
    default:
      return undefined;
  }
};

export const getRuntimeEnv = (
  viteKey: string,
  nextPublicKey?: string,
): string | undefined => {
  return (
    viteEnv?.[viteKey] ??
    (nextPublicKey ? getStaticNextPublicEnv(nextPublicKey) : undefined) ??
    (nextPublicKey ? processEnv?.[nextPublicKey] : undefined) ??
    processEnv?.[viteKey]
  );
};
