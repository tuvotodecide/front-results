import { getRuntimeEnv } from "../shared/system/runtimeEnv";

const DEFAULT_IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

const normalizeGateway = (gateway: string) =>
  gateway.endsWith("/") ? gateway : `${gateway}/`;

export const getIpfsGateway = () =>
  normalizeGateway(
    getRuntimeEnv("VITE_IPFS_GATEWAY_URL", "NEXT_PUBLIC_IPFS_GATEWAY_URL") ||
      DEFAULT_IPFS_GATEWAY,
  );

/**
 * Convierte un URI `ipfs://<cid>` (o un CID suelto) en una URL HTTP
 * usando el gateway configurado en NEXT_PUBLIC_IPFS_GATEWAY_URL.
 */
export const toIpfsGatewayUrl = (uriOrCid: string) =>
  `${getIpfsGateway()}${uriOrCid.replace(/^ipfs:\/\//, "")}`;
