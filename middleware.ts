import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const AUTH_COOKIE_KEYS = {
  token: "tvd_auth_token",
  role: "tvd_auth_role",
  status: "tvd_auth_status",
  active: "tvd_auth_active",
} as const;

const resultadosAdminPaths = [
  "/panel",
  "/departamentos",
  "/provincias",
  "/municipios",
  "/asientos-electorales",
  "/recintos-electorales",
  "/mesas",
  "/configuraciones",
  "/partidos",
  "/partidos-politicos",
] as const;

const restrictedResultadosPaths = [
  "/control-personal",
  "/auditoria-tse",
] as const;

type SessionStatus = "ACTIVE" | "PENDING" | "REJECTED" | "INACTIVE";
type SessionRole =
  | "SUPERADMIN"
  | "MAYOR"
  | "GOVERNOR"
  | "TENANT_ADMIN"
  | "publico";

export const decodeJwtPayload = (token: string) => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const decoded = atob(padded);

    return JSON.parse(decoded) as {
      exp?: number;
      role?: string;
      active?: boolean;
    };
  } catch {
    return null;
  }
};

export const isExpired = (token: string | null) => {
  if (!token) return true;

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;

  return payload.exp * 1000 <= Date.now();
};

export const normalizeRole = (role: string | null | undefined): SessionRole => {
  const value = String(role ?? "").toUpperCase();

  if (value === "ALCALDE" || value === "MAYOR") return "MAYOR";
  if (value === "GOBERNADOR" || value === "GOVERNOR") return "GOVERNOR";
  if (value === "SUPERADMIN") return "SUPERADMIN";
  if (
    value === "ADMIN" ||
    value === "TENANT_ADMIN" ||
    value === "TENANTADMIN"
  ) {
    return "TENANT_ADMIN";
  }

  return "publico";
};

export const normalizeStatus = (
  status: string | null | undefined,
  active: string | null | undefined,
): SessionStatus => {
  const normalized = String(status ?? "").toUpperCase();

  if (
    normalized === "ACTIVE" ||
    normalized === "PENDING" ||
    normalized === "REJECTED" ||
    normalized === "INACTIVE"
  ) {
    return normalized;
  }

  return active === "true" ? "ACTIVE" : "PENDING";
};

export const hasPathPrefix = (pathname: string, basePath: string) =>
  pathname === basePath || pathname.startsWith(`${basePath}/`);

const redirectTo = (request: NextRequest, pathname: string) => {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
};

const redirectResultadosLogin = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = "/resultados/login";
  url.search = "";
  url.searchParams.set(
    "from",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(url);
};

export const getSession = (request: NextRequest) => {
  const token = request.cookies.get(AUTH_COOKIE_KEYS.token)?.value ?? null;

  if (!token || isExpired(token)) {
    return null;
  }

  return {
    token,
    role: normalizeRole(
      request.cookies.get(AUTH_COOKIE_KEYS.role)?.value ??
        decodeJwtPayload(token)?.role,
    ),
    status: normalizeStatus(
      request.cookies.get(AUTH_COOKIE_KEYS.status)?.value,
      request.cookies.get(AUTH_COOKIE_KEYS.active)?.value ??
        String(decodeJwtPayload(token)?.active ?? false),
    ),
  };
};

export const handleResultadosAccess = (request: NextRequest) => {
  const session = getSession(request);

  if (!session) {
    return redirectResultadosLogin(request);
  }

  if (session.status === "PENDING") {
    return redirectTo(request, "/resultados/pendiente");
  }

  if (
    session.status === "REJECTED" ||
    session.status === "INACTIVE"
  ) {
    return redirectTo(request, "/resultados/rechazado");
  }

  const normalizedPathname =
    request.nextUrl.pathname.slice("/resultados".length) || "/";
  const isAdminPath = resultadosAdminPaths.some((path) =>
    hasPathPrefix(normalizedPathname, path),
  );
  const allowedForRestricted = restrictedResultadosPaths.some((path) =>
    hasPathPrefix(normalizedPathname, path),
  );

  if (isAdminPath && session.role !== "SUPERADMIN") {
    return redirectTo(request, "/resultados");
  }

  if (
    (session.role === "MAYOR" || session.role === "GOVERNOR") &&
    !allowedForRestricted
  ) {
    return redirectTo(request, "/resultados");
  }

  return NextResponse.next();
};

export const handleVotacionAccess = (request: NextRequest) => {
  const session = getSession(request);

  if (!session) {
    return redirectTo(request, "/votacion/login");
  }

  if (session.status === "PENDING") {
    return redirectTo(request, "/votacion/pendiente");
  }

  if (
    session.status === "REJECTED" ||
    session.status === "INACTIVE"
  ) {
    return redirectTo(request, "/votacion/rechazado");
  }

  if (
    session.role !== "TENANT_ADMIN" &&
    session.role !== "SUPERADMIN"
  ) {
    return redirectTo(request, "/");
  }

  return NextResponse.next();
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/resultados/")) {
    return handleResultadosAccess(request);
  }

  return handleVotacionAccess(request);
}

export const config = {
  matcher: [
    "/resultados/control-personal/:path*",
    "/resultados/auditoria-tse/:path*",
    "/resultados/panel/:path*",
    "/resultados/departamentos/:path*",
    "/resultados/provincias/:path*",
    "/resultados/municipios/:path*",
    "/resultados/asientos-electorales/:path*",
    "/resultados/recintos-electorales/:path*",
    "/resultados/mesas/:path*",
    "/resultados/configuraciones/:path*",
    "/resultados/partidos/:path*",
    "/resultados/partidos-politicos/:path*",
    "/votacion/elecciones",
    "/votacion/elecciones/new",
    "/votacion/elecciones/:electionId/config/:path*",
    "/votacion/elecciones/:electionId/status",
  ],
};
