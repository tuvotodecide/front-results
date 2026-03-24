import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../index";
import { jwtDecode } from "jwt-decode";
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

export interface AuthState {
  token: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: "SUPERADMIN" | "MAYOR" | "GOVERNOR" | "TENANT_ADMIN" | "publico";
    active: boolean;
    restrictedId?: string;
    departmentId?: string;
    departmentName?: string;
    municipalityId?: string;
    municipalityName?: string;
    status?: "ACTIVE" | "PENDING" | "REJECTED" | "INACTIVE";
    // Institutional voting
    tenantId?: string;
    tenantName?: string;
  } | null;
}
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
  if (r === "SUPERADMIN") return "SUPERADMIN";
  if (r === "ADMIN" || r === "TENANT_ADMIN" || r === "TENANTADMIN") return "TENANT_ADMIN";
  return "publico";
};

const normalizeUser = (u: any): AuthState["user"] => {
  if (!u) return null;

  const role = normalizeRole(u.role);

  return {
    id: u.id ?? u._id ?? "",
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
    // Institutional voting
    tenantId: u.tenantId,
    tenantName: u.tenantName,
  };
};
let rawUser: any = null;
try {
  rawUser = JSON.parse(localStorage.getItem("user") ?? "null");
} catch {
  rawUser = null;
}

const storedToken = localStorage.getItem("token");
const initialToken = storedToken && !isTokenExpired(storedToken) ? storedToken : null;

if (!initialToken) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

const initialState: AuthState = {
  token: initialToken,
  user: initialToken && rawUser ? normalizeUser(rawUser) : null,
};

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
      const validToken = token && !isTokenExpired(token) ? token : null;
      const decoded = decodeToken(validToken);

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

        // Institutional voting: tenantId desde token
        if (!user.tenantId && decoded.tenantId) {
          user.tenantId = decoded.tenantId;
        }

        // // opcional: también sincroniza active/role desde token si confías en eso para UI
        // user.role = role;
        // if (typeof decoded.active === "boolean") user.active = decoded.active;
      }

      state.token = validToken;
      state.user = validToken ? user : null;

      if (validToken && user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }

      if (validToken) {
        localStorage.setItem("token", validToken);
      } else {
        localStorage.removeItem("token");
      }
    },
    logOut: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("selectedElectionId");
      localStorage.removeItem("pendingEmail");
      localStorage.removeItem("pendingReason");
    },
  },
});

export const { setAuth, logOut } = authSlice.actions;
export const selectAuth = (state: RootState) => state.auth;

// Selector to check if user is logged in
export const selectIsLoggedIn = (state: RootState) => {
  return Boolean(state.auth.token && state.auth.user);
};

// Selector for tenantId (institutional voting)
export const selectTenantId = (state: RootState) => state.auth.user?.tenantId;

// Selector for user role
export const selectUserRole = (state: RootState) => state.auth.user?.role;

export default authSlice;
