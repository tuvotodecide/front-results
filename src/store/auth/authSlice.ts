import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../index";
import { jwtDecode } from "jwt-decode";
import {
  removeCookie,
  readStorage,
  removeStorage,
  writeCookie,
  writeStorage,
} from "../../shared/system/browserStorage";
type JwtPayload = {
  sub?: string;
  dni?: string;
  role?: string;
  active?: boolean;
  votingDepartmentId?: string;
  votingMunicipalityId?: string;
  tenantId?: string;
  exp?: number;
};

export type AuthContextType =
  | "GLOBAL_ADMIN"
  | "TERRITORIAL"
  | "TENANT"
  | "ACCESS_APPROVALS";

export type AuthRole =
  | "SUPERADMIN"
  | "ADMIN"
  | "MAYOR"
  | "GOVERNOR"
  | "TENANT_ADMIN"
  | "ACCESS_APPROVER"
  | "publico";

export interface AuthContext {
  type: AuthContextType;
  role?: string;
  label?: string;
  tenantId?: string | null;
  tenantName?: string | null;
  membershipId?: string | null;
  votingDepartmentId?: string | null;
  votingMunicipalityId?: string | null;
}

export type AccessRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REVOKED";

export interface AccessStatus {
  tenant: {
    hasApprovedAccess: boolean;
    latestStatus?: AccessRequestStatus | null;
    canRequest: boolean;
    shouldSelectTenantContext: boolean;
    message: string;
    items: Array<{
      applicationId?: string | null;
      membershipId?: string | null;
      status: AccessRequestStatus;
      tenantId?: string | null;
      tenantName?: string | null;
      reason?: string | null;
    }>;
  };
  territorial: {
    hasApprovedAccess: boolean;
    status:
      | "NONE"
      | "PENDING_EMAIL_VERIFICATION"
      | "PENDING_APPROVAL"
      | "APPROVED"
      | "REJECTED"
      | "REVOKED";
    requestedRole?: "MAYOR" | "GOVERNOR" | null;
    votingDepartmentId?: string | null;
    votingMunicipalityId?: string | null;
    reason?: string | null;
    canRequest: boolean;
    message: string;
  };
}

export interface AuthState {
  token: string | null;
  accessToken: string | null;
  role: AuthRole | string | null;
  active: boolean;
  tenantId?: string | null;
  availableContexts: AuthContext[];
  requiresContextSelection: boolean;
  defaultContext: AuthContext | null;
  activeContext: AuthContext | null;
  accessStatus: AccessStatus | null;
  user: {
    id: string;
    dni?: string;
    email: string;
    name: string;
    role: AuthRole;
    active: boolean;
    restrictedId?: string;
    departmentId?: string;
    departmentName?: string;
    municipalityId?: string;
    municipalityName?: string;
    status?: "ACTIVE" | "PENDING" | "REJECTED" | "INACTIVE";
    territorialAccessStatus?: AccessStatus["territorial"]["status"];
    territorialAccessReason?: string;
    territorialRequestedRole?: "MAYOR" | "GOVERNOR" | null;
    // Institutional voting
    tenantId?: string;
    tenantName?: string;
  } | null;
}

const AUTH_COOKIE_KEYS = {
  token: "tvd_auth_token",
  role: "tvd_auth_role",
  status: "tvd_auth_status",
  active: "tvd_auth_active",
  context: "tvd_auth_context",
} as const;

const AUTH_SESSION_KEY = "authSession";

const decodeToken = (token: string | null): JwtPayload | null => {
  if (!token) return null;
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string | null) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;

  return decoded.exp * 1000 <= Date.now();
};
const normalizeRole = (role: any) => {
  const r = String(role || "").toUpperCase();

  if (r === "ALCALDE" || r === "MAYOR") return "MAYOR";
  if (r === "GOBERNADOR" || r === "GOVERNOR") return "GOVERNOR";
  if (r === "SUPERADMIN" || r === "ADMIN") return "SUPERADMIN";
  if (r === "TENANT_ADMIN" || r === "TENANTADMIN") return "TENANT_ADMIN";
  if (r === "ACCESS_APPROVER") return "ACCESS_APPROVER";
  return "publico";
};

