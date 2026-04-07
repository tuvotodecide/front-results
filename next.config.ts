import type { NextConfig } from "next";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getApiProxyTarget = (): string | null => {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_BASE_API_URL ?? process.env.VITE_BASE_API_URL;

  if (!configuredBaseUrl) {
    return null;
  }

  const normalizedBaseUrl = trimTrailingSlash(configuredBaseUrl);
  return normalizedBaseUrl.replace(/\/api(?:\/v\d+)?$/, "");
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiProxyTarget = getApiProxyTarget();

    if (!apiProxyTarget) {
      return [];
    }

    return [
      {
        // Keep compatibility with the old Vite /api proxy for browser calls.
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
