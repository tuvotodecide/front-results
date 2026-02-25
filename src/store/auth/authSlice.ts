import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../index";
import { LoginResponse } from "../../types";

export interface User {
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
}

export interface AuthState {
  token: string | null;
  user: User | null;
}
// jwt-decode removed as it's no longer needed for HttpOnly flow
const normalizeRole = (role: string | null | undefined) => {
  const r = String(role || "").toUpperCase();

  if (r === "ALCALDE" || r === "MAYOR") return "MAYOR";
  if (r === "GOBERNADOR" || r === "GOVERNOR") return "GOVERNOR";
  if (r === "SUPERADMIN" || r === "ADMIN" || r === "ADMINISTRADOR") return "SUPERADMIN";
  return "publico";
};

const normalizeUser = (u: any): User | null => {
  if (!u) return null;

  const role = normalizeRole(u.role);

  return {
    id: u.id ?? u._id ?? "",
    email: u.email ?? "",
    name: u.name ?? "",
    role,
    active: typeof u.active === "boolean" ? u.active : !!u.isApproved,
    restrictedId: u.restrictedId as string,
    departmentId: u.departmentId as string,
    departmentName: u.departmentName as string,
    municipalityId: u.municipalityId as string,
    municipalityName: u.municipalityName as string,
    status: u.status as User["status"],
  };
};

let rawUser: any = null;
try {
  rawUser = JSON.parse(localStorage.getItem("user") ?? "null");
} catch {
  rawUser = null;
}

const initialState: AuthState = {
  token: null, // El token ahora reside en una Cookie HttpOnly, invisible para JS
  user: rawUser ? normalizeUser(rawUser) : null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<Partial<LoginResponse> & { user?: any }>) => {
      // Ya no almacenamos el accessToken en el estado ni en localStorage.
      // El navegador se encarga de enviarlo automáticamente si el servidor configuró Set-Cookie.
      const user = normalizeUser(action.payload?.user);
      const token = action.payload?.accessToken || action.payload?.access_token || null;

      state.user = user;
      state.token = token; // Se guarda solo en memoria (Redux), no en LocalStorage

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
    },
    logOut: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("user");
      // El logout debería invocar un endpoint que limpie la cookie en el server
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
  // Ahora la sesión se valida por la presencia del usuario.
  // La validación real ocurre en el servidor via Cookies.
  return Boolean(state.auth.user);
};

export default authSlice;
