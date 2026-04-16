"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import tuvotoDecideImage from "../../../assets/tuvotodecide.webp";
import { Link, useSearchParams } from "../navigation/compat";
import { useVerifyInstitutionalAdminApplicationMutation } from "../../../store/auth/authEndpoints";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/auth/authSlice";
import { useNavigate } from "../navigation/compat";
import { resolveAuthVotacionRedirect } from "../utils/resolveAuthRedirect";
import { CircleCheck } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const getLogoSrc = () => {
  const logoAsset = tuvotoDecideImage as string | { src: string };
  return typeof logoAsset === "string" ? logoAsset : logoAsset.src;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const cleanMessage = (message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes("token")) {
      return "El enlace es inválido o ya expiró. Solicita uno nuevo si necesitas continuar.";
    }

    return message;
  };

  if (typeof error === "object" && error !== null) {
    const maybeData = "data" in error ? error.data : undefined;
    if (
      typeof maybeData === "object" &&
      maybeData !== null &&
      "message" in maybeData
    ) {
      const message = maybeData.message;
      if (typeof message === "string") {
        return cleanMessage(message);
      }
    }

    if ("message" in error && typeof error.message === "string") {
      return cleanMessage(error.message);
    }
  }

  return fallback;
};

const WHATSAPP_NUMBER = "59167014222";
const WHATSAPP_MESSAGE =
  "Hola, deseo solicitar aprobación de mi cuenta institucional en Tu Voto Decide.";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE,
)}`;

const VerifyVotacionPage = () => {
  const logoSrc = getLogoSrc();
  const navigate = useNavigate();
  const { user, token: authToken } = useSelector(selectAuth);
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [verifyInstitutional] = useVerifyInstitutionalAdminApplicationMutation();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const attemptedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const target = resolveAuthVotacionRedirect(user, authToken);
    if (target) {
      navigate(target, { replace: true });
    }
  }, [user, authToken, navigate]);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg(
        "El enlace es inválido o está incompleto. Abre nuevamente el enlace enviado a tu correo.",
      );
      return;
    }

    if (attemptedTokenRef.current === token) {
      return;
    }

    attemptedTokenRef.current = token;
    setStatus("loading");

    verifyInstitutional({ token })
      .unwrap()
      .then(() => {
        setStatus("success");
      })
      .catch((error) => {
        setStatus("error");
        setErrorMsg(getErrorMessage(error, "No se pudo verificar el correo."));
      });
  }, [token, verifyInstitutional]);

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
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 border border-green-100 shadow-sm">
            <CircleCheck className="w-10 h-10 text-[#459151]" strokeWidth={1.8} />
          </div>

          <h1 className="text-2xl sm:text-[2rem] font-bold text-gray-900 leading-tight mb-2">
            Correo verificado correctamente
          </h1>
          <div className="w-full mt-3">
            <p className="bg-[#f7faf7] border border-green-100 rounded-2xl px-5 py-4 text-[#459151] font-semibold text-base leading-relaxed">
              Tu solicitud queda pendiente de aprobación. Si necesitas ayuda, puedes escribirnos.
            </p>
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
            <div className="font-semibold text-gray-800 mb-1">Qué pasó</div>
            <p className="text-gray-600 text-sm">{errorMsg}</p>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#459151] px-4">
      <div className="w-full max-w-[460px] p-8 sm:p-10 bg-white rounded-3xl shadow-xl border border-gray-100 text-center">
        <div className="flex flex-col items-center mb-6">
          <img src={logoSrc} alt="Logo" className="h-20 w-auto mb-6" />
          {content()}
        </div>

        <div className="pt-6 border-t border-gray-100 space-y-3">
          {status === "success" ? (
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 py-3 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] hover:brightness-110"
              style={{ backgroundColor: "#25D366" }}
            >
              <FaWhatsapp className="h-5 w-5" />
              <span>Solicitar aprobación 67014222</span>
            </a>
          ) : (
            <Link
              to="/votacion/login"
              className="block w-full py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              Ir a Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyVotacionPage;
