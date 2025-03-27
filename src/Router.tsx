import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const Home = React.lazy(() => import("./pages/Home"));
const About = React.lazy(() => import("./pages/About"));
const Login = React.lazy(() => import("./pages/Login"));
const PanelControl = React.lazy(() => import("./pages/PanelControl"));
const RegistroJurado = React.lazy(() => import("./pages/RegistroJurado"));
const EnvioActa = React.lazy(() => import("./pages/EnvioActa"));
const Resultados = React.lazy(() => import("./pages/Resultados"));
const CrearCuenta = React.lazy(() => import("./pages/CrearCuenta"));
const ProtectedRoutes = React.lazy(() => import("./pages/ProtectedRoutes"));
const RecintosElectorales = React.lazy(
  () => import("./pages/RecintosElectorales")
);
const RecintoForm = React.lazy(() => import("./pages/RecintoForm"));
const Layout = React.lazy(() => import("./components/Layout"));

const AppRouter: React.FC = () => {
  return (
    <Router>
      <React.Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/crearCuenta" element={<CrearCuenta />} />
          <Route element={<ProtectedRoutes />}>
            <Route element={<Layout />}>
              <Route path="/panel" element={<PanelControl />} />
              <Route path="/recintos" element={<RecintosElectorales />} />
              <Route path="/recintos/nuevo" element={<RecintoForm />} />
              <Route path="/recintos/editar/:id" element={<RecintoForm />} />
              <Route path="/registroJurado" element={<RegistroJurado />} />
              <Route path="/envioActa" element={<EnvioActa />} />
              <Route path="/resultados" element={<Resultados />} />
            </Route>
          </Route>
        </Routes>
      </React.Suspense>
    </Router>
  );
};

export default AppRouter;
