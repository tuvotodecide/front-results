import { selectAuth } from "../store/auth/authSlice";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getRoleConfig } from "../config/rolePermissions";

export default function ProtectedRoutes() {
  const { user } = useSelector(selectAuth);
  const location = useLocation();

  if (!user) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/login" state={{ from }} replace />;
  }
  const status = user.status ?? (user.active ? "ACTIVE" : "PENDING");

  if (status === "PENDING") {
    return <Navigate to="/pendiente" replace />;
  }

  if (status === "REJECTED" || status === "INACTIVE") {
    return <Navigate to="/rechazado" replace />;
  }

  const roleConfig = getRoleConfig(user.role);

  // Si tiene "*" en allowedPaths, tiene acceso total (ej. SUPERADMIN)
  const hasFullAccess = roleConfig.allowedPaths.includes("*");

  if (!hasFullAccess) {
    const isAllowed = roleConfig.allowedPaths.some(path => location.pathname.startsWith(path));
    if (!isAllowed) {
      return <Navigate to="/resultados" replace />;
    }
  }

  return <Outlet />;
}

// import { useMyContract } from '../hooks/useMyContract';

// export default function ProtectedRoutes() {
//   const { user, token } = useSelector(selectAuth);
//   const location = useLocation();
//   const { hasContract } = useMyContract();

//   // ... validaciones actuales (user, token, status)

//   // ← NUEVO: Si es MAYOR/GOVERNOR y va a control-personal/auditoria, validar contrato
//   const requiresContract =
//     location.pathname.startsWith('/control-personal') ||
//     location.pathname.startsWith('/auditoria-tse');

//   if (
//     isRestrictedRole &&
//     requiresContract &&
//     !hasContract
//   ) {
//     return (
//       <Navigate
//         to="/resultados"
//         state={{
//           error:
//             'No tiene un contrato activo. Contacte al administrador para habilitar su acceso.',
//         }}
//         replace
//       />
//     );
//   }

//   return <Outlet />;
// }