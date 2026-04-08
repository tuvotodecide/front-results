import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import tuvotoDecideImage from "../../assets/tuvotodecide.webp";
import { useSelector } from "react-redux";
import { selectAuth, selectIsLoggedIn } from "../../store/auth/authSlice";

const Rejected: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector(selectAuth);
  const isLoggedIn = useSelector(selectIsLoggedIn);

  useEffect(() => {
    // si no está loggeado, no tiene contexto -> login
    if (!isLoggedIn) {
      navigate("/login", { replace: true });
      return;
    }

    // si está activo, no tiene sentido estar en rechazado
    if (user?.active) {
      navigate("/resultados", { replace: true });
    }
  }, [isLoggedIn, user?.active, navigate]);
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#459151] px-4">
      <div className="w-full max-w-[450px] p-8 sm:p-10 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
        <div className="flex flex-col items-center mb-6">
          <img
            src={tuvotoDecideImage}
            alt="Logo"
            className="h-20 w-auto mb-6"
          />

          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="#ef4444"
              className="w-10 h-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15.75h.01"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Acceso rechazado
          </h1>
          <p className="text-red-600 font-semibold text-lg mb-4">
            Tu solicitud no fue aprobada
          </p>

          <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
            <p>
              Un administrador revisó tu solicitud y determinó que no puede ser
              aprobada en este momento.
            </p>
            <p className="bg-gray-50 p-3 rounded-lg border border-gray-200 italic">
              Si crees que esto es un error, comunícate con soporte o intenta
              registrarte nuevamente con la información correcta.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 space-y-3">
          <Link
            to="/login"
            className="block w-full text-white font-bold py-3 rounded-xl transition-all shadow-md hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: "#459151" }}
          >
            Ir a Iniciar sesión
          </Link>

          <Link
            to="/registrarse"
            className="block w-full py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            Crear otra cuenta
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Rejected;
