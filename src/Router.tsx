import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAuth } from "./store/auth/authSlice";
import LoadingSkeleton from "./components/LoadingSkeleton";
import ResultadosGenerales3 from "./pages/Resultados/ResultadosGenerales3";
import ParticipacionPersonal from "./pages/Resultados/PersonalParticipation";
import AuditAndMatch from "./pages/Resultados/AuditAndMatch";
import ResultadosMesa2 from "./pages/Resultados/ResultadosMesa2";
import ResultadosImagen from "./pages/Resultados/ResultadosImagen";
import Departments from "./pages/Departments/Departments";
import DepartmentForm from "./pages/Departments/DepartmentForm";
import Provinces from "./pages/Provinces/Provinces";
import ProvincesForm from "./pages/Provinces/ProvincesForm";
import Municipalities from "./pages/Municipalities/Municipalities";
import MunicipalityForm from "./pages/Municipalities/MunicipalityForm";
import ElectoralSeats from "./pages/ElectoralSeats/ElectoralSeats";
import ElectoralSeatForm from "./pages/ElectoralSeats/ElectoralSeatForm";
import ElectoralLocations from "./pages/ElectoralLocations/ElectoralLocations";
import ElectoralLocationForm from "./pages/ElectoralLocations/ElectoralLocationForm";
import ElectoralTables from "./pages/ElectoralTables/ElectoralTables";
import ElectoralTableForm from "./pages/ElectoralTables/ElectoralTableForm";
import Configurations from "./pages/Configurations/Configurations";
import ConfigurationForm from "./pages/Configurations/ConfigurationForm";
import PoliticalParties from "./pages/PoliticalParties/PoliticalParties";
import PoliticalPartyForm from "./pages/PoliticalParties/PoliticalPartyForm";

const Home = React.lazy(() => import("./pages/Home"));
const Login = React.lazy(() => import("./pages/Auth/Login"));
const PanelControl = React.lazy(() => import("./pages/PanelControl"));
const Rejected = React.lazy(() => import("./pages/Auth/Rejected"));

const Register = React.lazy(() => import("./pages/Auth/Register"));
const VerifyEmail = React.lazy(() => import("./pages/Auth/VerifyEmail"));
const ForgotPassword = React.lazy(() => import("./pages/Auth/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./pages/Auth/ResetPassword"));
const WaitingApproval = React.lazy(
  () => import("./pages/Auth/WaitingApproval")
);
const ProtectedRoutes = React.lazy(() => import("./pages/ProtectedRoutes"));
const BasicLayout = React.lazy(() => import("./components/BasicLayout"));
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
      // console.log('User data:', user);
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
          <Route element={<BasicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registrarse" element={<Register />} />
            <Route path="/pendiente" element={<WaitingApproval />} />
            <Route path="/rechazado" element={<Rejected />} />
            <Route path="/resultados" element={<ResultadosGenerales3 />} />
            <Route path="/resultados/mesa" element={<ResultadosMesa2 />} />
            <Route path="/verificar-correo" element={<VerifyEmail />} />
            <Route path="/recuperar" element={<ForgotPassword />} />
            <Route path="/restablecer" element={<ResetPassword />} />

            <Route
              path="/resultados/mesa/:tableCode"
              element={<ResultadosMesa2 />}
            />
            <Route path="/resultados/imagen" element={<ResultadosImagen />} />
            <Route
              path="/resultados/imagen/:id"
              element={<ResultadosImagen />}
            />
            <Route element={<ProtectedRoutes />}>
              <Route
                path="/control-personal"
                element={<ParticipacionPersonal />}
              />
              <Route path="/auditoria-tse" element={<AuditAndMatch />} />
              <Route path="/panel" element={<PanelControl />} />
              <Route path="/partidos" element={<Partidos />} />
              <Route path="/partidos/nuevo" element={<PartidoForm />} />
              <Route path="/partidos/editar/:id" element={<PartidoForm />} />

              <Route path="/departamentos" element={<Departments />} />
              <Route path="/departamentos/nuevo" element={<DepartmentForm />} />
              <Route
                path="/departamentos/editar/:id"
                element={<DepartmentForm />}
              />
              <Route path="/provincias" element={<Provinces />} />
              <Route path="/provincias/nuevo" element={<ProvincesForm />} />
              <Route
                path="/provincias/editar/:id"
                element={<ProvincesForm />}
              />

              <Route path="/municipios" element={<Municipalities />} />
              <Route path="/municipios/nuevo" element={<MunicipalityForm />} />
              <Route
                path="/municipios/editar/:id"
                element={<MunicipalityForm />}
              />

              <Route
                path="/asientos-electorales"
                element={<ElectoralSeats />}
              />
              <Route
                path="/asientos-electorales/nuevo"
                element={<ElectoralSeatForm />}
              />
              <Route
                path="/asientos-electorales/editar/:id"
                element={<ElectoralSeatForm />}
              />

              <Route
                path="/recintos-electorales"
                element={<ElectoralLocations />}
              />
              <Route
                path="/recintos-electorales/nuevo"
                element={<ElectoralLocationForm />}
              />
              <Route
                path="/recintos-electorales/editar/:id"
                element={<ElectoralLocationForm />}
              />
              <Route path="/mesas" element={<ElectoralTables />} />
              <Route path="/mesas/nuevo" element={<ElectoralTableForm />} />
              <Route
                path="/mesas/editar/:id"
                element={<ElectoralTableForm />}
              />
              <Route path="/configuraciones" element={<Configurations />} />
              <Route
                path="/configuraciones/nueva"
                element={<ConfigurationForm />}
              />
              <Route
                path="/configuraciones/editar/:id"
                element={<ConfigurationForm />}
              />
              <Route
                path="/partidos-politicos"
                element={<PoliticalParties />}
              />
              <Route
                path="/partidos-politicos/nuevo"
                element={<PoliticalPartyForm />}
              />
              <Route
                path="/partidos-politicos/editar/:id"
                element={<PoliticalPartyForm />}
              />
            </Route>
          </Route>
        </Routes>
      </React.Suspense>
    </Router>
  );
};

export default AppRouter;