const normalizeUser = (u: any): AuthState["user"] => {
  if (!u) return null;

  const role = normalizeRole(u.role);

  return {
    id: u.id ?? u._id ?? "",
    dni: u.dni,
    email: u.email ?? "",
    name: u.name ?? "",
    role,
    active: typeof u.active === "boolean" ? u.active : !!u.isApproved,
    restrictedId: u.restrictedId,
    departmentId: u.departmentId,
    departmentName: u.departmentName,
    municipalityId: u.municipalityId,
    municipalityName: u.municipalityName,
    status: u.status,
    territorialAccessStatus:
      u.territorialAccessStatus ?? u.accessStatus?.territorial?.status,
    territorialAccessReason:
      u.territorialAccessReason ??
      u.accessStatus?.territorial?.reason ??
      u.accessStatus?.territorial?.message,
    territorialRequestedRole:
      u.territorialRequestedRole ?? u.accessStatus?.territorial?.requestedRole,
    // Institutional voting
    tenantId: u.tenantId,
    tenantName: u.tenantName,
  };
};

const syncAuthSessionCookies = (
  token: string | null,
  user: AuthState["user"],
  activeContext?: AuthContext | null,
  role?: AuthState["role"],
  active?: boolean,
) => {
  if (!token || !user) {
    removeCookie(AUTH_COOKIE_KEYS.token);
    removeCookie(AUTH_COOKIE_KEYS.role);
    removeCookie(AUTH_COOKIE_KEYS.status);
    removeCookie(AUTH_COOKIE_KEYS.active);
    removeCookie(AUTH_COOKIE_KEYS.context);
    return;
  }

  writeCookie(AUTH_COOKIE_KEYS.token, token);
  writeCookie(AUTH_COOKIE_KEYS.role, String(role ?? user.role));
  writeCookie(AUTH_COOKIE_KEYS.active, String(active ?? user.active));

  if (activeContext?.type) {
    writeCookie(AUTH_COOKIE_KEYS.context, activeContext.type);
  } else {
    removeCookie(AUTH_COOKIE_KEYS.context);
  }

  if (user.status) {
    writeCookie(AUTH_COOKIE_KEYS.status, user.status);
  } else {
    removeCookie(AUTH_COOKIE_KEYS.status);
  }
};

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizeContext = (ctx: any): AuthContext | null => {
  const type = String(ctx?.type ?? "").toUpperCase();
  if (
    type !== "GLOBAL_ADMIN" &&
    type !== "TERRITORIAL" &&
    type !== "TENANT" &&
    type !== "ACCESS_APPROVALS"
  ) {
    return null;
  }

  return {
    type,
    role: ctx?.role ? String(ctx.role) : undefined,
    label: ctx?.label ? String(ctx.label) : undefined,
    tenantId: ctx?.tenantId ?? null,
    tenantName: ctx?.tenantName ?? null,
    membershipId: ctx?.membershipId ?? null,
    votingDepartmentId: ctx?.votingDepartmentId ?? null,
    votingMunicipalityId: ctx?.votingMunicipalityId ?? null,
  };
};

const normalizeContexts = (value: any): AuthContext[] =>
  Array.isArray(value)
    ? value.map(normalizeContext).filter((ctx): ctx is AuthContext => !!ctx)
    : [];

const sameContext = (a?: AuthContext | null, b?: AuthContext | null) => {
  if (!a || !b) return false;
  return (
    a.type === b.type &&
    (a.tenantId ?? null) === (b.tenantId ?? null) &&
    (a.membershipId ?? null) === (b.membershipId ?? null) &&
    (a.votingDepartmentId ?? null) === (b.votingDepartmentId ?? null) &&
    (a.votingMunicipalityId ?? null) === (b.votingMunicipalityId ?? null)
  );
};

const getInitialActiveContext = (
  availableContexts: AuthContext[],
  defaultContext: AuthContext | null,
  storedActiveContext: AuthContext | null,
  requiresContextSelection: boolean,
) => {
  if (
    storedActiveContext &&
    availableContexts.some((ctx) => sameContext(ctx, storedActiveContext))
  ) {
    return storedActiveContext;
  }

  if (!requiresContextSelection && availableContexts.length === 1) {
    return availableContexts[0];
  }

  if (!requiresContextSelection && defaultContext) {
    return defaultContext;
  }

  return null;
};

