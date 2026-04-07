"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { readPendingEmail } from "@/shared/auth/storage";
import { publicEnv } from "@/shared/env/public";
import { selectAuth } from "@/store/auth/authSlice";
import {
  getAccessStatus,
  resolveAuthenticatedDestination,
  resolveProtectedDomainRedirect,
} from "@/domains/auth/lib/access";

export type AccessBoundaryMode =
  | "public"
  | "institutional-private"
  | "results"
  | "admin";

interface AuthAccessBoundaryProps {
  children: ReactNode;
  mode: AccessBoundaryMode;
}

export default function AuthAccessBoundary({
  children,
  mode,
}: Readonly<AuthAccessBoundaryProps>) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const auth = useSelector(selectAuth);
  const redirectTo = useMemo(() => {
    const search = searchParams?.toString() ?? "";
    const from = searchParams?.get("from") ?? undefined;
    const authFormPaths = ["/login", "/registrarse", "/recuperar", "/restablecer"];
    const pendingEmail = readPendingEmail();
    const status = getAccessStatus(auth.user);

    if (
      mode === "institutional-private" ||
      mode === "admin" ||
      mode === "results"
    ) {
      const redirectTo = resolveProtectedDomainRedirect({
        pathname,
        search,
        auth,
      });

      if (redirectTo) {
        return redirectTo;
      }

      if (mode === "institutional-private") {
        const role = auth.user?.role;
        if (role !== "TENANT_ADMIN" && role !== "SUPERADMIN") {
          return "/";
        }
        return null;
      }

      if (mode === "admin" && auth.user?.role !== "SUPERADMIN") {
        return "/resultados";
      }

      return null;
    }

    if (mode !== "public") {
      return null;
    }

    if (auth.user && auth.token && authFormPaths.includes(pathname)) {
      return resolveAuthenticatedDestination({
        user: auth.user,
        appMode: publicEnv.appMode,
        from,
      });
    }

    if (pathname === "/pendiente") {
      if (status === "ACTIVE" && auth.user && auth.token) {
        return resolveAuthenticatedDestination({
          user: auth.user,
          appMode: publicEnv.appMode,
          from,
        });
      }

      if (!auth.token && !pendingEmail) {
        return "/login";
      }
    }

    if (pathname === "/rechazado") {
      if (!auth.token || !auth.user) {
        return "/login";
      }

      if (status === "ACTIVE") {
        return resolveAuthenticatedDestination({
          user: auth.user,
          appMode: publicEnv.appMode,
          from,
        });
      }
    }
    return null;
  }, [auth, mode, pathname, searchParams]);

  useEffect(() => {
    if (!redirectTo) {
      return;
    }

    router.replace(redirectTo);
  }, [redirectTo, router]);

  if (redirectTo) {
    return <LoadingSkeleton tone={mode === "public" ? "brand" : "surface"} />;
  }

  return <div data-access-boundary={mode}>{children}</div>;
}
