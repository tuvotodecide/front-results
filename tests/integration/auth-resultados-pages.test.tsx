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

vi.mock("@/store/auth/authEndpoints", () => ({
  useLoginUserMutation: () => [loginUser, { isLoading: false }],
  useLazyGetProfileQuery: () => [triggerProfile],
  useCreateUserMutation: () => [createUser],
}));

vi.mock("@/store/departments/departmentsEndpoints", () => ({
  useGetDepartmentsQuery: () => ({
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
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
  useSearchParams: () => [new URLSearchParams()],
}));

describe("canonical auth resultados pages", () => {
  beforeEach(() => {
    navigate.mockReset();
    loginUser.mockReset();
    triggerProfile.mockReset();
    createUser.mockReset();
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
});
