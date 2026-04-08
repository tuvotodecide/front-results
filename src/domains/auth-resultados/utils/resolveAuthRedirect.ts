import type { AuthState } from "@/store/auth/authSlice";

export const resolveAuthResultadosRedirect = (
  user: AuthState["user"],
  token: AuthState["token"],
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

  if (user.role === "publico") {
    return "/resultados";
  }

  if (user.role === "TENANT_ADMIN" || user.role === "SUPERADMIN") {
    return "/votacion/elecciones";
  }

  if (user.role === "MAYOR" && user.municipalityId) {
    return `/resultados?department=${user.departmentId}&municipality=${user.municipalityId}`;
  }

  if (user.role === "GOVERNOR" && user.departmentId) {
    return `/resultados?department=${user.departmentId}`;
  }

  return "/resultados";
};
