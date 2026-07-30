import type { ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import AccessApprovalsGuard from "@/domains/access-approvals/guards/AccessApprovalsGuard";
import ResultadosSidebar from "@/domains/resultados/layout/ResultadosSidebar";
import authReducer, { type AuthState } from "@/store/auth/authSlice";
import { resultsSlice } from "@/store/resultados/resultadosSlice";
import { renderWithAuthStore } from "../utils/renderWithStore";

const replace = vi.fn();
const usePathname = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => usePathname(),
}));

vi.mock("@/hooks/useScreenSize", () => ({
  useScreenSize: () => ({ isSmallScreen: false }),
}));

vi.mock("@/domains/resultados/hooks/useElectionConfig", () => ({
  default: () => ({ election: { type: "presidential" } }),
}));

vi.mock("@/domains/resultados/hooks/useElectionId", () => ({
  default: () => "election-1",
}));

vi.mock("@/domains/resultados/navigation/compat", () => ({
  Link: ({
    children,
    to,
    href,
    ...props
  }: {
    children?: ReactNode;
    to?: string;
    href?: string;
  }) => (
    <a href={to ?? href} {...props}>
      {children}
    </a>
  ),
}));

const baseAuth: AuthState = {
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
};

const renderSidebar = (authState: Partial<AuthState>) => {
  const store = configureStore({
    reducer: {
      auth: authReducer.reducer,
      results: resultsSlice.reducer,
    },
    preloadedState: {
      auth: {
        ...baseAuth,
        ...authState,
      },
    },
  });

  return render(
    <Provider store={store}>
      <ResultadosSidebar isOpen closeSidebar={vi.fn()} />
    </Provider>,
  );
};

describe("MX-03 | Autenticación, sesiones, roles y permisos | Frontend Admin | Roles y navegación", () => {
  beforeEach(() => {
    replace.mockReset();
    usePathname.mockReturnValue("/aprobaciones");
  });

  it("AUT-GRD-P0-001 | redirige anónimos fuera de aprobaciones preservando la ruta solicitada", async () => {
    renderWithAuthStore(
      <AccessApprovalsGuard>
        <div>approvals private content</div>
      </AccessApprovalsGuard>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/resultados/login?from=%2Faprobaciones");
    });
    expect(screen.queryByText("approvals private content")).not.toBeInTheDocument();
  });

  it("AUT-APR-P0-001 | permite contexto ACCESS_APPROVER en aprobaciones y lo activa", async () => {
    const { store } = renderWithAuthStore(
      <AccessApprovalsGuard>
        <div>approvals private content</div>
      </AccessApprovalsGuard>,
      {
        token: "token",
        accessToken: "token",
        role: "ACCESS_APPROVER",
        active: true,
        availableContexts: [
          {
            type: "ACCESS_APPROVALS",
            role: "ACCESS_APPROVER",
            label: "Aprobador de accesos",
          },
        ],
        activeContext: null,
        user: {
          id: "approver-1",
          email: "approver@test.local",
          name: "Aprobador",
          role: "ACCESS_APPROVER",
          active: true,
          status: "ACTIVE",
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText("approvals private content")).toBeInTheDocument();
    });
    expect(store.getState().auth.activeContext).toMatchObject({
      type: "ACCESS_APPROVALS",
      role: "ACCESS_APPROVER",
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("AUT-APR-P0-001 / AUT-GRD-P0-002 | bloquea autenticados sin contexto de aprobaciones", async () => {
    renderWithAuthStore(
      <AccessApprovalsGuard>
        <div>approvals private content</div>
      </AccessApprovalsGuard>,
      {
        token: "token",
        accessToken: "token",
        role: "TENANT_ADMIN",
        active: true,
        availableContexts: [{ type: "TENANT", tenantId: "tenant-1" }],
        activeContext: { type: "TENANT", tenantId: "tenant-1" },
        user: {
          id: "tenant-1",
          email: "tenant@test.local",
          name: "Tenant",
          role: "TENANT_ADMIN",
          active: true,
          status: "ACTIVE",
        },
      },
    );

    expect(
      await screen.findByText("Tu usuario no tiene acceso al módulo de aprobaciones."),
    ).toBeInTheDocument();
    expect(screen.queryByText("approvals private content")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("AUT-SUP-P0-001 / AUT-SUP-P0-002 | muestra navegación admin solo para SUPERADMIN", () => {
    renderSidebar({
      token: "token",
      accessToken: "token",
      role: "SUPERADMIN",
      active: true,
      user: {
        id: "superadmin-1",
        email: "superadmin@test.local",
        name: "Superadmin",
        role: "SUPERADMIN",
        active: true,
        status: "ACTIVE",
      },
    });

    expect(screen.getByRole("link", { name: /Panel/ })).toHaveAttribute(
      "href",
      "/resultados/panel",
    );
    expect(screen.getByRole("link", { name: /Aprobaciones/ })).toHaveAttribute(
      "href",
      "/aprobaciones",
    );
    expect(screen.getByRole("link", { name: /Departamentos/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Configuraciones/ })).toBeInTheDocument();
  });

  it("AUT-TER-P0-001 | muestra navegación territorial solo a MAYOR o GOVERNOR aprobados", () => {
    const { rerender } = renderSidebar({
      token: "token",
      accessToken: "token",
      role: "MAYOR",
      active: true,
      user: {
        id: "mayor-1",
        email: "mayor@test.local",
        name: "Mayor",
        role: "MAYOR",
        active: true,
        status: "ACTIVE",
      },
    });

    expect(screen.getByRole("link", { name: /Participación de personal/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Auditoría TSE/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Panel/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Aprobaciones/ })).not.toBeInTheDocument();

    const pendingStore = configureStore({
      reducer: {
        auth: authReducer.reducer,
        results: resultsSlice.reducer,
      },
      preloadedState: {
        auth: {
          ...baseAuth,
          token: "token",
          accessToken: "token",
          role: "MAYOR",
          active: false,
          user: {
            id: "mayor-pending",
            email: "pending@test.local",
            name: "Mayor pendiente",
            role: "MAYOR" as const,
            active: false,
            status: "PENDING" as const,
          },
        },
      },
    });

    rerender(
      <Provider store={pendingStore}>
        <ResultadosSidebar isOpen closeSidebar={vi.fn()} />
      </Provider>,
    );

    expect(screen.queryByRole("link", { name: /Participación de personal/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Auditoría TSE/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Resultados generales/ })).toBeInTheDocument();
  });
});
