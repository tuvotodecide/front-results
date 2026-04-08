type RuntimeEnvMap = Record<string, string | undefined>;

const viteEnv: RuntimeEnvMap | undefined =
  typeof import.meta !== "undefined"
    ? ((import.meta as ImportMeta & { env?: RuntimeEnvMap }).env ?? undefined)
    : undefined;

const processEnv: RuntimeEnvMap | undefined =
  typeof process !== "undefined" ? (process.env as RuntimeEnvMap) : undefined;

export const getRuntimeEnv = (
  viteKey: string,
  nextPublicKey?: string,
): string | undefined => {
  return (
    viteEnv?.[viteKey] ??
    (nextPublicKey ? processEnv?.[nextPublicKey] : undefined) ??
    processEnv?.[viteKey]
  );
};
