import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import ForgotPasswordResultadosPage from "@/domains/auth-resultados/screens/ForgotPasswordResultadosPage";
import ResetPasswordResultadosPage from "@/domains/auth-resultados/screens/ResetPasswordResultadosPage";
import VerifyResultadosPage from "@/domains/auth-resultados/screens/VerifyResultadosPage";
import ForgotPasswordVotacionPage from "@/domains/auth-votacion/screens/ForgotPasswordVotacionPage";
import ResetPasswordVotacionPage from "@/domains/auth-votacion/screens/ResetPasswordVotacionPage";
import VerifyVotacionPage from "@/domains/auth-votacion/screens/VerifyVotacionPage";
import { renderWithAuthStore } from "../utils/renderWithStore";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  triggerVerify: vi.fn(),
  verifyInstitutional: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("@/store/auth/authEndpoints", () => ({
  useForgotPasswordMutation: () => [mocks.forgotPassword],
  useResetPasswordMutation: () => [mocks.resetPassword],
  useLazyVerifyEmailQuery: () => [mocks.triggerVerify],
  useVerifyInstitutionalAdminApplicationMutation: () => [mocks.verifyInstitutional],
}));

vi.mock("@/domains/auth-resultados/navigation/compat", () => ({
  Link: ({ children, href, to }: { children: ReactNode; href?: string; to?: string }) => (
    <a href={href ?? to}>{children}</a>
  ),
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [mocks.searchParams],
}));

vi.mock("@/domains/auth-votacion/navigation/compat", () => ({
  Link: ({ children, href, to }: { children: ReactNode; href?: string; to?: string }) => (
    <a href={href ?? to}>{children}</a>
  ),
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [mocks.searchParams],
}));

describe("MX-03 | Autenticación, sesiones, roles y permisos | Frontend Admin | Password y correo", () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.forgotPassword.mockReset();
    mocks.resetPassword.mockReset();
    mocks.triggerVerify.mockReset();
    mocks.verifyInstitutional.mockReset();
    mocks.searchParams = new URLSearchParams();
  });

  it("AUT-PWD-P1-001 | solicita recuperación desde resultados y conserva enlaces de resultados", async () => {
    const user = userEvent.setup();
    mocks.forgotPassword.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ ok: true }),
    });

    const { container } = renderWithAuthStore(<ForgotPasswordResultadosPage />);

    await user.type(container.querySelector('[data-cy="forgot-email"]') as HTMLInputElement, "user@test.com");
    await user.click(container.querySelector('[data-cy="forgot-submit"]') as HTMLButtonElement);

    await waitFor(() => {
      expect(mocks.forgotPassword).toHaveBeenCalledWith({
        email: "user@test.com",
        context: "resultados",
      });
    });
    expect(screen.getByRole("link", { name: /volver a iniciar sesión/i })).toHaveAttribute(
      "href",
      "/resultados/login",
    );
  });

  it("AUT-PWD-P0-006 | restablece contraseña desde resultados y vuelve al login de resultados", async () => {
    const user = userEvent.setup();
    mocks.searchParams = new URLSearchParams("token=resultados-token");
    mocks.resetPassword.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ ok: true }),
    });

    const { container } = renderWithAuthStore(<ResetPasswordResultadosPage />);

    await user.type(container.querySelector('[data-cy="reset-password"]') as HTMLInputElement, "12345678");
    await user.type(container.querySelector('[data-cy="reset-confirm"]') as HTMLInputElement, "12345678");
    await user.click(container.querySelector('[data-cy="reset-submit"]') as HTMLButtonElement);

    await waitFor(() => {
      expect(mocks.resetPassword).toHaveBeenCalledWith({
        token: "resultados-token",
        password: "12345678",
      });
      expect(mocks.navigate).toHaveBeenCalledWith("/resultados/login", { replace: true });
    });
  });

  it("AUT-EML-P1-001 | verifica correo de resultados con endpoint de resultados", async () => {
    mocks.searchParams = new URLSearchParams("token=resultados-verify");
    mocks.triggerVerify.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ ok: true }),
    });

    renderWithAuthStore(<VerifyResultadosPage />);

    await waitFor(() => {
      expect(mocks.triggerVerify).toHaveBeenCalledWith({ token: "resultados-verify" });
    });
    expect(await screen.findByText("Correo verificado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ir a iniciar sesión/i })).toHaveAttribute(
      "href",
      "/resultados/login",
    );
  });

  it("AUT-PWD-P1-001 | solicita recuperación desde votación y conserva enlaces de votación", async () => {
    const user = userEvent.setup();
    mocks.forgotPassword.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ ok: true }),
    });

    const { container } = renderWithAuthStore(<ForgotPasswordVotacionPage />);

    await user.type(container.querySelector('[data-cy="forgot-email"]') as HTMLInputElement, "admin@test.com");
    await user.click(container.querySelector('[data-cy="forgot-submit"]') as HTMLButtonElement);

    await waitFor(() => {
      expect(mocks.forgotPassword).toHaveBeenCalledWith({
        email: "admin@test.com",
        context: "votacion",
      });
    });
    expect(screen.getByRole("link", { name: /volver a iniciar sesión/i })).toHaveAttribute(
      "href",
      "/votacion/login",
    );
  });

  it("AUT-PWD-P0-006 | restablece contraseña desde votación y vuelve al login de votación", async () => {
    const user = userEvent.setup();
    mocks.searchParams = new URLSearchParams("token=votacion-token");
    mocks.resetPassword.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ ok: true }),
    });

    const { container } = renderWithAuthStore(<ResetPasswordVotacionPage />);

    await user.type(container.querySelector('[data-cy="reset-password"]') as HTMLInputElement, "12345678");
    await user.type(container.querySelector('[data-cy="reset-confirm"]') as HTMLInputElement, "12345678");
    await user.click(container.querySelector('[data-cy="reset-submit"]') as HTMLButtonElement);

    await waitFor(() => {
      expect(mocks.resetPassword).toHaveBeenCalledWith({
        token: "votacion-token",
        password: "12345678",
      });
      expect(mocks.navigate).toHaveBeenCalledWith("/votacion/login", { replace: true });
    });
  });

  it("AUT-EML-P1-001 | verifica correo institucional con endpoint de votación", async () => {
    mocks.searchParams = new URLSearchParams("token=votacion-verify");
    mocks.verifyInstitutional.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ ok: true }),
    });

    renderWithAuthStore(<VerifyVotacionPage />);

    await waitFor(() => {
      expect(mocks.verifyInstitutional).toHaveBeenCalledWith({ token: "votacion-verify" });
    });
    expect(await screen.findByText("Correo verificado correctamente")).toBeInTheDocument();
  });
});
