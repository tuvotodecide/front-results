import type { AuthState } from "@/store/auth/authSlice";
import { resolveDomainLogin } from "@/store/auth/contextUtils";

export const resolveAuthVotacionRedirect = (
  user: AuthState["user"],
  token: AuthState["token"],
  auth?: Partial<AuthState>,
) => {
  if (!user || !token) {
    return null;
  }

  const status = user.status ?? (user.active ? "ACTIVE" : "PENDING");

  if (status === "PENDING") {
    return "/votacion/pendiente";
  }

  if (status === "REJECTED" || status === "INACTIVE") {
    return "/votacion/rechazado";
  }

  const hasContextState = Boolean(
    (auth?.availableContexts?.length ?? 0) > 0 ||
      auth?.activeContext ||
      auth?.defaultContext,
  );

  if (hasContextState) {
    const result = resolveDomainLogin({
      availableContexts: auth?.availableContexts ?? [],
      defaultContext: auth?.defaultContext ?? null,
      activeContext: auth?.activeContext ?? null,
      accessStatus: auth?.accessStatus ?? null,
    }, "votacion");

    return result.kind === "allowed" ? result.redirectTo : null;
  }

  if (user.role === "publico") {
    return "/votacion";
  }

  if (user.role === "TENANT_ADMIN" || user.role === "SUPERADMIN") {
    return "/votacion/elecciones";
  }

  if (user.role === "MAYOR" || user.role === "GOVERNOR") {
    return null;
  }

  return null;
};
