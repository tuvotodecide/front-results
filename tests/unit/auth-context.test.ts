import { authSlice, setActiveContext, setAuth, type AuthState } from "@/store/auth/authSlice";
import {
  isContextAllowedForDomain,
  resolveDeniedDomainAccessNotice,
  resolveDomainLogin,
  resolveHomeByContext,
  resolvePostLoginRedirect,
} from "@/store/auth/contextUtils";

const token =
  "e30.eyJzdWIiOiJ1c2VyLTEiLCJyb2xlIjoiQURNSU4iLCJhY3RpdmUiOnRydWUsImV4cCI6NDEwMjQ0NDgwMH0.sig";

const baseState: AuthState = {
  token: null,
  accessToken: null,
  role: null,
  active: false,
  tenantId: null,
  availableContexts: [],
  requiresContextSelection: false,
  defaultContext: null,
  activeContext: null,
  accessStatus: null,
  user: null,
};

describe("auth multi-context", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("activates a single default context after login", () => {
    const state = authSlice.reducer(
      baseState,
      setAuth({
        accessToken: token,
        role: "TENANT_ADMIN",
        active: true,
        availableContexts: [{ type: "TENANT", tenantId: "tenant-1" }],
        requiresContextSelection: false,
        defaultContext: { type: "TENANT", tenantId: "tenant-1" },
        user: {
          id: "user-1",
          email: "tenant@test.com",
          name: "Tenant",
          role: "TENANT_ADMIN",
          active: true,
        },
      }),
    );

    expect(state.activeContext).toMatchObject({
      type: "TENANT",
      tenantId: "tenant-1",
    });
    expect(resolvePostLoginRedirect(state)).toBe("/votacion/elecciones");
  });

  it("resolves multiple approved contexts by the entry domain", () => {
    const state = authSlice.reducer(
      baseState,
      setAuth({
        accessToken: token,
        role: "ADMIN",
        active: true,
        availableContexts: [
          { type: "TERRITORIAL", role: "MAYOR", votingDepartmentId: "dep-1" },
          { type: "TENANT", tenantId: "tenant-1" },
        ],
        requiresContextSelection: true,
        defaultContext: null,
        user: {
          id: "user-1",
          email: "admin@test.com",
          name: "Admin",
          role: "SUPERADMIN",
          active: true,
        },
      }),
    );

    expect(state.activeContext).toBeNull();
    expect(resolveDomainLogin(state, "votacion")).toMatchObject({
      kind: "allowed",
      context: { type: "TENANT", tenantId: "tenant-1" },
      redirectTo: "/votacion/elecciones",
    });
    expect(resolveDomainLogin(state, "resultados")).toMatchObject({
      kind: "allowed",
      context: { type: "TERRITORIAL", votingDepartmentId: "dep-1" },
      redirectTo: "/resultados?department=dep-1",
    });
  });

  it("routes ACCESS_APPROVER only to approvals", () => {
    const context = {
      type: "ACCESS_APPROVALS" as const,
      role: "ACCESS_APPROVER",
      label: "Aprobador de accesos",
    };

    expect(resolveHomeByContext(context)).toBe("/aprobaciones");
    expect(isContextAllowedForDomain(context, "approvals")).toBe(true);
    expect(isContextAllowedForDomain(context, "votacion")).toBe(false);
    expect(isContextAllowedForDomain(context, "resultados")).toBe(false);
    expect(
      resolveDomainLogin(
        {
          ...baseState,
          role: "ACCESS_APPROVER",
          availableContexts: [context],
        },
        "votacion",
      ),
    ).toMatchObject({
      kind: "allowed",
      context,
      redirectTo: "/aprobaciones",
    });
  });

  it("denies a domain login when the user lacks that domain context", () => {
    expect(
      resolveDomainLogin(
        {
          ...baseState,
          role: "TENANT_ADMIN",
          availableContexts: [{ type: "TENANT", tenantId: "tenant-1" }],
        },
        "resultados",
      ),
    ).toMatchObject({
      kind: "denied",
      message: "Tu usuario no tiene acceso territorial aprobado.",
      registerPath: "/resultados/registrarse",
    });
  });

  it("resolves pending territorial approval without a register CTA", () => {
    expect(
      resolveDomainLogin(
        {
          ...baseState,
          role: "MAYOR",
          user: {
            id: "user-2",
            email: "mayor@test.com",
            name: "Mayor",
            role: "MAYOR",
            active: true,
            territorialAccessStatus: "PENDING_APPROVAL",
          },
        },
        "resultados",
      ),
    ).toMatchObject({
      kind: "denied",
      message: "Tu solicitud territorial está pendiente de aprobación.",
    });

    expect(
      resolveDeniedDomainAccessNotice("resultados", {
        accessStatus: null,
        user: {
          id: "user-2",
          email: "mayor@test.com",
          name: "Mayor",
          role: "MAYOR",
          active: true,
          territorialAccessStatus: "PENDING_APPROVAL",
        },
      }),
    ).toMatchObject({
      kind: "denied",
      message: "Tu solicitud territorial está pendiente de aprobación.",
      registerPath: undefined,
    });
  });

  it("persists activeContext changes", () => {
    const loggedIn = authSlice.reducer(
      baseState,
      setAuth({
        accessToken: token,
        role: "ADMIN",
        active: true,
        availableContexts: [
          { type: "GLOBAL_ADMIN" },
          { type: "TENANT", tenantId: "tenant-2" },
        ],
        requiresContextSelection: true,
        user: {
          id: "user-1",
          email: "admin@test.com",
          name: "Admin",
          role: "SUPERADMIN",
          active: true,
        },
      }),
    );
    const selected = authSlice.reducer(
      loggedIn,
      setActiveContext({ type: "TENANT", tenantId: "tenant-2" }),
    );

    expect(selected.activeContext).toMatchObject({
      type: "TENANT",
      tenantId: "tenant-2",
    });
    expect(localStorage.getItem("authSession")).toContain("tenant-2");
  });
});
