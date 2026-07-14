const createToken = (payload: Record<string, unknown>) => {
  const encode = (value: Record<string, unknown>) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.signature`;
};

describe("[FLOW:AUTH] Smoke de sesión y guards", () => {
  beforeEach(() => {
    cy.clearSession();
  });

  it("redirige una ruta privada al login y permite entrar con login mock", () => {
    const accessToken = createToken({
      sub: "super-smoke",
      role: "SUPERADMIN",
      active: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    cy.intercept("POST", "**/api/v1/auth/login", {
      statusCode: 200,
      body: {
        accessToken,
        role: "SUPERADMIN",
        active: true,
        availableContexts: [{ type: "GLOBAL_ADMIN" }],
        defaultContext: { type: "GLOBAL_ADMIN" },
        user: {
          id: "super-smoke",
          email: "superadmin@smoke.test",
          name: "Superadmin Smoke",
          role: "SUPERADMIN"
        }
      }
    }).as("login");
    cy.intercept("GET", "**/api/v1/auth/profile*", {
      statusCode: 200,
      body: { id: "super-smoke", email: "superadmin@smoke.test" }
    }).as("profile");

    cy.visit("/resultados/login?from=%2Fresultados%2Fpanel");
    cy.get('[data-cy="login-email"]').type("superadmin@smoke.test");
    cy.get('[data-cy="login-password"]').type("12345678");
    cy.get('[data-cy="login-submit"]').click();

    cy.wait("@login").its("request.body").should("include", {
      email: "superadmin@smoke.test",
      password: "12345678"
    });
    cy.location("pathname").should("eq", "/resultados/panel");
    cy.contains("Panel de Control").should("be.visible");
  });

  it("muestra pendiente con respuesta de sesión mock", () => {
    const pendingToken = createToken({
      sub: "pending-smoke",
      role: "MAYOR",
      active: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    cy.intercept("POST", "**/api/v1/auth/login", {
      statusCode: 200,
      body: { accessToken: pendingToken, role: "MAYOR", active: false }
    }).as("pendingLogin");

    cy.visit("/resultados/login");
    cy.get('[data-cy="login-email"]').type("pending@smoke.test");
    cy.get('[data-cy="login-password"]').type("12345678");
    cy.get('[data-cy="login-submit"]').click();
    cy.wait("@pendingLogin");
    cy.location("pathname").should("eq", "/resultados/pendiente");
    cy.contains("pendiente", { matchCase: false }).should("be.visible");
  });

  it("limpia una sesión expirada y permite cerrar sesión desde el panel", () => {
    const expiredToken = createToken({
      sub: "expired-smoke",
      role: "SUPERADMIN",
      active: true,
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    cy.visitWithAuth("/resultados/panel", {
      token: expiredToken,
      user: {
        id: "expired-smoke",
        email: "expired@smoke.test",
        name: "Expired Smoke",
        role: "SUPERADMIN",
        active: true,
        status: "ACTIVE"
      }
    });
    cy.location("pathname").should("eq", "/resultados/login");

    cy.setResultsAdminSession("/resultados/panel");
    cy.contains("Panel de Control").should("be.visible");
    cy.contains("Superadmin Smoke").click();
    cy.get('[data-cy="logout-button"]').click();
    cy.location("pathname").should("eq", "/resultados/login");
    cy.window().its("localStorage.token").should("be.undefined");
  });
});
