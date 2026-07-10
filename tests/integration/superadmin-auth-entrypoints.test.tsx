import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import DevSuperadminLoginPage from "@/domains/dev-auth/DevSuperadminLoginPage";
import { devSuperadminSession } from "@/domains/dev-auth/devAuth";
import LoginVotacionPage from "@/domains/auth-votacion/screens/LoginVotacionPage";
import { renderWithAuthStore } from "../utils/renderWithStore";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  replace: vi.fn(),
  loginUser: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("@/store/auth/authEndpoints", () => ({
  useLoginUserMutation: () => [mocks.loginUser, { isLoading: false }],
}));

vi.mock("@/domains/auth-votacion/navigation/compat", () => ({
  Link: ({ children, href, to, ...props }: { children: ReactNode; href?: string; to?: string }) => (
    <a href={href ?? to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [mocks.searchParams],
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

describe("entrypoints de Superadmin y recuperación institucional", () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.replace.mockReset();
    mocks.loginUser.mockReset();
    mocks.searchParams = new URLSearchParams();
    vi.unstubAllGlobals();
  });

  it("muestra en login votación el acceso público a recuperación institucional", () => {
    renderWithAuthStore(<LoginVotacionPage />);

    expect(
      screen.getByRole("link", { name: /Recuperar cuenta institucional/i }),
    ).toHaveAttribute("href", "/votacion/recuperacion-institucional");
    expect(
      screen.getByText("Si perdiste acceso a tu institución"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  it("mantiene links públicos existentes del login votación", () => {
    renderWithAuthStore(<LoginVotacionPage />);

    expect(screen.getByRole("link", { name: /Crear cuenta/i })).toHaveAttribute(
      "href",
      "/votacion/registrarse",
    );
    expect(screen.getByRole("link", { name: /Volver al inicio/i })).toHaveAttribute(
      "href",
      "/votacion",
    );
    expect(
      screen.getByRole("link", { name: /¿Olvidaste tu contraseña\?/i }),
    ).toHaveAttribute("href", "/votacion/recuperar");
  });

  it("dev superadmin login crea sesión local, actualiza store y redirige a /superadmin", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ session: devSuperadminSession }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { store } = renderWithAuthStore(<DevSuperadminLoginPage />);

    await user.click(
      screen.getByRole("button", { name: /Entrar como Superadmin local/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/dev/auth/superadmin", {
        method: "POST",
      });
      expect(mocks.replace).toHaveBeenCalledWith("/superadmin");
    });
    expect(store.getState().auth.isDevSession).toBe(true);
    expect(store.getState().auth.activeContext?.type).toBe("GLOBAL_ADMIN");
  });

  it("dev superadmin login muestra error cuando el modo dev está deshabilitado", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    );

    renderWithAuthStore(<DevSuperadminLoginPage />);

    await user.click(
      screen.getByRole("button", { name: /Entrar como Superadmin local/i }),
    );

    expect(
      await screen.findByText(/No se pudo iniciar la sesión local/i),
    ).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
