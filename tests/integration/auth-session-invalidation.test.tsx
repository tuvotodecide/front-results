import { configureStore } from "@reduxjs/toolkit";
import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginVotacionPage from "@/domains/auth-votacion/screens/LoginVotacionPage";
import { apiSlice } from "@/store/apiSlice";
import authReducer from "@/store/auth/authSlice";
import {
  AUTH_VERSION_MISMATCH_CODE,
  consumeAuthSessionEndReason,
  persistAuthSessionEndReason,
} from "@/store/auth/sessionInvalidation";
import { institutionalRecoveryEndpoints } from "@/store/institutionalRecovery";
import { renderWithAuthStore } from "../utils/renderWithStore";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("@/domains/auth-votacion/navigation/compat", () => ({
  Link: ({ children, href, to }: { children: ReactNode; href?: string; to?: string }) => (
    <a href={href ?? to}>{children}</a>
  ),
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [mocks.searchParams],
}));

vi.mock("@/store/auth/authEndpoints", () => ({
  useLoginUserMutation: () => [
    vi.fn(),
    { isLoading: false },
  ],
}));

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const buildStore = () =>
  configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      auth: authReducer.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState: {
      auth: {
        token: "old-token",
        accessToken: "old-token",
        role: "TENANT_ADMIN",
        active: true,
        tenantId: "tenant-1",
        availableContexts: [
          {
            type: "TENANT" as const,
            role: "TENANT_ADMIN",
            tenantId: "tenant-1",
            tenantName: "Institución Demo",
          },
        ],
        requiresContextSelection: false,
        defaultContext: null,
        activeContext: {
          type: "TENANT" as const,
          role: "TENANT_ADMIN",
          tenantId: "tenant-1",
          tenantName: "Institución Demo",
        },
        accessStatus: null,
        user: {
          id: "user-1",
          email: "admin@demo.bo",
          name: "Admin Demo",
          role: "TENANT_ADMIN" as const,
          active: true,
        },
      },
    },
  });

describe("authVersion session invalidation", () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.searchParams = new URLSearchParams();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            statusCode: 401,
            code: AUTH_VERSION_MISMATCH_CODE,
            message: "Authentication session is no longer valid",
          },
          401,
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("limpia sesion y persiste un reason code no sensible ante AUTH_VERSION_MISMATCH", async () => {
    window.history.pushState({}, "", "/votacion/login");
    const store = buildStore();

    await store
      .dispatch(
        institutionalRecoveryEndpoints.endpoints.listInstitutionalRecoveryRequests.initiate(),
      )
      .unwrap()
      .catch(() => undefined);

    const state = store.getState();
    expect(state.auth.token).toBeNull();
    expect(state.auth.activeContext).toBeNull();
    expect(state.auth.tenantId).toBeNull();
    expect(state.auth.user).toBeNull();

    const reason = consumeAuthSessionEndReason();
    expect(reason).toBe(AUTH_VERSION_MISMATCH_CODE);
    expect(JSON.stringify(reason)).not.toContain("admin@demo.bo");
    expect(JSON.stringify(reason)).not.toContain("tenant-1");
  });

  it("mantiene 401 comun sin mensaje especial de authVersion", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            statusCode: 401,
            message: "Unauthorized",
          },
          401,
        ),
      ),
    );
    window.history.pushState({}, "", "/");
    const store = buildStore();

    await store
      .dispatch(
        institutionalRecoveryEndpoints.endpoints.listInstitutionalRecoveryRequests.initiate(),
      )
      .unwrap()
      .catch(() => undefined);

    expect(store.getState().auth.token).toBeNull();
    expect(consumeAuthSessionEndReason()).toBeNull();
  });

  it("muestra el mensaje de cierre una sola vez en el login", () => {
    persistAuthSessionEndReason(AUTH_VERSION_MISMATCH_CODE);

    const { unmount } = renderWithAuthStore(<LoginVotacionPage />);

    expect(
      screen.getByText(/se actualizó el acceso institucional/i),
    ).toBeInTheDocument();

    unmount();
    renderWithAuthStore(<LoginVotacionPage />);

    expect(
      screen.queryByText(/se actualizó el acceso institucional/i),
    ).not.toBeInTheDocument();
  });
});
