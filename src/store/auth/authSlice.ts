import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../index";

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
const normalizeRole = (role: any) => {
  const r = String(role || "").toUpperCase();

  if (r === "ALCALDE" || r === "MAYOR") return "MAYOR";
  if (r === "GOBERNADOR" || r === "GOVERNOR") return "GOVERNOR";
  if (r === "SUPERADMIN") return "SUPERADMIN";
  return "publico";
};

const normalizeUser = (u: any): AuthState["user"] => {
  if (!u) return null;

  return {
    ...u,
    role: normalizeRole(u.role),
    active: typeof u.active === "boolean" ? u.active : !!u.isApproved,
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

      const user = normalizeUser(action.payload?.user);

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
