import { render, screen } from "@testing-library/react";
import SuperadminRegistrosRoute from "@/app/(superadmin)/superadmin/gestion/registros/page";
import PublicRecoveryRoute from "@/app/(auth-votacion)/votacion/recuperacion-institucional/page";
import DevSuperadminRoute from "@/app/dev/superadmin-login/page";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("not found");
  }),
}));

vi.mock("@/domains/access-approvals/screens/AccessApprovalsPage", () => ({
  default: () => <p>Gestión de registros ruta superadmin</p>,
}));

vi.mock("@/domains/auth-votacion/screens/InstitutionalRecoveryPublicPage", () => ({
  default: () => <p>Formulario público de recuperación institucional</p>,
}));

vi.mock("@/domains/dev-auth/DevSuperadminLoginPage", () => ({
  default: () => <p>Acceso local Superadmin</p>,
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

describe("rutas nuevas de Superadmin y recuperación institucional", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    mocks.notFound.mockClear();
  });

  it("conecta /superadmin/gestion/registros con la pantalla existente de registros", () => {
    render(<SuperadminRegistrosRoute />);

    expect(
      screen.getByText("Gestión de registros ruta superadmin"),
    ).toBeInTheDocument();
  });

  it("conecta /votacion/recuperacion-institucional con el formulario público", () => {
    render(<PublicRecoveryRoute />);

    expect(
      screen.getByText("Formulario público de recuperación institucional"),
    ).toBeInTheDocument();
  });

  it("permite /dev/superadmin-login solo cuando dev auth está habilitado", () => {
    vi.stubEnv("ENABLE_DEV_AUTH", "true");

    render(<DevSuperadminRoute />);

    expect(screen.getByText("Acceso local Superadmin")).toBeInTheDocument();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it("bloquea /dev/superadmin-login cuando dev auth está deshabilitado", () => {
    expect(() => DevSuperadminRoute()).toThrow("not found");
    expect(mocks.notFound).toHaveBeenCalled();
  });
});
