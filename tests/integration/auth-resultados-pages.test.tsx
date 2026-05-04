import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import LoginResultadosPage from "@/domains/auth-resultados/screens/LoginResultadosPage";
import RegisterResultadosPage from "@/domains/auth-resultados/screens/RegisterResultadosPage";
import { renderWithAuthStore } from "../utils/renderWithStore";

const navigate = vi.fn();
const loginUser = vi.fn();
const triggerProfile = vi.fn();
const createUser = vi.fn();
const getDepartmentsQuery = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("@/store/auth/authEndpoints", () => ({
  useLoginUserMutation: () => [loginUser, { isLoading: false }],
  useLazyGetProfileQuery: () => [triggerProfile],
  useCreateUserMutation: () => [createUser],
}));

vi.mock("@/store/departments/departmentsEndpoints", () => ({
  useGetDepartmentsQuery: (...args: unknown[]) => getDepartmentsQuery(...args),
}));

vi.mock("@/components/ScopePicker", () => ({
  default: ({ mode, onChange }: { mode: "MAYOR" | "GOVERNOR"; onChange: (value: Record<string, string>) => void }) => (
    <button
      type="button"
      data-testid="scope-picker"
      onClick={() =>
        onChange(
          mode === "MAYOR"
            ? { departmentId: "dep-1", provinceId: "prov-1", municipalityId: "mun-1" }
            : { departmentId: "dep-1" },
        )
      }
    >
      scope picker
    </button>
  ),
}));

vi.mock("@/domains/auth-resultados/navigation/compat", () => ({
  Link: ({ children, href, to }: { children: ReactNode; href?: string; to?: string }) => (
    <a href={href ?? to}>{children}</a>
  ),
  useNavigate: () => navigate,
  useLocation: () => ({ state: null }),
  useSearchParams: () => [currentSearchParams],
}));

