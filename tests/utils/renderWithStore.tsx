import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import authReducer, { type AuthState } from "@/store/auth/authSlice";
import { apiSlice } from "@/store/apiSlice";

// Contexto institucional activo mínimo que necesita el wizard de creación
// (valida la capacidad TVD del tenant antes de avanzar en votaciones abiertas).
export const wizardAuthState: Partial<AuthState> = {
  token: "token",
  role: "TENANT_ADMIN",
  active: true,
  tenantId: "tenant-1",
  user: { id: "admin-1", role: "TENANT_ADMIN", active: true, tenantId: "tenant-1" } as never,
  activeContext: {
    type: "TENANT",
    role: "TENANT_ADMIN",
    tenantId: "tenant-1",
    label: "Institución",
  } as never,
};

export const renderWithAuthStore = (
  ui: ReactElement,
  authState?: Partial<AuthState>,
) => {
  const store = configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      auth: authReducer.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    // RTK agrupa por defecto las notificaciones de RTK Query con
    // requestAnimationFrame. jsdom mantiene vivo su intervalo de animación
    // mientras haya un callback pendiente, y si la prueba termina antes de que
    // se dispare, el callback corre sobre una ventana ya cerrada y lanza un
    // error no capturado durante el teardown. `tick` usa queueMicrotask, que
    // siempre se vacía dentro de la propia prueba.
    enhancers: (getDefaultEnhancers) =>
      getDefaultEnhancers({ autoBatch: { type: "tick" } }),
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
