"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import tuvotoDecideImage from "@/assets/tuvotodecide.webp";
import { resolveAuthenticatedDestination } from "@/domains/auth/lib/access";
import {
  clearPendingContext,
  readPendingEmail,
  readPendingReason,
} from "@/shared/auth/storage";
import { publicEnv } from "@/shared/env/public";
import { selectAuth, selectIsLoggedIn } from "@/store/auth/authSlice";

export default function WaitingApprovalPage() {
  const router = useRouter();
  const { user } = useSelector(selectAuth);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const pendingEmail = readPendingEmail();
  const pendingReason = readPendingReason();

  useEffect(() => {
    if (isLoggedIn && user?.active) {
      router.replace(
        resolveAuthenticatedDestination({
          user,
          appMode: publicEnv.appMode,
        }),
      );
      return;
    }

    if (!isLoggedIn && !pendingEmail) {
      router.replace("/login");
    }
  }, [isLoggedIn, pendingEmail, router, user]);

  const content = useMemo(() => {
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

  const goLogin = () => {
    clearPendingContext();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#459151] px-4">
      <div className="w-full max-w-[450px] rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mb-6 flex flex-col items-center">
          <Image src={tuvotoDecideImage} alt="Logo" className="mb-6 h-20 w-auto" priority />

          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-green-100 bg-green-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#459151" className="h-10 w-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-800">{content.title}</h1>
          <p className="mb-4 text-lg font-semibold text-[#459151]">{content.subtitle}</p>

          <div className="space-y-3 text-sm leading-relaxed text-gray-600">
            {content.paragraphs.map((paragraph, index) => (
              <p
                key={`${paragraph}-${index}`}
                className={
                  index === 1 ? "rounded-lg border border-gray-200 bg-gray-50 p-3 italic" : ""
                }
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-6">
          <button
            onClick={goLogin}
            type="button"
            style={{ backgroundColor: "#459151" }}
            className="block w-full rounded-xl py-3 font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Ir a Iniciar Sesión
          </button>

          <Link
            href="/"
            className="block w-full rounded-xl border-2 border-gray-200 py-3 font-bold text-gray-600 transition-all hover:bg-gray-50 active:scale-[0.98]"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
