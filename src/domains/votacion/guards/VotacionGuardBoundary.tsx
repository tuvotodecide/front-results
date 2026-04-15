"use client";

import { Component } from "react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
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

interface VotacionGuardBoundaryProps {
  children: ReactNode;
  access: "public" | "private";
}

type BoundaryState = {
  hasError: boolean;
};

class VotacionRuntimeBoundary extends Component<
  VotacionGuardBoundaryProps,
  BoundaryState
> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch() {
    // Route-level error.tsx handles the main error UX; this is a last-resort
    // client fallback to avoid rendering an empty tree.
  }

  private readonly handleRetry = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            No se pudo renderizar la vista de votación.
          </h1>
          <p className="max-w-md text-sm text-gray-600">
            Se activó el boundary de runtime para la vista {this.props.access}.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-md bg-[#006237] px-4 py-2 text-sm font-medium text-white"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function VotacionGuardBoundary(
  props: VotacionGuardBoundaryProps,
) {
  return (
    <VotacionDomainGuard access={props.access}>
      <VotacionRuntimeBoundary {...props} />
    </VotacionDomainGuard>
  );
}

function VotacionDomainGuard({
  children,
  access,
}: {
  children: ReactNode;
  access: VotacionGuardBoundaryProps["access"];
}) {
  const auth = useSelector(selectAuth);
  const dispatch = useDispatch();
  const pathname = usePathname() ?? "";
  const domainContext = findContextForDomain(auth.availableContexts, "votacion");
  const hasLegacyAccess =
    !domainContext &&
    auth.availableContexts.length === 0 &&
    (auth.user?.role === "SUPERADMIN" || auth.user?.role === "TENANT_ADMIN");
  const shouldActivateDomainContext =
    Boolean(domainContext) && !isSameContext(auth.activeContext, domainContext);
  const shouldCheckDomain =
    access === "public" && pathname.startsWith("/votacion") && Boolean(auth.token);
  const shouldBlockDomain =
    shouldCheckDomain && !domainContext && !hasLegacyAccess;

  useEffect(() => {
    if (shouldCheckDomain && domainContext && shouldActivateDomainContext) {
      dispatch(setActiveContext(domainContext));
    }
  }, [dispatch, domainContext, shouldActivateDomainContext, shouldCheckDomain]);

  if (shouldCheckDomain && shouldActivateDomainContext) return null;

  if (shouldBlockDomain) {
    return (
      <DomainAccessNotice
        message={getBlockedAccessMessage("votacion", auth.accessStatus)}
        registerPath={buildRegisterPathWithPrefill(
          getRegisterPathForDomain("votacion") ?? "/votacion/registrarse",
          auth.user,
        )}
        registerLabel="Registrarme en votación"
        homePath={resolveBlockedHomeByContext("votacion", auth.activeContext)}
      />
    );
  }

  return <>{children}</>;
}