const buildSessionSnapshot = (state: AuthState) => ({
  role: state.role,
  active: state.active,
  tenantId: state.tenantId ?? null,
  availableContexts: state.availableContexts,
  requiresContextSelection: state.requiresContextSelection,
  defaultContext: state.defaultContext,
  activeContext: state.activeContext,
  accessStatus: state.accessStatus,
});

const persistAuthSession = (state: AuthState) => {
  writeStorage(AUTH_SESSION_KEY, JSON.stringify(buildSessionSnapshot(state)));
};

const clearAuthSession = () => {
  removeStorage(AUTH_SESSION_KEY);
  removeStorage("authActiveContext");
  removeStorage("availableContexts");
  removeStorage("accessStatus");
};

let rawUser: any = null;
try {
  rawUser = JSON.parse(readStorage("user") ?? "null");
} catch {
  rawUser = null;
}

const storedToken = readStorage("token");
const initialToken = storedToken && !isTokenExpired(storedToken) ? storedToken : null;
const rawSession = safeParse<Partial<AuthState>>(
  readStorage(AUTH_SESSION_KEY),
  {},
);
const initialAvailableContexts = normalizeContexts(rawSession.availableContexts);
const initialDefaultContext = normalizeContext(rawSession.defaultContext);
const initialStoredActiveContext = normalizeContext(rawSession.activeContext);
const initialRequiresContextSelection = Boolean(
  rawSession.requiresContextSelection,
);
const initialActiveContext = getInitialActiveContext(
  initialAvailableContexts,
  initialDefaultContext,
  initialStoredActiveContext,
  initialRequiresContextSelection,
);

if (!initialToken) {
  removeStorage("token");
  removeStorage("user");
  clearAuthSession();
}

const initialState: AuthState = {
  token: initialToken,
  accessToken: initialToken,
  role: initialToken ? rawSession.role ?? rawUser?.role ?? null : null,
  active: initialToken ? Boolean(rawSession.active ?? rawUser?.active) : false,
  tenantId: initialToken ? rawSession.tenantId ?? rawUser?.tenantId ?? null : null,
  availableContexts: initialToken ? initialAvailableContexts : [],
  requiresContextSelection: initialToken ? initialRequiresContextSelection : false,
  defaultContext: initialToken ? initialDefaultContext : null,
  activeContext: initialToken ? initialActiveContext : null,
  accessStatus: initialToken ? rawSession.accessStatus ?? null : null,
  user: initialToken && rawUser ? normalizeUser(rawUser) : null,
};

