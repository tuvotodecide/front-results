const createToken = (payload: Record<string, unknown>) => {
  const encode = (value: Record<string, unknown>) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.signature`;
};

describe("[MX-03][FLOW:AUTH] Smoke de sesión y guards", () => {
  beforeEach(() => {
    cy.clearSession();
  });

  it("[AUT-GRD-P0-001][AUT-LOG-P0-002] redirige ruta privada al login canonico y permite entrar con login territorial mock", () => {
    const accessToken = createToken({
      sub: "mayor-smoke",
      role: "MAYOR",
      active: true,
      votingDepartmentId: "dep-smoke",
      votingMunicipalityId: "mun-smoke",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    cy.visit("/resultados/control-personal");
    cy.location("pathname").should("eq", "/resultados/login");

    cy.intercept("POST", "**/api/v1/auth/login", {
      statusCode: 200,
      body: {
        accessToken,
        role: "MAYOR",
        active: true,
        availableContexts: [
          {
            type: "TERRITORIAL",
            role: "MAYOR",
            votingDepartmentId: "dep-smoke",
            votingMunicipalityId: "mun-smoke",
          },
        ],
        requiresContextSelection: false,
        defaultContext: {
          type: "TERRITORIAL",
          role: "MAYOR",
          votingDepartmentId: "dep-smoke",
          votingMunicipalityId: "mun-smoke",
        },
        accessStatus: null,
        user: {
          id: "mayor-smoke",
          email: "mayor@smoke.test",
          name: "Mayor Smoke",
          role: "MAYOR",
        },
      },
    }).as("login");

    cy.visit("/resultados/login?from=%2Fresultados%2Fcontrol-personal");
    cy.get('[data-cy="login-email"]').type("mayor@smoke.test");
    cy.get('[data-cy="login-password"]').type("12345678");
    cy.get('[data-cy="login-submit"]').click();

    cy.wait("@login").its("request.body").should("include", {
      email: "mayor@smoke.test",
      password: "12345678",
    });
    cy.location("pathname").should("eq", "/resultados/control-personal");
  });

  it("[AUT-STA-P0-002] bloquea una cuenta territorial pendiente desde login y la envia a pendiente", () => {
    const pendingToken = createToken({
      sub: "pending-smoke",
      role: "MAYOR",
      active: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    cy.intercept("POST", "**/api/v1/auth/login", {
      statusCode: 200,
      body: {
        accessToken: pendingToken,
        role: "MAYOR",
        active: false,
        user: {
          id: "pending-smoke",
          email: "pending@smoke.test",
          name: "Pending Smoke",
          role: "MAYOR",
        },
      },
    }).as("pendingLogin");

    cy.visit("/resultados/login");
    cy.get('[data-cy="login-email"]').type("pending@smoke.test");
    cy.get('[data-cy="login-password"]').type("12345678");
    cy.get('[data-cy="login-submit"]').click();
    cy.wait("@pendingLogin");
    cy.location("pathname").should("eq", "/resultados/pendiente");
    cy.contains("pendiente", { matchCase: false }).should("be.visible");
  });

  it("[AUT-SES-P0-004][AUT-OUT-P0-001] limpia sesion expirada y permite cerrar sesion desde el panel", () => {
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
