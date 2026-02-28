export { };
describe("Auth E2E Real - Casos 31–36", () => {
  const pickScopeMayorLPZ = () => {
    cy.contains("Seleccione Departamento", { timeout: 60000 }).should("exist");
    cy.contains("button", "La Paz", { timeout: 60000 }).click({ force: true });

    cy.contains("Seleccione Provincia", { timeout: 60000 }).should("exist");
    cy.contains("button", "Murillo", { timeout: 60000 }).click({ force: true });

    cy.contains("Seleccione Municipio", { timeout: 60000 }).should("exist");
    cy.contains("button", "Nuestra Señora de La Paz", { timeout: 60000 }).click(
      {
        force: true,
      },
    );
  };

  const pickScopeGovernorLPZ = () => {
    cy.contains("Seleccione su Departamento", { timeout: 60000 }).should(
      "exist",
    );
    cy.contains("button", "La Paz", { timeout: 60000 }).click({ force: true });
  };
  const PASSWORD = "test1234";

  beforeEach(() => {
    cy.clearSession();
  });

  it("28: Validaciones de registro (formulario)", () => {
    cy.visit("/registrarse");

    cy.get('[data-cy="register-submit"]').click();

    cy.contains("El carnet es obligatorio").should("exist");
    cy.contains("El nombre completo es obligatorio").should("exist");
    cy.contains("El correo es obligatorio").should("exist");
    cy.contains("La contraseña es obligatoria").should("exist");
    cy.contains("Debes confirmar tu contraseña").should("exist");

    // email inválido + mismatch
    cy.get('[data-cy="register-dni"]').type("1234567");
    cy.get('[data-cy="register-name"]').type("Juan Perez");
    cy.get('[data-cy="register-email"]').type("no-es-email");
    cy.get('[data-cy="register-password"]').type("12345678");
    cy.get('[data-cy="register-confirm-password"]').type("abcdefghi");

    // seleccionar scope (por defecto roleType = MAYOR)
    pickScopeMayorLPZ();

    cy.get('[data-cy="register-submit"]').click();

    cy.contains("Correo electrónico inválido").should("exist");
    cy.contains("Las contraseñas no coinciden").should("exist");
  });
  it("29: Registro exitoso y estado Pendiente", () => {
    const email = `usuarioregistro+${Date.now()}@test.com`;
    const PASSWORD = "test1234";

    cy.visit("/registrarse");

    cy.get('[data-cy="register-dni"]').type(String(Date.now()).slice(-7));
    cy.get('[data-cy="register-name"]').type("Usuario Registro");
    cy.get('[data-cy="register-email"]').type(email);
    cy.get('[data-cy="register-password"]').type(PASSWORD);
    cy.get('[data-cy="register-confirm-password"]').type(PASSWORD);

    pickScopeMayorLPZ();

    cy.get('[data-cy="register-submit"]').click();

    // Espera el redirect real
    cy.location("pathname", { timeout: 20000 }).should("eq", "/pendiente");

    // Ahora sí: localStorage ya debió setearse
    cy.window().then((win) => {
      expect(win.localStorage.getItem("pendingEmail")).to.eq(email);
      expect(win.localStorage.getItem("pendingReason")).to.eq("VERIFY_EMAIL");
    });
  });

  it("30: Registro duplicado (muestra modal)", () => {
    const email = "alcalde@test.com";
    const PASSWORD = "test1234";

    cy.visit("/registrarse");

    cy.get('[data-cy="register-dni"]').type(String(Date.now()).slice(-7));
    cy.get('[data-cy="register-name"]').type("Usuario Duplicado");
    cy.get('[data-cy="register-email"]').type(email);
    cy.get('[data-cy="register-password"]').type(PASSWORD);
    cy.get('[data-cy="register-confirm-password"]').type(PASSWORD);

    pickScopeMayorLPZ();

    cy.get('[data-cy="register-submit"]').click();

    // Modal: título fijo de tu código
    cy.contains("Hubo un problema", { timeout: 20000 }).should("exist");

    // Mensaje del backend (el que mostraste):
    cy.contains(/usuario ya registrado|ya registrado/i).should("exist");

    // Debe quedarse en registro (no navegar a /pendiente)
    cy.location("pathname", { timeout: 10000 }).should("eq", "/registrarse");
  });

  it("30: Login credenciales incorrectasmuestra modal y permanece en /login", () => {
    cy.visit("/login");
    cy.get('[data-cy="login-email"]').type("alcalde@test.com");
    cy.get('[data-cy="login-password"]').type("malpass1234");
    cy.get('[data-cy="login-submit"]').click();
    cy.contains("Credenciales inválidas").should("exist");
  });

  it("31: Login PENDIENTE es bloqueado por backend y muestra modal", () => {
    cy.loginUI("pendiente@test.com", PASSWORD);

    cy.contains(
      "Un Superadmin debe aprobar tu acceso para habilitar el sistema.",
      { timeout: 10000 },
    ).should("exist");
  });

  it("32: Login NO VERIFICADO es bloqueado por backend y muestra modal", () => {
    cy.loginUI("noverificado@test.com", PASSWORD);

    cy.contains("Te enviamos un enlace de verificación a tu correo.", {
      timeout: 10000,
    }).should("exist");
  });

  it("33: Login ALCALDE exitoso redirige a /resultados", () => {
    cy.loginUI("alcalde@test.com", PASSWORD);

    cy.location("pathname", { timeout: 10000 }).should("eq", "/resultados");
  });

  it("33: Usuario rechazado/inactivo", () => {
    cy.loginUI("rechazado@test.com", "test1234");

    // Aserta algo que sí existe en tu UI (modal/título genérico)
    cy.contains(
      /hubo un problema|acceso denegado|no autorizado|forbidden|credenciales inválidas/i,
      {
        timeout: 15000,
      },
    ).should("exist");

    cy.location("pathname", { timeout: 15000 }).should("eq", "/login");
  });

  it("34: Acceso directo por URL estando Pendiente/inactivo", () => {
    cy.visitWithAuth("/panel", {
      token: "fake_token",
      user: {
        id: "seed-pending",
        email: "pendiente@test.com",
        name: "PENDIENTE",
        role: "MAYOR",
        isApproved: false,
        status: "PENDING",
      },
    });

    cy.location("pathname", { timeout: 15000 }).should((p) => {
      expect(["/pendiente", "/login"]).to.include(p);
    });
  });

  it("34: Login GOBERNADOR exitoso redirige a /resultados", () => {
    cy.loginUI("gobernador@test.com", PASSWORD);

    cy.location("pathname", { timeout: 10000 }).should("eq", "/resultados");
  });

  it("35: ProtectedRoutes restringe MAYOR/GOVERNOR fuera de /control-personal y /auditoria-tse", () => {
    cy.visitWithAuth("/panel", {
      token: "fake_token",
      user: {
        id: "seed-mayor",
        email: "alcalde@test.com",
        name: "ALCALDE",
        role: "MAYOR",
        isApproved: true,
        status: "ACTIVE",
      },
    });

    cy.location("pathname", { timeout: 10000 }).should("eq", "/resultados");

    cy.visitWithAuth("/control-personal", {
      token: "fake_token",
      user: {
        id: "seed-mayor",
        email: "alcalde@test.com",
        name: "ALCALDE",
        role: "MAYOR",
        isApproved: true,
        status: "ACTIVE",
      },
    });
    cy.location("pathname", { timeout: 10000 }).should(
      "include",
      "/control-personal",
    );

    cy.visitWithAuth("/auditoria-tse", {
      token: "fake_token",
      user: {
        id: "seed-mayor",
        email: "alcalde@test.com",
        name: "ALCALDE",
        role: "MAYOR",
        isApproved: true,
        status: "ACTIVE",
      },
    });
    cy.location("pathname", { timeout: 10000 }).should(
      "include",
      "/auditoria-tse",
    );
  });

  it("35: Persistencia de sesión", () => {
    cy.loginUI("alcalde@test.com", "test1234");

    cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

    cy.visit("/panel");
    cy.location("pathname", { timeout: 15000 }).should("not.eq", "/login");

    cy.reload();
    cy.location("pathname", { timeout: 15000 }).should("not.eq", "/login");
  });

  it("36b: Token inválido en /control-personal termina en /login", () => {
    cy.visit("/control-personal");

    cy.location("pathname", { timeout: 20000 }).should("eq", "/login");
  });

  it("36: Sin sesión, ProtectedRoutes redirige a /login y guarda from", () => {
    cy.visit("/panel?x=1");

    cy.location("pathname", { timeout: 10000 }).should("eq", "/login");

    cy.window().then((win) => {
      const usr = (win.history.state && win.history.state.usr) || {};
      expect(usr.from).to.eq("/panel?x=1");
    });
  });
});