describe("canonical auth resultados pages", () => {
  beforeEach(() => {
    navigate.mockReset();
    loginUser.mockReset();
    triggerProfile.mockReset();
    createUser.mockReset();
    getDepartmentsQuery.mockReset();
    getDepartmentsQuery.mockReturnValue({
      data: {
        data: [{ _id: "dep-1", name: "La Paz" }],
        pagination: { page: 1, limit: 100, total: 1, pages: 1 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    currentSearchParams = new URLSearchParams();
  });

  it("validates the canonical resultados login form", async () => {
    const user = userEvent.setup();
    const { container } = renderWithAuthStore(<LoginResultadosPage />);

    const email = container.querySelector('[data-cy="login-email"]') as HTMLInputElement;
    const password = container.querySelector(
      '[data-cy="login-password"]',
    ) as HTMLInputElement;
    const submit = container.querySelector('[data-cy="login-submit"]') as HTMLButtonElement;

    await user.type(email, "bad-email");
    await user.type(password, "123");
    await user.click(submit);

    expect(await screen.findByText("Correo electrónico inválido")).toBeInTheDocument();
    expect(await screen.findByText("Mínimo 8 caracteres")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /crear cuenta/i })).toHaveAttribute(
      "href",
      "/resultados/registrarse",
    );
  });

  it("validates the canonical resultados register form", async () => {
    const user = userEvent.setup();
    const { container } = renderWithAuthStore(<RegisterResultadosPage />);

    const submit = container.querySelector('[data-cy="register-submit"]') as HTMLButtonElement;
    await user.click(submit);

    expect(await screen.findByText("El carnet es obligatorio")).toBeInTheDocument();
    expect(await screen.findByText("El nombre completo es obligatorio")).toBeInTheDocument();
    expect(await screen.findByText("El correo es obligatorio")).toBeInTheDocument();
    expect(await screen.findByText("La contraseña es obligatoria")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /regresar/i })).toHaveAttribute(
      "href",
      "/resultados/login",
    );
  });

  it("redirects to pendiente after a successful canonical registration", async () => {
    const user = userEvent.setup();
    createUser.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ ok: true }),
    });

    const { container } = renderWithAuthStore(<RegisterResultadosPage />);

    await user.type(
      container.querySelector('[data-cy="register-dni"]') as HTMLInputElement,
      "1234567",
    );
    await user.type(
      container.querySelector('[data-cy="register-name"]') as HTMLInputElement,
      "Usuaria Test",
    );
    await user.type(
      container.querySelector('[data-cy="register-email"]') as HTMLInputElement,
      "user@test.com",
    );
    await user.type(
      container.querySelector('[data-cy="register-password"]') as HTMLInputElement,
      "12345678",
    );
    await user.type(
      container.querySelector('[data-cy="register-confirm-password"]') as HTMLInputElement,
      "12345678",
    );
    await user.click(screen.getByTestId("scope-picker"));

    await user.click(container.querySelector('[data-cy="register-submit"]') as HTMLButtonElement);

    await waitFor(() => {
      expect(createUser).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith("/resultados/pendiente", {
        replace: true,
      });
    });
  });

  it("syncs territorial pending approval in auth state immediately after registration", async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams(
      "email=josetigre2000@gmail.com&name=Usuario&crossAccess=1",
    );
    createUser.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        id: "user-99",
        email: "josetigre2000@gmail.com",
        name: "Usuario",
        dni: "1234567",
        role: "MAYOR",
        active: true,
        territorialAccessStatus: "PENDING_APPROVAL",
        municipalityId: "mun-1",
        departmentId: "dep-1",
      }),
    });

    const { container, store } = renderWithAuthStore(<RegisterResultadosPage />, {
      token: "token",
      accessToken: "token",
      role: "TENANT_ADMIN",
      active: true,
      availableContexts: [{ type: "TENANT", tenantId: "tenant-1" }],
      activeContext: { type: "TENANT", tenantId: "tenant-1" },
      user: {
        id: "tenant-admin-1",
        dni: "1234567",
        email: "sesion@test.com",
        name: "Nombre Sesion",
        role: "TENANT_ADMIN",
        active: true,
        status: "ACTIVE",
        tenantId: "tenant-1",
      },
    });

    await user.click(screen.getByTestId("scope-picker"));
    await user.click(container.querySelector('[data-cy="register-submit"]') as HTMLButtonElement);

    await waitFor(() => {
      expect(store.getState().auth.user?.territorialAccessStatus).toBe(
        "PENDING_APPROVAL",
      );
      expect(store.getState().auth.accessStatus?.territorial.status).toBe(
        "PENDING_APPROVAL",
      );
      expect(navigate).toHaveBeenCalledWith("/resultados/pendiente", {
        replace: true,
      });
    });
    expect(localStorage.getItem("pendingReason")).toBe("SUPERADMIN_APPROVAL");
  });

  it("prefills query values and keeps department loading enabled in cross access", async () => {
    currentSearchParams = new URLSearchParams(
      "email=josetigre2000@gmail.com&name=Usuario&crossAccess=1",
    );

    const { container } = renderWithAuthStore(<RegisterResultadosPage />, {
      token: "token",
      accessToken: "token",
      user: {
        id: "tenant-admin-1",
        dni: "1234567",
        email: "sesion@test.com",
        name: "Nombre Sesion",
        role: "TENANT_ADMIN",
        active: true,
        status: "ACTIVE",
      },
    });

    await waitFor(() => {
      expect(
        container.querySelector('[data-cy="register-email"]'),
      ).toHaveValue("josetigre2000@gmail.com");
      expect(
        container.querySelector('[data-cy="register-name"]'),
      ).toHaveValue("Usuario");
      expect(
        container.querySelector('[data-cy="register-dni"]'),
      ).toHaveValue("1234567");
    });
    expect(screen.getByText("Solicitar acceso")).toBeInTheDocument();
    expect(getDepartmentsQuery).toHaveBeenCalledWith(
      { limit: 100 },
      { skip: false },
    );
  });

  it("shows pending approval from resultados login without voting CTA and with public home", async () => {
    const { store } = renderWithAuthStore(<LoginResultadosPage />, {
      token: "token",
      accessToken: "token",
      role: "TENANT_ADMIN",
      availableContexts: [{ type: "TENANT", tenantId: "tenant-1" }],
      activeContext: { type: "TENANT", tenantId: "tenant-1" },
      user: {
        id: "tenant-admin-1",
        email: "tenant@test.com",
        name: "Tenant",
        role: "TENANT_ADMIN",
        active: true,
        status: "ACTIVE",
        territorialAccessStatus: "PENDING_APPROVAL",
      },
    });

    await waitFor(() => {
      expect(
        screen.getByText("Tu solicitud territorial está pendiente de aprobación."),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText("Ir a votación")).not.toBeInTheDocument();
    expect(screen.queryByText("Registrarme en resultados")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute(
      "href",
      "/resultados",
    );
    expect(store.getState().auth.token).toBeNull();
    expect(store.getState().auth.user).toBeNull();
  });

  it("redirects access approvers back to approvals when login started from that route", async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams("from=/aprobaciones");
    loginUser.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        accessToken: "token",
        role: "ACCESS_APPROVER",
        active: true,
        availableContexts: [
          { type: "TENANT", tenantId: "tenant-1" },
          { type: "ACCESS_APPROVALS", role: "ACCESS_APPROVER" },
        ],
        defaultContext: { type: "TENANT", tenantId: "tenant-1" },
        user: {
          id: "approver-1",
          email: "approver@test.com",
          name: "Approver",
          role: "ACCESS_APPROVER",
          active: true,
        },
      }),
    });

    const { container } = renderWithAuthStore(<LoginResultadosPage />);

    await user.type(
      container.querySelector('[data-cy="login-email"]') as HTMLInputElement,
      "approver@test.com",
    );
    await user.type(
      container.querySelector('[data-cy="login-password"]') as HTMLInputElement,
      "12345678",
    );
    await user.click(container.querySelector('[data-cy="login-submit"]') as HTMLButtonElement);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/aprobaciones", {
        replace: true,
      });
    });
  });
});
