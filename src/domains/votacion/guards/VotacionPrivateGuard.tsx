"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { selectAuth, setActiveContext } from "@/store/auth/authSlice";
import {
  findContextForDomain,
  getBlockedAccessMessage,
  getRegisterPathForDomain,
  isSameContext,
  resolveBlockedHomeByContext,
} from "@/store/auth/contextUtils";
import DomainAccessNotice from "@/domains/auth-context/DomainAccessNotice";
import { buildRegisterPathWithPrefill } from "@/domains/auth-context/registerPrefill";

interface VotacionPrivateGuardProps {
  children: ReactNode;
}

export default function VotacionPrivateGuard({
  children,
}: VotacionPrivateGuardProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const { user, token, activeContext, availableContexts } = auth;

  const status = user?.status ?? (user?.active ? "ACTIVE" : "PENDING");
  const domainContext = findContextForDomain(availableContexts, "votacion");
  const hasLegacyAccess =
    !domainContext &&
    availableContexts.length === 0 &&
    (user?.role === "SUPERADMIN" || user?.role === "TENANT_ADMIN");
  const shouldActivateDomainContext =
    Boolean(domainContext) && !isSameContext(activeContext, domainContext);

  let redirectTo: string | null = null;

  if (!user || !token) {
    redirectTo = "/votacion/login";
  } else if (status === "PENDING") {
    redirectTo = "/votacion/pendiente";
  } else if (status === "REJECTED" || status === "INACTIVE") {
    redirectTo = "/votacion/rechazado";
  }

  const shouldBlockDomain =
    Boolean(user && token) &&
    !redirectTo &&
    !domainContext &&
    !hasLegacyAccess;

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
        message={getBlockedAccessMessage("votacion", auth.accessStatus)}
        registerPath={buildRegisterPathWithPrefill(
          getRegisterPathForDomain("votacion") ?? "/votacion/registrarse",
          user,
        )}
        registerLabel="Registrarme en votación"
        homePath={resolveBlockedHomeByContext("votacion", activeContext)}
      />
    );
  }

  return <>{children}</>;
}
