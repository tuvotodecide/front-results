import {
  loginResultadosValidationSchema,
  mapBackendRole,
} from "@/domains/auth-resultados/screens/LoginResultadosPage";
import { registerResultadosValidationSchema } from "@/domains/auth-resultados/screens/RegisterResultadosPage";

describe("auth resultados validation", () => {
  it("maps backend roles to frontend roles", () => {
    expect(mapBackendRole("ADMIN")).toBe("SUPERADMIN");
    expect(mapBackendRole("governor")).toBe("GOVERNOR");
    expect(mapBackendRole("ACCESS_APPROVER")).toBe("ACCESS_APPROVER");
    expect(mapBackendRole("otro")).toBe("publico");
  });

  it("validates canonical resultados login payloads", async () => {
    await expect(
      loginResultadosValidationSchema.validate(
        { email: "bad-email", password: "123" },
        { abortEarly: false },
      ),
    ).rejects.toMatchObject({
      errors: expect.arrayContaining([
        "Correo electrónico inválido",
        "Mínimo 8 caracteres",
      ]),
    });

    await expect(
      loginResultadosValidationSchema.validate({
        email: "admin@test.com",
        password: "12345678",
      }),
    ).resolves.toMatchObject({
      email: "admin@test.com",
      password: "12345678",
    });
  });

  it("validates canonical resultados register payloads", async () => {
    await expect(
      registerResultadosValidationSchema.validate(
        {
          dni: "",
          name: "",
          email: "mail",
          password: "123",
          confirmPassword: "456",
          roleType: "MAYOR",
          votingDepartmentId: "",
          votingMunicipalityId: "",
        },
        { abortEarly: false },
      ),
    ).rejects.toMatchObject({
      errors: expect.arrayContaining([
        "El carnet es obligatorio",
        "El nombre completo es obligatorio",
        "Correo electrónico inválido",
        "Mínimo 8 caracteres",
        "Las contraseñas no coinciden",
        "Debes seleccionar un municipio",
      ]),
    });

    await expect(
      registerResultadosValidationSchema.validate({
        dni: "1234567",
        name: "Usuaria Test",
        email: "mail@test.com",
        password: "12345678",
        confirmPassword: "12345678",
        roleType: "GOVERNOR",
        votingDepartmentId: "dep-1",
        votingMunicipalityId: "",
      }),
    ).resolves.toMatchObject({
      roleType: "GOVERNOR",
      votingDepartmentId: "dep-1",
    });
  });
});
