import { selectAuth } from "../store/auth/authSlice";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoutes() {
  const { user } = useSelector(selectAuth);
  const location = useLocation();

  // Con HttpOnly Cookies, el token puede no estar en Redux tras un refresh, 
  // pero el user sí está persistido en localStorage.
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

  const adminPaths = [
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
  ];

  const isAdminPath = adminPaths.some((path) =>
    location.pathname.startsWith(path),
  );

  if (isAdminPath && user.role !== "SUPERADMIN") {
    return <Navigate to="/resultados" replace />;
  }

  const isRestrictedRole = user.role === "MAYOR" || user.role === "GOVERNOR";
  const allowedPaths = [
    "/resultados",
    "/control-personal",
    "/auditoria-tse",
    "/perfil"
  ];
  const isAllowedPath = allowedPaths.some(path => location.pathname.startsWith(path));

  // Si es un rol restringido y la ruta no está permitida para ellos
  if (isRestrictedRole && !isAllowedPath) {
    return <Navigate to="/resultados" replace />;
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