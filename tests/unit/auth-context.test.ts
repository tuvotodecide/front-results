import { authSlice, setActiveContext, setAuth, type AuthState } from "@/store/auth/authSlice";
import {
  getInstitutionalContexts,
  isContextAllowedForDomain,
  requiresInstitutionSelection,
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

describe("MX-03 | Autenticación, sesiones, roles y permisos | Frontend Admin | Contextos auth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("AUT-LOG-P0-002 | activa un único contexto por defecto después del login", () => {
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

  it("MULTI-INS-02 | con dos instituciones no activa la primera y exige selección", () => {
    const state = authSlice.reducer(
      baseState,
      setAuth({
        accessToken: token,
        role: "TENANT_ADMIN",
        active: true,
        availableContexts: [
          { type: "TENANT", tenantId: "tenant-a", tenantName: "Universidad A" },
          { type: "TENANT", tenantId: "tenant-b", tenantName: "Universidad B" },
        ],
        // The frontend must still protect against an incomplete backend flag.
        requiresContextSelection: false,
        defaultContext: { type: "TENANT", tenantId: "tenant-a" },
        user: {
          id: "user-1",
          email: "tenant@test.com",
          name: "Tenant",
          role: "TENANT_ADMIN",
          active: true,
        },
      }),
    );

    expect(state.requiresContextSelection).toBe(true);
    expect(state.activeContext).toBeNull();
    expect(requiresInstitutionSelection(state.availableContexts, state.activeContext)).toBe(true);
    expect(resolveDomainLogin(state, "votacion")).toMatchObject({
      kind: "selection_required",
      contexts: [
        { tenantId: "tenant-a" },
        { tenantId: "tenant-b" },
      ],
    });
  });

  it("MULTI-INS-05 | conserva un contexto institucional persistido válido con su rol actual", () => {
    const state = authSlice.reducer(
      baseState,
      setAuth({
        accessToken: token,
        role: "TENANT_ADMIN",
        availableContexts: [
          { type: "TENANT", tenantId: "tenant-a", tenantName: "Universidad A", role: "PRIMARY" },
          { type: "TENANT", tenantId: "tenant-b", tenantName: "Universidad B", role: "SECONDARY" },
        ],
        activeContext: { type: "TENANT", tenantId: "tenant-b", role: "OLD_ROLE" },
        user: { id: "user-1", email: "tenant@test.com", name: "Tenant", role: "TENANT_ADMIN", active: true },
      }),
    );

    expect(state.activeContext).toMatchObject({
      tenantId: "tenant-b",
      tenantName: "Universidad B",
      role: "SECONDARY",
    });
    expect(requiresInstitutionSelection(state.availableContexts, state.activeContext)).toBe(false);
  });

  it("MULTI-INS-06/07 | descarta un contexto persistido inválido sin elegir A si quedan varias", () => {
    const oneInstitution = authSlice.reducer(
      baseState,
      setAuth({
        accessToken: token,
        availableContexts: [{ type: "TENANT", tenantId: "tenant-a", tenantName: "Universidad A" }],
        activeContext: { type: "TENANT", tenantId: "tenant-b", tenantName: "Universidad B" },
        user: { id: "user-1", email: "tenant@test.com", name: "Tenant", role: "TENANT_ADMIN", active: true },
      }),
    );
    const multipleInstitutions = authSlice.reducer(
      baseState,
      setAuth({
        accessToken: token,
        availableContexts: [
          { type: "TENANT", tenantId: "tenant-a", tenantName: "Universidad A" },
          { type: "TENANT", tenantId: "tenant-b", tenantName: "Universidad B" },
        ],
        activeContext: { type: "TENANT", tenantId: "tenant-c", tenantName: "Universidad C" },
        defaultContext: { type: "TENANT", tenantId: "tenant-a" },
        user: { id: "user-1", email: "tenant@test.com", name: "Tenant", role: "TENANT_ADMIN", active: true },
      }),
    );

    expect(oneInstitution.activeContext).toMatchObject({ tenantId: "tenant-a" });
    expect(multipleInstitutions.activeContext).toBeNull();
    expect(getInstitutionalContexts(multipleInstitutions.availableContexts)).toHaveLength(2);
    expect(resolveDomainLogin(multipleInstitutions, "votacion")).toMatchObject({
      kind: "selection_required",
    });
  });

  it("AUT-SES-P0-001 | resuelve múltiples contextos aprobados según dominio de entrada", () => {
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

  it("AUT-LOG-P0-003 / AUT-APR-P0-001 | enruta ACCESS_APPROVER solo a aprobaciones", () => {
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

  it("AUT-APR-P0-001 | prioriza aprobaciones para ACCESS_APPROVER aunque exista tenant", () => {
    const approvalsContext = {
      type: "ACCESS_APPROVALS" as const,
      role: "ACCESS_APPROVER",
      label: "Aprobador de accesos",
    };

    expect(
      resolveDomainLogin(
        {
          ...baseState,
          role: "ACCESS_APPROVER",
          availableContexts: [
            { type: "TENANT", tenantId: "tenant-1" },
            approvalsContext,
          ],
        },
        "votacion",
      ),
    ).toMatchObject({
      kind: "allowed",
      context: approvalsContext,
      redirectTo: "/aprobaciones",
    });
  });

  it("AUT-GRD-P0-002 | deniega login de dominio cuando falta el contexto", () => {
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

  it("AUT-STA-P0-002 | resuelve aprobación territorial pendiente sin CTA de registro", () => {
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

    const deniedNotice = resolveDeniedDomainAccessNotice("resultados", {
      accessStatus: null,
      user: {
        id: "user-2",
        email: "mayor@test.com",
        name: "Mayor",
        role: "MAYOR",
        active: true,
        territorialAccessStatus: "PENDING_APPROVAL",
      },
    });

    expect(deniedNotice).toMatchObject({
      kind: "denied",
      message: "Tu solicitud territorial está pendiente de aprobación.",
    });
    expect(deniedNotice).not.toHaveProperty("registerPath");
  });

  it("AUT-SES-P0-001 | persiste cambios de activeContext", () => {
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
