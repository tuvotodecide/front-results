import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import authReducer, { type AuthState } from "@/store/auth/authSlice";

export const renderWithAuthStore = (
  ui: ReactElement,
  authState?: Partial<AuthState>,
) => {
  const store = configureStore({
    reducer: {
      auth: authReducer.reducer,
    },
    preloadedState: {
      auth: {
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
        ...authState,
      },
    },
  });

  return {
    store,
    ...render(<Provider store={store}>{ui}</Provider>),
  };
};
