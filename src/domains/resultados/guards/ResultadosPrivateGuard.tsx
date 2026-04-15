"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { selectAuth, setActiveContext } from "@/store/auth/authSlice";
import {
  findContextForDomain,
  isSameContext,
  resolveBlockedHomeByContext,
  resolveDeniedDomainAccessNotice,
  resolveHomeByContext,
} from "@/store/auth/contextUtils";
import DomainAccessNotice from "@/domains/auth-context/DomainAccessNotice";
import { buildRegisterPathWithPrefill } from "@/domains/auth-context/registerPrefill";

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
  const auth = useSelector(selectAuth);
  const { user, token, activeContext, availableContexts } = auth;
  const territorialStatus =
    auth.accessStatus?.territorial.status ?? user?.territorialAccessStatus ?? null;

  const status = user?.status ?? (user?.active ? "ACTIVE" : "PENDING");
  const dispatch = useDispatch();
  const domainContext = findContextForDomain(availableContexts, "resultados");
  const hasLegacyAccess =
    !domainContext &&
    availableContexts.length === 0 &&
    (user?.role === "SUPERADMIN" ||
      user?.role === "MAYOR" ||
      user?.role === "GOVERNOR") &&
    (!territorialStatus || territorialStatus === "APPROVED");
  const shouldActivateDomainContext =
    Boolean(domainContext) && !isSameContext(activeContext, domainContext);

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

  const shouldBlockDomain =
    Boolean(user && token) &&
    !redirectTo &&
    !domainContext &&
    !hasLegacyAccess;
  const deniedAccess = shouldBlockDomain
    ? resolveDeniedDomainAccessNotice("resultados", auth)
    : null;
  const tenantContext =
    activeContext?.type === "TENANT"
      ? activeContext
      : availableContexts.find((context) => context.type === "TENANT") ?? null;

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  useEffect(() => {
    if (domainContext && shouldActivateDomainContext) {
      dispatch(setActiveContext(domainContext));
    }
  }, [dispatch, domainContext, shouldActivateDomainContext]);

  if (redirectTo) {
    return null;
  }

  if (shouldActivateDomainContext) {
    return null;
  }

  if (shouldBlockDomain) {
    return (
      <DomainAccessNotice
        message={deniedAccess?.message ?? "Tu usuario no tiene acceso territorial aprobado."}
        description={deniedAccess?.description}
        registerPath={buildRegisterPathWithPrefill(deniedAccess?.registerPath, user)}
        registerLabel="Registrarme en resultados"
        homePath={resolveBlockedHomeByContext("resultados", activeContext)}
        alternatePath={tenantContext ? resolveHomeByContext(tenantContext) : undefined}
        alternateLabel={tenantContext ? "Ir a votación" : undefined}
      />
    );
  }

  return <>{children}</>;
}
