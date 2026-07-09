"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { selectAuth, setDevAuthSession } from "@/store/auth/authSlice";
import { isDevAuthEnabled } from "@/domains/dev-auth/devAuth";

const isGlobalAdminContext = (context?: { type?: string } | null) =>
  context?.type === "GLOBAL_ADMIN";

export const hasSuperadminAccess = (
  auth: ReturnType<typeof selectAuth>,
) => {
  const role = String(auth.user?.role ?? auth.role ?? "").toUpperCase();

  return (
    role === "SUPERADMIN" ||
    isGlobalAdminContext(auth.activeContext) ||
    isGlobalAdminContext(auth.defaultContext) ||
    auth.availableContexts.some(isGlobalAdminContext)
  );
};

export default function SuperadminGuard({
  children,
}: {
  children: ReactNode;
}) {
  const auth = useSelector(selectAuth);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname() ?? "/superadmin";
  const [checkingDevSession, setCheckingDevSession] = useState(false);
  const hasSession = Boolean((auth.token || auth.isDevSession) && auth.user);
  const allowed = hasSession && hasSuperadminAccess(auth);
  const loginPath = `/resultados/login?from=${encodeURIComponent(pathname)}`;

  useEffect(() => {
    if (hasSession) {
      return;
    }

    if (!isDevAuthEnabled()) {
      router.replace(loginPath);
      return;
    }

    let cancelled = false;

    const hydrateDevSession = async () => {
      setCheckingDevSession(true);

      try {
        const response = await fetch("/api/dev/auth/session", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No dev session");
        }

        const data = (await response.json()) as { session?: unknown };

        if (!cancelled && data.session) {
          dispatch(setDevAuthSession(data.session));
          return;
        }
      } catch {
        if (!cancelled) {
          router.replace(loginPath);
        }
      } finally {
        if (!cancelled) {
          setCheckingDevSession(false);
        }
      }
    };

    void hydrateDevSession();

    return () => {
      cancelled = true;
    };
  }, [dispatch, hasSession, loginPath, router]);

  if (!hasSession || checkingDevSession) {
    return null;
  }

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f8] px-4">
        <section className="w-full max-w-md rounded-2xl border border-[#e6ebef] bg-white p-6 text-center shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <h1 className="text-xl font-semibold text-[#3b3b3b]">
            Acceso restringido
          </h1>
          <p className="mt-2 text-sm text-[#747474]">
            Este módulo está disponible solo para usuarios SUPERADMIN o contexto
            GLOBAL_ADMIN.
          </p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
