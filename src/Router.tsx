import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAuth } from "./store/auth/authSlice";
import LoadingSkeleton from "./components/LoadingSkeleton";

const Home = React.lazy(() => import("./pages/Home"));
const Login = React.lazy(() => import("./pages/Auth/Login"));
const PanelControl = React.lazy(() => import("./pages/PanelControl"));
const RegistroJurado = React.lazy(
  () => import("./pages/Jurados/RegistroJurado")
);
// const EnvioActa = React.lazy(() => import("./pages/EnvioActa"));
const Resultados = React.lazy(() => import("./pages/Resultados"));
const CrearCuenta = React.lazy(() => import("./pages/Auth/CrearCuenta"));
const ProtectedRoutes = React.lazy(() => import("./pages/ProtectedRoutes"));
const RecintosElectorales = React.lazy(
  () => import("./pages/Recintos/RecintosElectorales")
);
const RecintoForm = React.lazy(() => import("./pages/Recintos/RecintoForm"));
const Actas = React.lazy(() => import("./pages/Actas/Actas"));
const ActasForm = React.lazy(() => import("./pages/Actas/ActasForm"));
const Layout = React.lazy(() => import("./components/Layout"));
const Partidos = React.lazy(() => import("./pages/Partidos/Partidos"));
const PartidoForm = React.lazy(() => import("./pages/Partidos/PartidoForm"));

const AppRouter: React.FC = () => {
  const dispatch = useDispatch();
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") ?? "null");
    const token = localStorage.getItem("token");
    if (user && token) {
      dispatch(setAuth({ access_token: token, user }));
    }
    setIsAuthLoading(false);
  }, [dispatch]);

  if (isAuthLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <Router>
      <React.Suspense fallback={<LoadingSkeleton />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/crearCuenta" element={<CrearCuenta />} />
            <Route path="/enviarActa" element={<ActasForm />} />
            <Route path="/resultados" element={<Resultados />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/panel" element={<PanelControl />} />
              <Route path="/partidos" element={<Partidos />} />
              <Route path="/partidos/nuevo" element={<PartidoForm />} />
              <Route path="/partidos/editar/:id" element={<PartidoForm />} />
              <Route path="/recintos" element={<RecintosElectorales />} />
              <Route path="/recintos/nuevo" element={<RecintoForm />} />
              <Route path="/recintos/editar/:id" element={<RecintoForm />} />
              <Route path="/registroJurado" element={<RegistroJurado />} />

              <Route path="/actas" element={<Actas />} />
              <Route path="/actas/nuevo" element={<ActasForm />} />
              <Route path="/actas/editar/:id" element={<ActasForm />} />
              {/* <Route path="/resultados" element={<Resultados />} /> */}
            </Route>
          </Route>
        </Routes>
      </React.Suspense>
    </Router>
  );
};

export default AppRouter;
