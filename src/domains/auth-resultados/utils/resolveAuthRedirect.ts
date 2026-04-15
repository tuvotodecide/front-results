import type { AuthState } from "@/store/auth/authSlice";
import { resolveDomainLogin } from "@/store/auth/contextUtils";

export const resolveAuthResultadosRedirect = (
  user: AuthState["user"],
  token: AuthState["token"],
  auth?: Partial<AuthState>,
) => {
  if (!user || !token) {
    return null;
  }

  const status = user.status ?? (user.active ? "ACTIVE" : "PENDING");

  if (status === "PENDING") {
    return "/resultados/pendiente";
  }

  if (status === "REJECTED" || status === "INACTIVE") {
    return "/resultados/rechazado";
  }

  const hasContextState = Boolean(
    (auth?.availableContexts?.length ?? 0) > 0 ||
      auth?.activeContext ||
      auth?.defaultContext,
  );

  if (hasContextState) {
    const result = resolveDomainLogin({
      user,
      role: auth?.role ?? user.role,
      availableContexts: auth?.availableContexts ?? [],
      defaultContext: auth?.defaultContext ?? null,
      activeContext: auth?.activeContext ?? null,
      accessStatus: auth?.accessStatus ?? null,
    }, "resultados");

    return result.kind === "allowed" ? result.redirectTo : null;
  }

  if (user.role === "publico") {
    return "/resultados";
  }

  if (user.role === "SUPERADMIN") {
    return "/resultados/panel";
  }

  if (user.role === "TENANT_ADMIN") {
    return null;
  }

  if (user.role === "MAYOR" && user.municipalityId) {
    return `/resultados?department=${user.departmentId}&municipality=${user.municipalityId}`;
  }

  if (user.role === "GOVERNOR" && user.departmentId) {
    return `/resultados?department=${user.departmentId}`;
  }

  return null;
};
