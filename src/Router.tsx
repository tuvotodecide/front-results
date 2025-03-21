import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const Home = React.lazy(() => import("./pages/Home"));
const About = React.lazy(() => import("./pages/About"));
const Login = React.lazy(() => import("./pages/Login"));
const PanelControl = React.lazy(() => import("./pages/PanelControl"));
const RegistroJurado = React.lazy(() => import("./pages/RegistroJurado"));
const EnvioActa = React.lazy(() => import("./pages/EnvioActa"));
const Resultados = React.lazy(() => import("./pages/Resultados"));

const AppRouter: React.FC = () => {
  return (
    <Router>
      <React.Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/panel" element={<PanelControl />} />
          <Route path="/registroJurado" element={<RegistroJurado />} />
          <Route path="/envioActa" element={<EnvioActa />} />
          <Route path="/resultados" element={<Resultados />} />
        </Routes>
      </React.Suspense>
    </Router>
  );
};

export default AppRouter;
