import {
  buildRegisterPathWithPrefill,
  resolveRegisterPrefill,
} from "@/domains/auth-context/registerPrefill";

describe("register prefill helpers", () => {
  it("prefers query params over auth user values", () => {
    const searchParams = new URLSearchParams(
      "email=query@test.com&name=Usuario%20Query&dni=998877&crossAccess=1",
    );

    expect(
      resolveRegisterPrefill(searchParams, {
        dni: "111111",
        email: "store@test.com",
        name: "Usuario Store",
      }),
    ).toEqual({
      dni: "998877",
      email: "query@test.com",
      name: "Usuario Query",
      hasExistingIdentity: true,
      isCrossAccess: true,
    });
  });

  it("falls back to the authenticated user when query params are missing", () => {
    expect(
      resolveRegisterPrefill(new URLSearchParams("crossAccess=1"), {
        dni: "445566",
        email: "sesion@test.com",
        name: "Nombre Sesion",
      }),
    ).toEqual({
      dni: "445566",
      email: "sesion@test.com",
      name: "Nombre Sesion",
      hasExistingIdentity: true,
      isCrossAccess: true,
    });
  });

  it("builds a cross-access path only when identity data exists", () => {
    expect(
      buildRegisterPathWithPrefill("/resultados/registrarse", {
        dni: "123456",
        email: "user@test.com",
        name: "Usuaria Test",
      }),
    ).toBe(
      "/resultados/registrarse?dni=123456&email=user%40test.com&name=Usuaria+Test&crossAccess=1",
    );
    expect(buildRegisterPathWithPrefill("/resultados/registrarse", null)).toBe(
      "/resultados/registrarse",
    );
  });
});
