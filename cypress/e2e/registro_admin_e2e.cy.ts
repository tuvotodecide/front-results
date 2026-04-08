/// <reference types="cypress" />

describe("Superficie canónica - admin institucional", () => {
  const apiUrl = Cypress.env("API_URL") || "http://localhost:3005/api/v1";
  const superadminEmail = Cypress.env("E2E_SUPERADMIN_EMAIL");
  const superadminPassword = Cypress.env("E2E_SUPERADMIN_PASSWORD");
  const testEmail =
    Cypress.env("E2E_TEST_EMAIL") ||
    `e2e.voting.${Date.now()}@test.local`;
  const testPassword =
    Cypress.env("E2E_TEST_PASSWORD") || "Test12345*";

  let adminToken = "";

  const inlineSvgFile = {
    contents: Cypress.Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#459151"/></svg>',
    ),
    fileName: "logo-e2e.svg",
    mimeType: "image/svg+xml",
  };

  before(function () {
    if (!superadminEmail || !superadminPassword) {
      cy.log(
        "Skipping backend-dependent flow: missing CYPRESS_E2E_SUPERADMIN_EMAIL or CYPRESS_E2E_SUPERADMIN_PASSWORD.",
      );
      this.skip();
    }

    cy.request({
      method: "POST",
      url: `${apiUrl}/auth/login`,
      body: {
        email: superadminEmail,
        password: superadminPassword,
      },
    }).then((resp) => {
      adminToken = resp.body.accessToken;
    });
  });

  it("renderiza las rutas canónicas públicas de autenticación", () => {
    cy.visit("/votacion/registrarse");
    cy.location("pathname").should("eq", "/votacion/registrarse");
    cy.get('[data-cy="register-email"]').should("be.visible");

    cy.visit("/votacion/login");
    cy.location("pathname").should("eq", "/votacion/login");
    cy.get('input[name="email"]').should("be.visible");
    cy.get('input[name="password"]').should("be.visible");
  });

  it("crea un admin aprobado y recorre el flujo canónico de votación privada", () => {
    cy.request({
      method: "DELETE",
      url: `${apiUrl}/institutional-admin-applications/test/by-email/${encodeURIComponent(testEmail)}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      failOnStatusCode: false,
    });

    cy.visit("/votacion/registrarse");
    cy.get('[data-cy="register-dni"]').should("be.visible").type("E2E-12345");
    cy.get('[data-cy="register-name"]').type("Usuario E2E");
    cy.get('[data-cy="register-email"]').type(testEmail);
    cy.get('[data-cy="register-tenant-name"]').type("Institucion E2E Cypress");
    cy.get('[data-cy="register-password"]').type(testPassword);
    cy.get('[data-cy="register-confirm-password"]').type(testPassword);

    cy.request({
      method: "POST",
      url: `${apiUrl}/institutional-admin-applications/test/approved-admin`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        dni: "E2E-12345",
        name: "Usuario E2E",
        email: testEmail,
        password: testPassword,
        institutionName: "Institucion E2E Cypress",
      },
      failOnStatusCode: false,
    }).then(({ status }) => {
      expect([201, 409]).to.include(status);
    });

    cy.visit("/votacion/login");
    cy.get('input[name="email"]').clear().type(testEmail);
    cy.get('input[name="password"]').clear().type(testPassword);
    cy.contains("button", "Iniciar Sesión").click();

    cy.location("pathname", { timeout: 15000 }).should(
      "eq",
      "/votacion/elecciones",
    );

    cy.contains("button", "Nueva Votación", { timeout: 10000 }).click();
    cy.location("pathname").should("eq", "/votacion/elecciones/new");

    cy.contains("label", "¿A qué institución pertenece?")
      .parent()
      .find("input, textarea")
      .first()
      .type("Universidad Tecnológica de Prueba");

    cy.contains("label", "¿Cuál es el objetivo o descripción?")
      .parent()
      .find("input, textarea")
      .first()
      .type("Esta es una votación de prueba creada automáticamente por Cypress.");

    cy.contains("button", "Siguiente").click();

    const now = new Date();
    const futureDate = (days: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() + days);
      return date.toISOString().slice(0, 16);
    };

    cy.contains("label", "¿Cuándo abre la votación?")
      .parent()
      .find('input[type="datetime-local"]')
      .type(futureDate(1));

    cy.contains("label", "¿Cuándo cierra la votación?")
      .parent()
      .find('input[type="datetime-local"]')
      .type(futureDate(2));

    cy.contains("label", "¿Cuándo se muestran los resultados?")
      .parent()
      .find('input[type="datetime-local"]')
      .type(futureDate(2));

    cy.contains(/Crear/i, { timeout: 15000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Confirmar/i, { timeout: 20000 }).click({ force: true });

    cy.location("pathname", { timeout: 20000 }).should(
      "match",
      /^\/votacion\/elecciones\/[^/]+\/config\/cargos$/,
    );

    cy.contains("button", "Agregar Cargo", { timeout: 10000 }).click();
    cy.get('input[placeholder="Ej. Presidente"]').type("Presidente");
    cy.contains("button", "Guardar Cargo").click();
    cy.contains("Presidente", { timeout: 10000 }).should("be.visible");

    cy.contains("button", "Siguiente: Agregar planchas y candidatos").click();
    cy.location("pathname").should("match", /\/config\/planchas$/);

    cy.contains("button", "Crear Partido", { timeout: 10000 }).click();
    cy.get('input[placeholder="Ej: Movimiento Futuro"]')
      .should("be.visible")
      .type(`Partido Fenix ${Date.now()}`);
    cy.get('input[type="file"]').first().selectFile(inlineSvgFile, {
      force: true,
    });
  });
});
