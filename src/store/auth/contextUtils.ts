import type { AccessStatus, AuthContext, AuthContextType, AuthState } from "./authSlice";

export type AuthDomain = "votacion" | "resultados" | "approvals";
export type DomainLoginResult =
  | { kind: "allowed"; context: AuthContext; redirectTo: string }
  | {
      kind: "denied";
      message: string;
      registerPath?: string;
      description?: string;
    };
export type DomainDeniedLoginResult = Extract<DomainLoginResult, { kind: "denied" }>;

type DomainAccessAuth = Pick<
  AuthState,
  "availableContexts" | "activeContext" | "defaultContext" | "accessStatus"
> &
  Partial<Pick<AuthState, "role" | "user">>;

const domainAllowedContexts: Record<AuthDomain, AuthContextType[]> = {
  votacion: ["TENANT", "GLOBAL_ADMIN"],
  resultados: ["TERRITORIAL", "GLOBAL_ADMIN"],
  approvals: ["ACCESS_APPROVALS", "GLOBAL_ADMIN"],
};

export const isContextAllowedForDomain = (
  context: AuthContext | null | undefined,
  domain: AuthDomain,
) => Boolean(context && domainAllowedContexts[domain].includes(context.type));

export const getContextKey = (context: AuthContext | null | undefined) => {
  if (!context) return "";

  return [
    context.type,
    context.role ?? "",
    context.tenantId ?? "",
    context.membershipId ?? "",
    context.votingDepartmentId ?? "",
    context.votingMunicipalityId ?? "",
  ].join(":");
};

export const isSameContext = (
  first: AuthContext | null | undefined,
  second: AuthContext | null | undefined,
) => getContextKey(first) === getContextKey(second);

export const hasContextForDomain = (
  contexts: AuthContext[],
  domain: AuthDomain,
) => contexts.some((context) => isContextAllowedForDomain(context, domain));

export const findContextForDomain = (
  contexts: AuthContext[],
  domain: AuthDomain,
) => {
  if (domain === "votacion") {
    return (
      contexts.find((context) => context.type === "TENANT") ??
      contexts.find((context) => context.type === "GLOBAL_ADMIN") ??
      null
    );
  }

  if (domain === "resultados") {
    return (
      contexts.find((context) => context.type === "TERRITORIAL") ??
      contexts.find((context) => context.type === "GLOBAL_ADMIN") ??
      null
    );
  }

  return (
    contexts.find((context) => context.type === "ACCESS_APPROVALS") ??
    contexts.find((context) => context.type === "GLOBAL_ADMIN") ??
    null
  );
};

export const resolveHomeByContext = (context: AuthContext | null | undefined) => {
  if (!context) return "/";

  if (context.type === "GLOBAL_ADMIN") {
    return "/resultados/panel";
  }

  if (context.type === "TERRITORIAL") {
    const department = context.votingDepartmentId;
    const municipality = context.votingMunicipalityId;
    if (department && municipality) {
      return `/resultados?department=${department}&municipality=${municipality}`;
    }
    if (department) {
      return `/resultados?department=${department}`;
    }
    return "/resultados";
  }

  if (context.type === "TENANT") {
    return "/votacion/elecciones";
  }

  if (context.type === "ACCESS_APPROVALS") {
    return "/aprobaciones";
  }

  return "/";
};

export const resolveBlockedHomeByContext = (
  domain: AuthDomain,
  context: AuthContext | null | undefined,
) => {
  if (context?.type === "TENANT" && domain === "resultados") {
    return "/votacion";
  }

  if (context?.type === "TERRITORIAL" && domain === "votacion") {
    return "/resultados";
  }

  if (context?.type === "ACCESS_APPROVALS") {
    return "/aprobaciones";
  }

  if (context?.type === "GLOBAL_ADMIN") {
    return resolveHomeByContext(context);
  }

  return domain === "resultados" ? "/resultados" : "/votacion";
};

export const getContextLabel = (context: AuthContext) => {
  if (context.label) return context.label;

  if (context.type === "GLOBAL_ADMIN") return "Administrador global";

  if (context.type === "TERRITORIAL") {
    const role = context.role === "MAYOR" ? "Municipal" : context.role === "GOVERNOR" ? "Departamental" : "Territorial";
    const scope = [context.votingDepartmentId, context.votingMunicipalityId]
      .filter(Boolean)
      .join(" / ");
    return scope ? `${role} - ${scope}` : role;
  }

  if (context.type === "TENANT") {
    return context.tenantName ? `Institución: ${context.tenantName}` : "Institución";
  }

  if (context.type === "ACCESS_APPROVALS") return "Aprobador de accesos";

  return "Contexto";
};

export const getBlockedAccessMessage = (
  domain: AuthDomain,
  _accessStatus: AccessStatus | null,
) => {
  if (domain === "votacion") {
    return "Tu usuario no tiene acceso institucional aprobado.";
  }

  if (domain === "resultados") {
    return "Tu usuario no tiene acceso territorial aprobado.";
  }

  return "Tu usuario no tiene acceso al módulo de aprobaciones.";
};

