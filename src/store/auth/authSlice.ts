import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../index";

export interface AuthState {
  token: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      const { access_token, user } = action.payload;
      state.token = access_token;
      state.user = user;
      window.localStorage.setItem("user", JSON.stringify(user));
      window.localStorage.setItem("token", access_token);
    },
    logOut: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
});

export const { setAuth, logOut } = authSlice.actions;
export const selectAuth = (state: RootState) => state.auth;
