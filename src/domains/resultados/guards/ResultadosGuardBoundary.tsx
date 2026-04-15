"use client";

import { Component } from "react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
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

interface ResultadosGuardBoundaryProps {
  children: ReactNode;
  access: "public" | "private";
}

type BoundaryState = {
  hasError: boolean;
};

class ResultadosRuntimeBoundary extends Component<
  ResultadosGuardBoundaryProps,
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
            No se pudo renderizar la vista de resultados.
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

export default function ResultadosGuardBoundary(
  props: ResultadosGuardBoundaryProps,
) {
  return (
    <ResultadosDomainGuard access={props.access}>
      <ResultadosRuntimeBoundary {...props} />
    </ResultadosDomainGuard>
  );
}

function ResultadosDomainGuard({
  children,
  access,
}: {
  children: ReactNode;
  access: ResultadosGuardBoundaryProps["access"];
}) {
  const auth = useSelector(selectAuth);
  const dispatch = useDispatch();
  const pathname = usePathname() ?? "";
  const territorialStatus =
    auth.accessStatus?.territorial.status ??
    auth.user?.territorialAccessStatus ??
    null;
  const domainContext = findContextForDomain(
    auth.availableContexts,
    "resultados",
  );
  const hasLegacyAccess =
    !domainContext &&
    auth.availableContexts.length === 0 &&
    (auth.user?.role === "SUPERADMIN" ||
      auth.user?.role === "MAYOR" ||
      auth.user?.role === "GOVERNOR") &&
    (!territorialStatus || territorialStatus === "APPROVED");
  const shouldActivateDomainContext =
    Boolean(domainContext) && !isSameContext(auth.activeContext, domainContext);
  const shouldCheckDomain =
    access === "public" &&
    pathname.startsWith("/resultados") &&
    Boolean(auth.token);
  const shouldBlockDomain =
    shouldCheckDomain && !domainContext && !hasLegacyAccess;
  const deniedAccess = shouldBlockDomain
    ? resolveDeniedDomainAccessNotice("resultados", auth)
    : null;
  const tenantContext =
    auth.activeContext?.type === "TENANT"
      ? auth.activeContext
      : auth.availableContexts.find((context) => context.type === "TENANT") ?? null;

  useEffect(() => {
    if (shouldCheckDomain && domainContext && shouldActivateDomainContext) {
      dispatch(setActiveContext(domainContext));
    }
  }, [dispatch, domainContext, shouldActivateDomainContext, shouldCheckDomain]);

  if (shouldCheckDomain && shouldActivateDomainContext) return null;

  if (shouldBlockDomain) {
    return (
      <DomainAccessNotice
        message={deniedAccess?.message ?? "Tu usuario no tiene acceso territorial aprobado."}
        description={deniedAccess?.description}
        registerPath={buildRegisterPathWithPrefill(
          deniedAccess?.registerPath,
          auth.user,
        )}
        registerLabel="Registrarme en resultados"
        homePath={resolveBlockedHomeByContext("resultados", auth.activeContext)}
        alternatePath={tenantContext ? resolveHomeByContext(tenantContext) : undefined}
        alternateLabel={tenantContext ? "Ir a votación" : undefined}
      />
    );
  }

  return <>{children}</>;
}
