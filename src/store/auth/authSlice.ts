import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../index";
import { LoginResponse, UserProfile } from "../../types";
import { storageService } from "../../services/storage.service";

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
    id: (u.id || u.sub || u._id || "") as string,
    email: (u.email || "") as string,
    name: (u.name || "") as string,
    role,
    active: typeof u.active === "boolean" ? u.active : !!u.isApproved,
    restrictedId: u.restrictedId as string,
    departmentId: (u.departmentId || u.votingDepartmentId) as string,
    departmentName: u.departmentName as string,
    municipalityId: (u.municipalityId || u.votingMunicipalityId) as string,
    municipalityName: u.municipalityName as string,
    status: u.status as User["status"],
  };
};

const rawUser = storageService.getItem<any>("user");
const rawToken = storageService.getItem<string>("token");

const initialState: AuthState = {
  token: rawToken,
  user: rawUser ? normalizeUser(rawUser) : null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<Partial<LoginResponse> & { user?: UserProfile }>) => {
      const newUser = action.payload?.user ? normalizeUser(action.payload.user) : state.user;
      const newToken = action.payload?.accessToken || action.payload?.access_token || action.payload?.token || state.token;

      state.user = newUser;
      state.token = newToken as string | null;

      if (newUser) {
        storageService.setItem("user", newUser);
      }
      if (newToken) {
        storageService.setItem("token", newToken);
      }
    },
    logOut: (state) => {
      state.token = null;
      state.user = null;
      storageService.removeItem("user");
      storageService.removeItem("token");
      storageService.removeItem("selectedElectionId");
      storageService.removeItem("pendingEmail");
      storageService.removeItem("pendingReason");
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
