"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import tuvotoDecideImage from "@/assets/tuvotodecide.webp";
import {
  useLazyVerifyEmailQuery,
  useVerifyInstitutionalAdminApplicationMutation,
} from "@/store/auth/authEndpoints";
import { isVotingMode } from "@/config/appMode";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { data?: { message?: string | string[] }; message?: string };
    const message = candidate.data?.message ?? candidate.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join("\n");
  }

  return fallback;
};

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams?.get("token") ?? "", [searchParams]);
  const [triggerVerify] = useLazyVerifyEmailQuery();
  const [verifyInstitutional] = useVerifyInstitutionalAdminApplicationMutation();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const attemptedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Token inválido o faltante.");
      return;
    }

    if (attemptedTokenRef.current === token) return;
    attemptedTokenRef.current = token;
    setStatus("loading");

    const verifier = isVotingMode()
      ? verifyInstitutional({ token }).unwrap()
      : triggerVerify({ token }).unwrap();

    verifier
      .then(() => setStatus("success"))
      .catch((error: unknown) => {
        const message = getErrorMessage(error, "No se pudo verificar el correo.");
        setStatus("error");
        setErrorMsg(message);
      });
  }, [token, triggerVerify, verifyInstitutional]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#459151] px-4">
      <div className="w-full max-w-[480px] rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mb-6 flex flex-col items-center">
          <Image src={tuvotoDecideImage} alt="Logo" className="mb-6 h-20 w-auto" priority />
          {status === "loading" && (
            <StatusBlock
              title="Verificando..."
              subtitle="Estamos validando tu correo. Por favor espera."
              tone="neutral"
            />
          )}

          {status === "success" && (
            <StatusBlock
              title="Correo verificado"
              subtitle="Verificación completada"
              tone="success"
              extra={
                <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-left text-sm text-gray-600">
                  <div className="mb-1 font-semibold text-gray-800">Siguiente paso</div>
                  <p>
                    Tu cuenta ahora queda <b>pendiente de aprobación</b> por un administrador.
                    Una vez aprobada, podrás iniciar sesión.
                  </p>
                </div>
              }
            />
          )}

          {status === "error" && (
            <StatusBlock
              title="No se pudo verificar"
              subtitle="Enlace inválido o expirado"
              tone="error"
              extra={
                <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-left">
                  <div className="mb-1 font-semibold text-gray-800">Detalle</div>
                  <p className="text-sm text-gray-600">{errorMsg}</p>
                </div>
              }
            />
          )}
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-6">
          <Link
            href="/login"
            className="block w-full rounded-xl border-2 border-gray-200 py-3 font-bold text-gray-600 transition-all hover:bg-gray-50 active:scale-[0.98]"
          >
            Ir a Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatusBlock({
  title,
  subtitle,
  tone,
  extra,
}: {
  title: string;
  subtitle: string;
  tone: "success" | "error" | "neutral";
  extra?: ReactNode;
}) {
  const toneMap = {
    success: {
      circle: "bg-green-50 border-green-100",
      stroke: "#459151",
      subtitle: "text-[#459151]",
      icon: (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </>
      ),
    },
    error: {
      circle: "bg-red-50 border-red-100",
      stroke: "#ef4444",
      subtitle: "text-red-600",
      icon: (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.01" />
        </>
      ),
    },
    neutral: {
      circle: "bg-gray-50 border-gray-200",
      stroke: "#6b7280",
      subtitle: "text-gray-600",
      icon: (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </>
      ),
    },
  } as const;

  const ui = toneMap[tone];

  return (
    <>
      <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full border ${ui.circle}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={ui.stroke} className="h-10 w-10">
          {ui.icon}
        </svg>
      </div>
      <h1 className="mb-2 text-2xl font-bold text-gray-800">{title}</h1>
      <p className={`mb-4 text-lg font-semibold ${ui.subtitle}`}>{subtitle}</p>
      {extra}
    </>
  );
}
