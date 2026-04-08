"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { selectAuth } from "@/store/auth/authSlice";

interface ResultadosPrivateGuardProps {
  children: ReactNode;
}

export default function ResultadosPrivateGuard({
  children,
}: ResultadosPrivateGuardProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const normalizedPathname = pathname.startsWith("/resultados/")
    ? pathname.slice("/resultados".length)
    : pathname;
  const { user, token } = useSelector(selectAuth);

  const status = user?.status ?? (user?.active ? "ACTIVE" : "PENDING");

  const adminPaths = [
    "/panel",
    "/departamentos",
    "/provincias",
    "/municipios",
    "/asientos-electorales",
    "/recintos-electorales",
    "/mesas",
    "/configuraciones",
    "/partidos",
    "/partidos-politicos",
  ];

  const isAdminPath = adminPaths.some((path) =>
    normalizedPathname.startsWith(path),
  );
  const isRestrictedRole =
    user?.role === "MAYOR" || user?.role === "GOVERNOR";
  const allowedForRestricted =
    normalizedPathname.startsWith("/control-personal") ||
    normalizedPathname.startsWith("/auditoria-tse");

  let redirectTo: string | null = null;
  const from = `${pathname}${search ? `?${search}` : ""}`;

  if (!user || !token) {
    redirectTo = `/resultados/login?from=${encodeURIComponent(from)}`;
  } else if (status === "PENDING") {
    redirectTo = "/resultados/pendiente";
  } else if (status === "REJECTED" || status === "INACTIVE") {
    redirectTo = "/resultados/rechazado";
  } else if (isAdminPath && user.role !== "SUPERADMIN") {
    redirectTo = "/resultados";
  } else if (isRestrictedRole && !allowedForRestricted) {
    redirectTo = "/resultados";
  }

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  if (redirectTo) {
    return null;
  }

  return <>{children}</>;
}
