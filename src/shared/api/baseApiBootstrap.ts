import { getRuntimeEnv } from "../system/runtimeEnv";

export type DomainKey = "resultados" | "votacion";

export interface DomainApiBootstrapConfig {
  domain: DomainKey;
  canonicalBasePath: string;
  canonicalLoginPath: string;
  legacyLoginPath: string;
  canonicalHomePath: string;
}

export interface DomainApiBootstrap extends DomainApiBootstrapConfig {
  baseApiUrl: string;
}

export const getBaseApiUrl = () =>
  getRuntimeEnv("VITE_BASE_API_URL", "NEXT_PUBLIC_BASE_API_URL") ||
  "http://localhost:3000/api/v1";

export const createDomainApiBootstrap = (
  config: DomainApiBootstrapConfig,
): DomainApiBootstrap => ({
  ...config,
  baseApiUrl: getBaseApiUrl(),
});
