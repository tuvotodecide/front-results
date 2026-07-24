import { authSlice, logOut, setAuth, type AuthState } from "@/store/auth/authSlice";
import {
  resolveDomainLogin,
  resolvePostLoginRedirect,
} from "@/store/auth/contextUtils";

const token =
  "e30.eyJzdWIiOiJ1c2VyLTEiLCJyb2xlIjoiQUNDRVNTX0FQUFJPVkVSIiwiYWN0aXZlIjp0cnVlLCJleHAiOjQxMDI0NDQ4MDB9.sig";

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

describe("auth roles and navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie
      .split(";")
      .map((cookie) => cookie.split("=")[0]?.trim())
      .filter(Boolean)
      .forEach((name) => {
        document.cookie = `${name}=; Max-Age=0; Path=/`;
      });
  });

  it("keeps ACCESS_APPROVER inside approvals even when a requested route belongs to another domain", () => {
    const auth = {
      ...baseState,
      token,
      accessToken: token,
      role: "ACCESS_APPROVER",
      active: true,
      user: {
        id: "approver-1",
        email: "approver@test.local",
        name: "Aprobador",
        role: "ACCESS_APPROVER" as const,
        active: true,
      },
      availableContexts: [
        {
          type: "ACCESS_APPROVALS" as const,
          role: "ACCESS_APPROVER",
          label: "Aprobador de accesos",
        },
      ],
      activeContext: {
        type: "ACCESS_APPROVALS" as const,
        role: "ACCESS_APPROVER",
        label: "Aprobador de accesos",
      },
    };

    expect(resolveDomainLogin(auth, "resultados")).toMatchObject({
      kind: "allowed",
      redirectTo: "/aprobaciones",
    });
    expect(resolvePostLoginRedirect(auth, "/resultados/panel")).toBe("/aprobaciones");
    expect(resolvePostLoginRedirect(auth, "/aprobaciones")).toBe("/aprobaciones");
  });

  it("routes global superadmin sessions to /superadmin", () => {
    const auth = {
      ...baseState,
      token,
      accessToken: token,
      role: "SUPERADMIN",
      active: true,
      user: {
        id: "superadmin-1",
        email: "superadmin@test.local",
        name: "Superadmin",
        role: "SUPERADMIN" as const,
        active: true,
      },
      availableContexts: [
        {
          type: "GLOBAL_ADMIN" as const,
          role: "SUPERADMIN",
          label: "Administrador global",
        },
      ],
      activeContext: {
        type: "GLOBAL_ADMIN" as const,
        role: "SUPERADMIN",
        label: "Administrador global",
      },
    };

    expect(resolveDomainLogin(auth, "resultados")).toMatchObject({
      kind: "allowed",
      redirectTo: "/superadmin",
    });
    expect(resolvePostLoginRedirect(auth, "/resultados/panel")).toBe("/superadmin");
    expect(resolvePostLoginRedirect(auth, "/votacion/elecciones/new")).toBe("/superadmin");
    expect(resolvePostLoginRedirect(auth, "/superadmin/tvd/contrato")).toBe(
      "/superadmin/tvd/contrato",
    );
  });

  it("clears auth state and browser session keys on logout", () => {
    localStorage.setItem("token", "token");
    localStorage.setItem("user", "{}");
    localStorage.setItem("selectedElectionId", "election-1");
    localStorage.setItem("pendingEmail", "pending@test.local");
    localStorage.setItem("pendingReason", "SUPERADMIN_APPROVAL");
    localStorage.setItem("authSession", "{}");
    localStorage.setItem("authActiveContext", "{}");
    localStorage.setItem("availableContexts", "[]");
    localStorage.setItem("accessStatus", "{}");

    const loggedIn = authSlice.reducer(
      baseState,
      setAuth({
        accessToken: token,
        role: "ACCESS_APPROVER",
        active: true,
        availableContexts: [
          {
            type: "ACCESS_APPROVALS",
            role: "ACCESS_APPROVER",
          },
        ],
        defaultContext: {
          type: "ACCESS_APPROVALS",
          role: "ACCESS_APPROVER",
        },
        user: {
          id: "approver-1",
          email: "approver@test.local",
          name: "Aprobador",
          role: "ACCESS_APPROVER",
          active: true,
        },
      }),
    );

    const loggedOut = authSlice.reducer(loggedIn, logOut());

    expect(loggedOut).toMatchObject({
      token: null,
      accessToken: null,
      role: null,
      active: false,
      availableContexts: [],
      activeContext: null,
      user: null,
    });
    [
      "token",
      "user",
      "selectedElectionId",
      "pendingEmail",
      "pendingReason",
      "authSession",
      "authActiveContext",
      "availableContexts",
      "accessStatus",
    ].forEach((key) => {
      expect(localStorage.getItem(key)).toBeNull();
    });
  });
});
