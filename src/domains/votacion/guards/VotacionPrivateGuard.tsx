"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
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

const WALLET_REGULARIZATION_PATH = "/votacion/cuenta-institucional";

const tenantContextRequiresWalletUpdate = (
  auth: ReturnType<typeof selectAuth>,
) => {
  const tenantId =
    auth.activeContext?.type === "TENANT"
      ? auth.activeContext.tenantId
      : auth.user?.tenantId;
  const activeRequiresUpdate =
    auth.activeContext?.type === "TENANT" &&
    auth.activeContext.requiresWalletUpdate === true;
  const statusRequiresUpdate = auth.accessStatus?.tenant.items.some(
    (item) =>
      item.tenantId === tenantId && item.requiresWalletUpdate === true,
  );

  return Boolean(activeRequiresUpdate || statusRequiresUpdate);
};

export default function VotacionPrivateGuard({
  children,
}: VotacionPrivateGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
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
  const requiresWalletUpdate =
    Boolean(user && token) &&
    !redirectTo &&
    !shouldBlockDomain &&
    tenantContextRequiresWalletUpdate(auth);
  const isWalletRegularizationRoute =
    (pathname ?? "").startsWith(WALLET_REGULARIZATION_PATH);

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  useEffect(() => {
    if (requiresWalletUpdate && !isWalletRegularizationRoute) {
      router.replace(WALLET_REGULARIZATION_PATH);
    }
  }, [isWalletRegularizationRoute, requiresWalletUpdate, router]);

  useEffect(() => {
    if (domainContext && shouldActivateDomainContext) {
      dispatch(setActiveContext(domainContext));
    }
  }, [dispatch, domainContext, shouldActivateDomainContext]);

  if (redirectTo) {
    return null;
  }

  if (requiresWalletUpdate && !isWalletRegularizationRoute) {
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
