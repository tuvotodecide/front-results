"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { selectAuth, setActiveContext } from "@/store/auth/authSlice";
import {
  findContextForDomain,
  getBlockedAccessMessage,
  isSameContext,
} from "@/store/auth/contextUtils";
import DomainAccessNotice from "@/domains/auth-context/DomainAccessNotice";

export default function AccessApprovalsGuard({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/aprobaciones";
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const domainContext = findContextForDomain(auth.availableContexts, "approvals");
  const hasLegacyAccess =
    !domainContext &&
    auth.availableContexts.length === 0 &&
    (auth.user?.role === "SUPERADMIN" ||
      auth.user?.role === "ACCESS_APPROVER");
  const shouldActivateDomainContext =
    Boolean(domainContext) && !isSameContext(auth.activeContext, domainContext);

  let redirectTo: string | null = null;

  if (!auth.token || !auth.user) {
    redirectTo = `/resultados/login?from=${encodeURIComponent(pathname)}`;
  }

  const shouldBlockDomain =
    Boolean(auth.token && auth.user) &&
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

  if (redirectTo) return null;
  if (shouldActivateDomainContext) return null;

  if (shouldBlockDomain) {
    return (
      <DomainAccessNotice
        message={getBlockedAccessMessage("approvals", auth.accessStatus)}
        homePath="/"
      />
    );
  }

  return <>{children}</>;
}