syncAuthSessionCookies(
  initialState.token,
  initialState.user,
  initialState.activeContext,
  initialState.role,
  initialState.active,
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      const token =
        action.payload?.accessToken ??
        action.payload?.access_token ??
        action.payload?.token ??
        null;
      const existingToken =
        token && (token === state.token || token === state.accessToken)
          ? token
          : null;
      const validToken = token && !isTokenExpired(token) ? token : existingToken;
      const decoded = decodeToken(validToken);
      const availableContexts = normalizeContexts(
        action.payload?.availableContexts,
      );
      const defaultContext = normalizeContext(action.payload?.defaultContext);
      const requestedActiveContext = normalizeContext(
        action.payload?.activeContext,
      );
      const loginContractPayload =
        "availableContexts" in (action.payload ?? {}) ||
        "requiresContextSelection" in (action.payload ?? {});
      const previousActiveContext = loginContractPayload ? null : state.activeContext;
      const requiresContextSelection = Boolean(
        action.payload?.requiresContextSelection,
      );

      let user = normalizeUser(action.payload?.user);
      if (validToken && !user && decoded?.sub) {
        user = {
          id: decoded.sub,
          email: "",
          name: "",
          role: normalizeRole(decoded.role),
          active: !!decoded.active,
        };
      }
      if (user && decoded) {
        const role = normalizeRole(decoded.role ?? user.role);

        if (
          role === "GOVERNOR" &&
          !user.departmentId &&
          decoded.votingDepartmentId
        ) {
          user.departmentId = decoded.votingDepartmentId;
        }

        if (
          role === "MAYOR" &&
          !user.municipalityId &&
          decoded.votingMunicipalityId
        ) {
          user.municipalityId = decoded.votingMunicipalityId;
        }

        if (!user.tenantId && decoded.tenantId) {
          user.tenantId = decoded.tenantId;
        }

        // // opcional: también sincroniza active/role desde token si confías en eso para UI
        // user.role = role;
        // if (typeof decoded.active === "boolean") user.active = decoded.active;
      }

      const activeContext = getInitialActiveContext(
        availableContexts.length ? availableContexts : state.availableContexts,
        defaultContext ?? state.defaultContext,
        requestedActiveContext ?? previousActiveContext,
        requiresContextSelection,
      );
      const role =
        action.payload?.role ??
        user?.role ??
        decoded?.role ??
        state.role ??
        null;
      const active =
        typeof action.payload?.active === "boolean"
          ? action.payload.active
          : typeof user?.active === "boolean"
            ? user.active
            : Boolean(decoded?.active);
      const tenantId =
        activeContext?.type === "TENANT"
          ? activeContext.tenantId
          : action.payload?.tenantId ?? user?.tenantId ?? decoded?.tenantId ?? null;

      state.token = validToken;
      state.accessToken = validToken;
      state.role = role;
      state.active = active;
      state.tenantId = tenantId;
      state.availableContexts = validToken
        ? availableContexts.length
          ? availableContexts
          : state.availableContexts
        : [];
      state.requiresContextSelection = validToken
        ? requiresContextSelection
        : false;
      state.defaultContext = validToken ? defaultContext ?? state.defaultContext : null;
      state.activeContext = validToken ? activeContext : null;
      state.accessStatus = validToken
        ? action.payload?.accessStatus ?? state.accessStatus ?? null
        : null;
      state.user = validToken ? user : null;

      if (validToken && user) {
        writeStorage("user", JSON.stringify(user));
      } else {
        removeStorage("user");
      }

      if (validToken) {
        writeStorage("token", validToken);
        persistAuthSession(state);
      } else {
        removeStorage("token");
        clearAuthSession();
      }

      syncAuthSessionCookies(
        state.token,
        state.user,
        state.activeContext,
        state.role,
        state.active,
      );
    },
    setActiveContext: (state, action) => {
      const context = normalizeContext(action.payload);
      if (!context) return;
      if (sameContext(state.activeContext, context)) return;

      state.activeContext = context;
      state.tenantId = context.type === "TENANT" ? context.tenantId : state.tenantId ?? null;

      if (state.user) {
        if (context.type === "TENANT") {
          state.user.tenantId = context.tenantId ?? undefined;
          state.user.tenantName = context.tenantName ?? undefined;
        }
        if (context.type === "TERRITORIAL") {
          state.user.departmentId = context.votingDepartmentId ?? undefined;
          state.user.municipalityId = context.votingMunicipalityId ?? undefined;
        }
      }

      persistAuthSession(state);
      syncAuthSessionCookies(
        state.token,
        state.user,
        state.activeContext,
        state.role,
        state.active,
      );
    },
    logOut: (state) => {
      state.token = null;
      state.accessToken = null;
      state.role = null;
      state.active = false;
      state.tenantId = null;
      state.availableContexts = [];
      state.requiresContextSelection = false;
      state.defaultContext = null;
      state.activeContext = null;
      state.accessStatus = null;
      state.user = null;
      removeStorage("user");
      removeStorage("token");
      removeStorage("selectedElectionId");
      removeStorage("pendingEmail");
      removeStorage("pendingReason");
      clearAuthSession();
      syncAuthSessionCookies(null, null);
    },
  },
});

export const { setAuth, setActiveContext, logOut } = authSlice.actions;
export const selectAuth = (state: RootState) => state.auth;

// Selector to check if user is logged in
export const selectIsLoggedIn = (state: RootState) => {
  return Boolean(state.auth.token && state.auth.user);
};

// Selector for tenantId (institutional voting)
export const selectTenantId = (state: RootState) =>
  state.auth.activeContext?.type === "TENANT"
    ? state.auth.activeContext.tenantId ?? undefined
    : state.auth.user?.tenantId;
export const selectActiveContext = (state: RootState) => state.auth.activeContext;
export const selectAvailableContexts = (state: RootState) =>
  state.auth.availableContexts;
export const selectAccessStatus = (state: RootState) => state.auth.accessStatus;
export const selectActiveTenantId = (state: RootState) =>
  state.auth.activeContext?.type === "TENANT"
    ? state.auth.activeContext.tenantId ?? undefined
    : state.auth.user?.tenantId;

// Selector for user role
export const selectUserRole = (state: RootState) =>
  state.auth.role ?? state.auth.user?.role;

export default authSlice;
