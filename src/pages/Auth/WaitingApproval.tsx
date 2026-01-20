import React, { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import tuvotoDecideImage from "../../assets/tuvotodecide.webp";
import { useSelector } from "react-redux";
import { selectAuth, selectIsLoggedIn } from "../../store/auth/authSlice";

const WaitingApproval: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector(selectAuth);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const pendingEmail = localStorage.getItem("pendingEmail") || "";
  const pendingReason =
    localStorage.getItem("pendingReason") || "SUPERADMIN_APPROVAL";

  useEffect(() => {
    // Si está loggeado y ya está activo -> no tiene sentido estar aquí
    if (isLoggedIn && user?.active) {
      navigate("/resultados", { replace: true });
      return;
    }

    // Si NO está loggeado y NO hay contexto (no viene del flujo)
    if (!isLoggedIn && !pendingEmail) {
      navigate("/login", { replace: true });
    }
  }, [isLoggedIn, user?.active, pendingEmail, navigate]);

  const goLogin = () => {
    localStorage.removeItem("pendingEmail");
    localStorage.removeItem("pendingReason");
    navigate("/login", { replace: true });
  };

  const content = useMemo(() => {
    // 1) correo no verificado
    if (pendingReason === "VERIFY_EMAIL") {
      return {
        title: "Revisa tu correo",
        subtitle: "Verificación pendiente",
        paragraphs: [
          "Te enviamos un enlace de verificación a tu correo.",
          pendingEmail
            ? `Correo: ${pendingEmail}`
            : "Verifica tu correo e ingresa desde el enlace.",
          "Una vez verificado, tu cuenta quedará en revisión para aprobación del Superadmin.",
        ],
      };
    }

    // 2) espera aprobación superadmin
    return {
      title: "En espera de aprobación",
      subtitle: "Cuenta pendiente",
      paragraphs: [
        "Tu correo ya fue verificado o estás en proceso de validación.",
        "Un Superadmin debe aprobar tu acceso para habilitar el sistema.",
        pendingEmail ? `Correo: ${pendingEmail}` : "",
      ].filter(Boolean),
    };
  }, [pendingEmail, pendingReason]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#459151] px-4">
      <div className="w-full max-w-[450px] p-8 sm:p-10 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
        <div className="flex flex-col items-center mb-6">
          <img
            src={tuvotoDecideImage}
            alt="Logo"
            className="h-20 w-auto mb-6"
          />

          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 border border-green-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="#459151"
              className="w-10 h-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {content.title}
          </h1>
          <p className="text-[#459151] font-semibold text-lg mb-4">
            {content.subtitle}
          </p>

          <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
            {content.paragraphs.map((p, idx) => (
              <p
                key={idx}
                className={
                  idx === 1
                    ? "bg-gray-50 p-3 rounded-lg border border-gray-200 italic"
                    : ""
                }
              >
                {p}
              </p>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 space-y-3">
          <button
            onClick={goLogin}
            style={{ backgroundColor: "#459151" }}
            className="block w-full text-white font-bold py-3 rounded-xl transition-all shadow-md hover:brightness-110 active:scale-[0.98]"
            type="button"
          >
            Ir a Iniciar Sesión
          </button>

          <Link
            to="/"
            className="block w-full py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WaitingApproval;
