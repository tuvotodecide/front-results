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

describe("roles, permissions and navigation", () => {
  beforeEach(() => {
    replace.mockReset();
    usePathname.mockReturnValue("/aprobaciones");
  });

  it("redirects anonymous users away from approvals preserving the requested path", async () => {
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

  it("allows ACCESS_APPROVER contexts to enter approvals and activates the context", async () => {
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

  it("blocks authenticated users without approvals context or legacy approvals role", async () => {
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

  it("shows admin navigation only for SUPERADMIN in the resultados sidebar", () => {
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

  it("shows territorial report navigation only to approved MAYOR or GOVERNOR users", () => {
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
