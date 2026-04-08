import type { AuthState } from "@/store/auth/authSlice";

export const resolveAuthVotacionRedirect = (
  user: AuthState["user"],
  token: AuthState["token"],
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

  if (user.role === "publico") {
    return "/votacion";
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
