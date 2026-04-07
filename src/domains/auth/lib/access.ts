import type { AuthState } from "@/store/auth/authSlice";
import type { AppMode } from "@/config/appMode";

export type AccessStatus = "ACTIVE" | "PENDING" | "REJECTED" | "INACTIVE";

export const getAccessStatus = (user: AuthState["user"]): AccessStatus => {
  if (!user) return "INACTIVE";
  return user.status ?? (user.active ? "ACTIVE" : "PENDING");
};

export const buildPathWithSearch = (pathname: string, search?: string) => {
  if (!search) return pathname;
  return `${pathname}${search.startsWith("?") ? search : `?${search}`}`;
};

export const buildLoginHref = (from?: string | null) => {
  if (!from) return "/login";
  return `/login?from=${encodeURIComponent(from)}`;
};

export const resolveAuthenticatedDestination = ({
  user,
  appMode,
  from,
}: {
  user: NonNullable<AuthState["user"]>;
  appMode: AppMode;
  from?: string | null;
}) => {
  const status = getAccessStatus(user);

  if (status === "PENDING") return "/pendiente";
  if (status === "REJECTED" || status === "INACTIVE") return "/rechazado";

  if (appMode === "results" && from && from !== "/login") {
    return from;
  }

  if (user.role === "publico") return "/";
  if (user.role === "TENANT_ADMIN") return "/elections";
  if (user.role === "MAYOR" && user.municipalityId) {
    return `/resultados?department=${user.departmentId ?? ""}&municipality=${user.municipalityId}`;
  }
  if (user.role === "GOVERNOR" && user.departmentId) {
    return `/resultados?department=${user.departmentId}`;
  }
  if (user.role === "SUPERADMIN") {
    return "/elections";
  }

  return "/resultados";
};

export const resolveProtectedDomainRedirect = ({
  pathname,
  search,
  auth,
}: {
  pathname: string;
  search: string;
  auth: Pick<AuthState, "user" | "token">;
}) => {
  const { user, token } = auth;
  const from = buildPathWithSearch(pathname, search);

  if (!user || !token) {
    return buildLoginHref(from);
  }

  const status = getAccessStatus(user);
  if (status === "PENDING") return "/pendiente";
  if (status === "REJECTED" || status === "INACTIVE") return "/rechazado";

  return null;
};
