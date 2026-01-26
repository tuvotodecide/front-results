import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import tuvotoDecideImage from "../../assets/tuvotodecide.webp";
import { useLazyVerifyEmailQuery } from "../../store/auth/authEndpoints";

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [triggerVerify] = useLazyVerifyEmailQuery();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Token inválido o faltante.");
      return;
    }

    setStatus("loading");
    triggerVerify({ token })
      .unwrap()
      .then(() => {
        setStatus("success");
      })
      .catch((err: any) => {
        const msg =
          err?.data?.message ||
          err?.message ||
          "No se pudo verificar el correo.";
        setStatus("error");
        setErrorMsg(typeof msg === "string" ? msg : "No se pudo verificar.");
      });
  }, [token, triggerVerify]);

  const content = () => {
    if (status === "loading") {
      return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-left">
          <div className="font-semibold text-gray-800 mb-1">Verificando...</div>
          <p className="text-gray-600 text-sm">
            Estamos validando tu correo. Por favor espera.
          </p>
        </div>
      );
    }

    if (status === "success") {
      return (
        <>
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
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Correo verificado
          </h1>
          <p className="text-[#459151] font-semibold text-lg mb-4">
            Verificación completada
          </p>

          <div className="space-y-3 text-gray-600 text-sm leading-relaxed text-left w-full">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="font-semibold text-gray-800 mb-1">
                Siguiente paso
              </div>
              <p>
                Tu cuenta ahora queda <b>pendiente de aprobación</b> por un
                administrador. Una vez aprobada, podrás iniciar sesión.
              </p>
            </div>
          </div>
        </>
      );
    }

    if (status === "error") {
      return (
        <>
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
            No se pudo verificar
          </h1>
          <p className="text-red-600 font-semibold text-lg mb-4">
            Enlace inválido o expirado
          </p>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-left">
            <div className="font-semibold text-gray-800 mb-1">Detalle</div>
            <p className="text-gray-600 text-sm">{errorMsg}</p>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#459151] px-4">
      <div className="w-full max-w-[480px] p-8 sm:p-10 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
        <div className="flex flex-col items-center mb-6">
          <img src={tuvotoDecideImage} alt="Logo" className="h-20 w-auto mb-6" />
          {content()}
        </div>

        <div className="pt-6 border-t border-gray-100 space-y-3">
          {/* <Link
            to="/pendiente"
            className="block w-full text-white font-bold py-3 rounded-xl transition-all shadow-md hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: "#459151" }}
          >
            Ver estado (Pendiente)
          </Link> */}

          <Link
            to="/login"
            className="block w-full py-3 border-2 border-gray-200 text-g<ray-600 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            Ir a Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
