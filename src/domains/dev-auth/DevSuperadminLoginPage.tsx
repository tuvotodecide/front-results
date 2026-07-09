"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { ShieldCheck } from "lucide-react";
import { setDevAuthSession } from "@/store/auth/authSlice";

export default function DevSuperadminLoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/dev/auth/superadmin", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Dev auth is disabled");
      }

      const data = (await response.json()) as { session?: unknown };
      dispatch(setDevAuthSession(data.session));
      router.replace("/superadmin");
    } catch {
      setError(
        "No se pudo iniciar la sesión local. Verifica ENABLE_DEV_AUTH=true o NEXT_PUBLIC_ENABLE_DEV_AUTH=true.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f8] px-4">
      <section className="w-full max-w-md rounded-2xl border border-[#dfe6df] bg-white p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e7f2e8] text-[#287c36]">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-[#3b3b3b]">
          Acceso local Superadmin
        </h1>
        <p className="mt-2 text-sm text-[#747474]">
          Modo desarrollo para ingresar al módulo sin backend real.
        </p>
        <button
          type="button"
          onClick={login}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-[#287c36] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f642b] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Ingresando..." : "Entrar como Superadmin local"}
        </button>
        {error ? <p className="mt-3 text-sm text-[#b42318]">{error}</p> : null}
      </section>
    </main>
  );
}
