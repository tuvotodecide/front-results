"use client";

import Link from "next/link";

interface DomainAccessNoticeProps {
  message: string;
  description?: string;
  registerPath?: string;
  registerLabel?: string;
  homePath?: string;
  alternatePath?: string;
  alternateLabel?: string;
}

export default function DomainAccessNotice({
  message,
  description,
  registerPath,
  registerLabel = "Solicitar acceso",
  homePath = "/",
  alternatePath,
  alternateLabel,
}: DomainAccessNoticeProps) {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
        <div className="w-full rounded-lg border border-amber-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase text-[#459151]">
            Acceso requerido
          </p>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{message}</h1>
          <p className="mt-3 text-sm text-gray-600">
            {description ??
              (registerPath
                ? "Puedes solicitar el acceso correspondiente desde el registro de este dominio."
                : "Comunícate con un administrador para revisar los permisos de tu usuario.")}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {registerPath ? (
              <Link
                href={registerPath}
                className="rounded-lg bg-[#459151] px-5 py-3 text-sm font-bold text-white"
              >
                {registerLabel}
              </Link>
            ) : null}
            {alternatePath && alternateLabel ? (
              <Link
                href={alternatePath}
                className="rounded-lg border border-[#459151] px-5 py-3 text-sm font-bold text-[#459151]"
              >
                {alternateLabel}
              </Link>
            ) : null}
            <Link
              href={homePath}
              className="rounded-lg border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
