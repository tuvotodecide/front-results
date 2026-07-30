import { resolveAuthResultadosRedirect } from "@/domains/auth-resultados/utils/resolveAuthRedirect";
import type { AuthState } from "@/store/auth/authSlice";

const createUser = (
  overrides: Partial<NonNullable<AuthState["user"]>>,
): NonNullable<AuthState["user"]> => ({
  id: "user-1",
  email: "user@test.com",
  name: "User",
  role: "publico",
  active: true,
  ...overrides,
});

describe("MX-03 | Autenticación, sesiones, roles y permisos | Frontend Admin | Redirect resultados", () => {
  it("AUT-SES-P0-001 no redirige cuando no existe sesion activa", () => {
    expect(resolveAuthResultadosRedirect(null, null)).toBeNull();
  });

  it("AUT-GRD-P0-003 redirige usuarios pendientes y rechazados a paginas de estado", () => {
    expect(
      resolveAuthResultadosRedirect(createUser({ status: "PENDING" }), "token"),
    ).toBe("/resultados/pendiente");

    expect(
      resolveAuthResultadosRedirect(createUser({ status: "REJECTED" }), "token"),
    ).toBe("/resultados/rechazado");
  });

  it("AUT-ARE-P0-001 permite resultados publico y no activa tenant sin contexto territorial", () => {
    expect(
      resolveAuthResultadosRedirect(createUser({ role: "publico" }), "token"),
    ).toBe("/resultados");

    expect(
      resolveAuthResultadosRedirect(createUser({ role: "TENANT_ADMIN" }), "token"),
    ).toBeNull();
  });

  it("AUT-TER-P0-001 construye retorno territorial solo con alcance del usuario autenticado", () => {
    expect(
      resolveAuthResultadosRedirect(
        createUser({
          role: "MAYOR",
          departmentId: "dep-1",
          municipalityId: "mun-1",
        }),
        "token",
      ),
    ).toBe("/resultados?department=dep-1&municipality=mun-1");

    expect(
      resolveAuthResultadosRedirect(
        createUser({
          role: "GOVERNOR",
          departmentId: "dep-9",
        }),
        "token",
      ),
    ).toBe("/resultados?department=dep-9");
  });
});
