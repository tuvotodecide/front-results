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
};

export interface AuthState {
  token: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: "SUPERADMIN" | "MAYOR" | "GOVERNOR" | "publico";
    active: boolean;
    restrictedId?: string;
    departmentId?: string;
    departmentName?: string;
    municipalityId?: string;
    municipalityName?: string;
    status?: "ACTIVE" | "PENDING" | "REJECTED" | "INACTIVE";
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
const normalizeRole = (role: any) => {
  const r = String(role || "").toUpperCase();

  if (r === "ALCALDE" || r === "MAYOR") return "MAYOR";
  if (r === "GOBERNADOR" || r === "GOVERNOR") return "GOVERNOR";
  if (r === "SUPERADMIN") return "SUPERADMIN";
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
  };
};
let rawUser: any = null;
try {
  rawUser = JSON.parse(localStorage.getItem("user") ?? "null");
} catch {
  rawUser = null;
}

const initialState: AuthState = {
  token: localStorage.getItem("token"),
  user: rawUser ? normalizeUser(rawUser) : null,
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
      const decoded = decodeToken(token);

      let user = normalizeUser(action.payload?.user);
      if (!user && decoded?.sub) {
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

        // // opcional: también sincroniza active/role desde token si confías en eso para UI
        // user.role = role;
        // if (typeof decoded.active === "boolean") user.active = decoded.active;
      }

      state.token = token;
      state.user = user;

      if (user) localStorage.setItem("user", JSON.stringify(user));
      if (token) localStorage.setItem("token", token);
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

export default authSlice;
