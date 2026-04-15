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

describe("resolveAuthResultadosRedirect", () => {
  it("returns null when there is no active session", () => {
    expect(resolveAuthResultadosRedirect(null, null)).toBeNull();
  });

  it("redirects pending and rejected users to state pages", () => {
    expect(
      resolveAuthResultadosRedirect(createUser({ status: "PENDING" }), "token"),
    ).toBe("/resultados/pendiente");

    expect(
      resolveAuthResultadosRedirect(createUser({ status: "REJECTED" }), "token"),
    ).toBe("/resultados/rechazado");
  });

  it("redirects public users and lets tenant users request resultados access", () => {
    expect(
      resolveAuthResultadosRedirect(createUser({ role: "publico" }), "token"),
    ).toBe("/resultados");

    expect(
      resolveAuthResultadosRedirect(createUser({ role: "TENANT_ADMIN" }), "token"),
    ).toBeNull();
  });

  it("builds scoped redirects for mayor and governor", () => {
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
