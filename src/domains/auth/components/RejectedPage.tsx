"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import tuvotoDecideImage from "@/assets/tuvotodecide.webp";
import { resolveAuthenticatedDestination } from "@/domains/auth/lib/access";
import { publicEnv } from "@/shared/env/public";
import { selectAuth, selectIsLoggedIn } from "@/store/auth/authSlice";

export default function RejectedPage() {
  const router = useRouter();
  const { user } = useSelector(selectAuth);
  const isLoggedIn = useSelector(selectIsLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    if (user?.active && user) {
      router.replace(
        resolveAuthenticatedDestination({
          user,
          appMode: publicEnv.appMode,
        }),
      );
    }
  }, [isLoggedIn, router, user]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#459151] px-4">
      <div className="w-full max-w-[450px] rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mb-6 flex flex-col items-center">
          <Image src={tuvotoDecideImage} alt="Logo" className="mb-6 h-20 w-auto" priority />

          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-red-100 bg-red-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ef4444" className="h-10 w-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.01" />
            </svg>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-800">Acceso rechazado</h1>
          <p className="mb-4 text-lg font-semibold text-red-600">Tu solicitud no fue aprobada</p>

          <div className="space-y-4 text-sm leading-relaxed text-gray-600">
            <p>
              Un administrador revisó tu solicitud y determinó que no puede ser aprobada en este momento.
            </p>
            <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 italic">
              Si crees que esto es un error, comunícate con soporte o intenta registrarte nuevamente con la información correcta.
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-6">
          <Link
            href="/login"
            style={{ backgroundColor: "#459151" }}
            className="block w-full rounded-xl py-3 font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Ir a Iniciar sesión
          </Link>

          <Link
            href="/registrarse"
            className="block w-full rounded-xl border-2 border-gray-200 py-3 font-bold text-gray-600 transition-all hover:bg-gray-50 active:scale-[0.98]"
          >
            Crear otra cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