const resolveDeniedDomainAccess = (
  domain: AuthDomain,
  accessStatus: AccessStatus | null,
  user?: AuthState["user"] | null,
): DomainDeniedLoginResult => {
  if (domain === "votacion") {
    const tenantStatus = accessStatus?.tenant.latestStatus ?? null;

    if (tenantStatus === "PENDING") {
      return {
        kind: "denied",
        message: "La solicitud institucional está pendiente de aprobación.",
        description:
          "Tu solicitud de acceso institucional ya fue recibida y sigue en revisión.",
      };
    }

    if (tenantStatus === "REJECTED") {
      return {
        kind: "denied",
        message:
          accessStatus?.tenant.items.find((item) => item.status === "REJECTED")
            ?.reason ||
          accessStatus?.tenant.message ||
          "La solicitud institucional fue rechazada.",
        registerPath: accessStatus?.tenant.canRequest
          ? getRegisterPathForDomain(domain)
          : undefined,
      };
    }

    if (tenantStatus === "REVOKED") {
      return {
        kind: "denied",
        message:
          accessStatus?.tenant.items.find((item) => item.status === "REVOKED")
            ?.reason ||
          accessStatus?.tenant.message ||
          "El acceso institucional fue revocado.",
        registerPath: accessStatus?.tenant.canRequest
          ? getRegisterPathForDomain(domain)
          : undefined,
      };
    }
  }

  if (domain === "resultados") {
    const territorialStatus =
      accessStatus?.territorial.status ??
      user?.territorialAccessStatus ??
      "NONE";
    const territorialReason =
      accessStatus?.territorial.reason ??
      user?.territorialAccessReason ??
      null;
    const territorialMessage =
      accessStatus?.territorial.message ??
      user?.territorialAccessReason ??
      null;
    const canRequest =
      accessStatus?.territorial.canRequest ?? territorialStatus === "NONE";

    if (territorialStatus === "PENDING_EMAIL_VERIFICATION") {
      return {
        kind: "denied",
        message: "Tu solicitud territorial requiere verificación de correo.",
        description:
          "Revisa tu correo y completa la verificación para continuar con el proceso territorial.",
      };
    }

    if (territorialStatus === "PENDING_APPROVAL") {
      return {
        kind: "denied",
        message: "Tu solicitud territorial está pendiente de aprobación.",
        description:
          "Tu solicitud de acceso territorial ya fue recibida y sigue en revisión.",
      };
    }

    if (territorialStatus === "REJECTED") {
      return {
        kind: "denied",
        message:
          territorialReason ||
          territorialMessage ||
          "La solicitud territorial fue rechazada.",
        registerPath: canRequest
          ? getRegisterPathForDomain(domain)
          : undefined,
      };
    }

    if (territorialStatus === "REVOKED") {
      return {
        kind: "denied",
        message:
          territorialReason ||
          territorialMessage ||
          "El acceso territorial fue revocado.",
        registerPath: canRequest
          ? getRegisterPathForDomain(domain)
          : undefined,
      };
    }
  }

  return {
    kind: "denied",
    message: getBlockedAccessMessage(domain, accessStatus),
    registerPath: getRegisterPathForDomain(domain),
  };
};

export const getRegisterPathForDomain = (domain: AuthDomain) => {
  if (domain === "votacion") return "/votacion/registrarse";
  if (domain === "resultados") return "/resultados/registrarse";
  return undefined;
};

export const resolveDeniedDomainAccessNotice = (
  domain: AuthDomain,
  auth: Pick<AuthState, "accessStatus"> & Partial<Pick<AuthState, "user">>,
) => resolveDeniedDomainAccess(domain, auth.accessStatus, auth.user);

export const resolveDomainLogin = (
  auth: DomainAccessAuth,
  domain: AuthDomain,
): DomainLoginResult => {
  const contexts = auth.availableContexts;
  const globalAdminContext = contexts.find(
    (context) => context.type === "GLOBAL_ADMIN",
  );
  const isAdminRole = ["ADMIN", "SUPERADMIN"].includes(
    String(auth.role ?? "").toUpperCase(),
  );

  if (globalAdminContext && isAdminRole) {
    return {
      kind: "allowed",
      context: globalAdminContext,
      redirectTo: resolveHomeByContext(globalAdminContext),
    };
  }

  const accessApprovalsContext = contexts.find(
    (context) => context.type === "ACCESS_APPROVALS",
  );

  if (accessApprovalsContext && !findContextForDomain(contexts, domain)) {
    return {
      kind: "allowed",
      context: accessApprovalsContext,
      redirectTo: resolveHomeByContext(accessApprovalsContext),
    };
  }

  const context = findContextForDomain(contexts, domain);
  if (context) {
    return {
      kind: "allowed",
      context,
      redirectTo: resolveHomeByContext(context),
    };
  }

  return resolveDeniedDomainAccess(domain, auth.accessStatus, auth.user);
};

export const resolvePostLoginRedirect = (
  auth: Pick<
    AuthState,
    | "availableContexts"
    | "requiresContextSelection"
    | "defaultContext"
    | "activeContext"
    | "accessStatus"
  >,
  requestedPath?: string | null,
) => {
  const context =
    auth.activeContext ??
    auth.defaultContext ??
    (auth.availableContexts.length === 1 ? auth.availableContexts[0] : null);

  if (!context) {
    return "/";
  }

  if (requestedPath) {
    if (
      requestedPath.startsWith("/votacion") &&
      isContextAllowedForDomain(context, "votacion")
    ) {
      return requestedPath;
    }
    if (
      requestedPath.startsWith("/resultados") &&
      isContextAllowedForDomain(context, "resultados")
    ) {
      return requestedPath;
    }
    if (
      requestedPath.startsWith("/aprobaciones") &&
      isContextAllowedForDomain(context, "approvals")
    ) {
      return requestedPath;
    }
  }

  return resolveHomeByContext(context);
};
