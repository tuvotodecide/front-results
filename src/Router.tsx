import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuth } from './store/auth/authSlice';
import LoadingSkeleton from './components/LoadingSkeleton';
import ResultadosGenerales3 from './pages/Resultados/ResultadosGenerales3';
import ResultadosMesa2 from './pages/Resultados/ResultadosMesa2';
import ResultadosImagen from './pages/Resultados/ResultadosImagen';
import Departments from './pages/Departments/Departments';
import DepartmentForm from './pages/Departments/DepartmentForm';
import Provinces from './pages/Provinces/Provinces';
import ProvincesForm from './pages/Provinces/ProvincesForm';
import Municipalities from './pages/Municipalities/Municipalities';
import MunicipalityForm from './pages/Municipalities/MunicipalityForm';
import ElectoralSeats from './pages/ElectoralSeats/ElectoralSeats';
import ElectoralSeatForm from './pages/ElectoralSeats/ElectoralSeatForm';
import ElectoralLocations from './pages/ElectoralLocations/ElectoralLocations';
import ElectoralLocationForm from './pages/ElectoralLocations/ElectoralLocationForm';
import ElectoralTables from './pages/ElectoralTables/ElectoralTables';
import ElectoralTableForm from './pages/ElectoralTables/ElectoralTableForm';
import Configurations from './pages/Configurations/Configurations';

const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Auth/Login'));
const PanelControl = React.lazy(() => import('./pages/PanelControl'));

const CrearCuenta = React.lazy(() => import('./pages/Auth/CrearCuenta'));
const ProtectedRoutes = React.lazy(() => import('./pages/ProtectedRoutes'));
const Actas = React.lazy(() => import('./pages/Actas/Actas'));
const VerActa = React.lazy(() => import('./pages/Actas/VerActa'));
const ActasForm = React.lazy(() => import('./pages/Actas/ActasForm'));
const BasicLayout = React.lazy(() => import('./components/BasicLayout'));
const Partidos = React.lazy(() => import('./pages/Partidos/Partidos'));
const PartidoForm = React.lazy(() => import('./pages/Partidos/PartidoForm'));

const AppRouter: React.FC = () => {
  const dispatch = useDispatch();
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') ?? 'null');
    const token = localStorage.getItem('token');
    if (user && token) {
      dispatch(setAuth({ access_token: token, user }));
      console.log('User data:', user);
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
            <Route path="/crearCuenta" element={<CrearCuenta />} />
            <Route path="/enviarActa" element={<ActasForm />} />
            <Route path="/verActa" element={<VerActa />} />
            <Route path="/resultados" element={<ResultadosGenerales3 />} />
            <Route path="/resultados/mesa" element={<ResultadosMesa2 />} />
            <Route path="/resultados/mesa/:id" element={<ResultadosMesa2 />} />
            <Route path="/resultados/imagen" element={<ResultadosImagen />} />
            <Route
              path="/resultados/imagen/:id"
              element={<ResultadosImagen />}
            />
            <Route element={<ProtectedRoutes />}>
              <Route path="/panel" element={<PanelControl />} />
              <Route path="/partidos" element={<Partidos />} />
              <Route path="/partidos/nuevo" element={<PartidoForm />} />
              <Route path="/partidos/editar/:id" element={<PartidoForm />} />

              <Route path="/actas" element={<Actas />} />
              <Route path="/actas/nuevo" element={<ActasForm />} />
              <Route path="/actas/editar/:id" element={<ActasForm />} />

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
            </Route>
          </Route>
        </Routes>
      </React.Suspense>
    </Router>
  );
};

export default AppRouter;
