import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuth, logOut } from './store/auth/authSlice';
import LoadingSkeleton from './components/LoadingSkeleton';
import { useLazyGetProfileQuery } from './store/auth/authEndpoints';
import ResultadosGenerales3 from './pages/Resultados/ResultadosGenerales3';
import ResultadosMesa2 from './pages/Resultados/ResultadosMesa2';
import ResultadosLocalidad from './pages/Resultados/ResultadosLocalidad';
import ResultadosImagen from './pages/Resultados/ResultadosImagen';

const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Auth/Login'));
const PanelControl = React.lazy(() => import('./pages/PanelControl'));

const CrearCuenta = React.lazy(() => import('./pages/Auth/CrearCuenta'));
const ProtectedRoutes = React.lazy(() => import('./pages/ProtectedRoutes'));
const RecintosElectorales = React.lazy(
  () => import('./pages/Recintos/RecintosElectorales')
);
const RecintoForm = React.lazy(() => import('./pages/Recintos/RecintoForm'));
const Actas = React.lazy(() => import('./pages/Actas/Actas'));
const VerActa = React.lazy(() => import('./pages/Actas/VerActa'));
const ActasForm = React.lazy(() => import('./pages/Actas/ActasForm'));
const BasicLayout = React.lazy(() => import('./components/BasicLayout'));
const Partidos = React.lazy(() => import('./pages/Partidos/Partidos'));
const PartidoForm = React.lazy(() => import('./pages/Partidos/PartidoForm'));

const AppRouter: React.FC = () => {
  const dispatch = useDispatch();
  const [getProfile] = useLazyGetProfileQuery();
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') ?? 'null');
    const token = localStorage.getItem('token');
    if (user && token) {
      dispatch(setAuth({ access_token: token, user }));
      console.log('User data:', user);
      getProfile()
        .unwrap()
        .then((res) => {
          console.log('Profile data:', res);
        })
        .catch((err) => {
          if (err.status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            dispatch(logOut());
          }
        });
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
            <Route path="/resultados/imagen" element={<ResultadosImagen />} />
            <Route
              path="/resultados/localidad"
              element={<ResultadosLocalidad />}
            />
            <Route element={<ProtectedRoutes />}>
              <Route path="/panel" element={<PanelControl />} />
              <Route path="/partidos" element={<Partidos />} />
              <Route path="/partidos/nuevo" element={<PartidoForm />} />
              <Route path="/partidos/editar/:id" element={<PartidoForm />} />
              <Route path="/recintos" element={<RecintosElectorales />} />
              <Route path="/recintos/nuevo" element={<RecintoForm />} />
              <Route path="/recintos/editar/:id" element={<RecintoForm />} />

              <Route path="/actas" element={<Actas />} />
              <Route path="/actas/nuevo" element={<ActasForm />} />
              <Route path="/actas/editar/:id" element={<ActasForm />} />
            </Route>
          </Route>
        </Routes>
      </React.Suspense>
    </Router>
  );
};

export default AppRouter;
