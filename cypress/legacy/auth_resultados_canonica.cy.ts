const createToken = (payload: Record<string, unknown>) => {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${header}.${body}.signature`;
};

describe("auth canónica de resultados", () => {
  beforeEach(() => {
    cy.clearSession();
  });

  it("redirige desde una ruta protegida canónica al login y vuelve al panel tras login válido", () => {
    const accessToken = createToken({
      sub: "super-1",
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
      },
    }).as("login");

    cy.intercept("GET", "**/api/v1/auth/profile*", {
      statusCode: 200,
      body: {
        sub: "super-1",
      },
    }).as("profile");

    cy.visit("/resultados/panel");
    cy.location("pathname").should("eq", "/resultados/login");
    cy.location("search").should("include", "from=%2Fresultados%2Fpanel");

    cy.get('[data-cy="login-email"]').type("superadmin@test.com");
    cy.get('[data-cy="login-password"]').type("12345678");
    cy.get('[data-cy="login-submit"]').click();

    cy.wait("@login");
    cy.wait("@profile");
    cy.location("pathname").should("eq", "/resultados/panel");
    cy.contains("Panel de Control").should("be.visible");
  });

  it("envía a pendiente cuando el login canónico devuelve usuario no aprobado", () => {
    const accessToken = createToken({
      sub: "pending-1",
      role: "MAYOR",
      active: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    cy.intercept("POST", "**/api/v1/auth/login", {
      statusCode: 200,
      body: {
        accessToken,
        role: "MAYOR",
        active: false,
      },
    }).as("login");

    cy.visit("/resultados/login");
    cy.get('[data-cy="login-email"]').type("pendiente@test.com");
    cy.get('[data-cy="login-password"]').type("12345678");
    cy.get('[data-cy="login-submit"]').click();

    cy.wait("@login");
    cy.location("pathname").should("eq", "/resultados/pendiente");
  });

  it("redirige desde el login canónico al scope correcto cuando ya existe sesión válida", () => {
    const accessToken = createToken({
      sub: "mayor-1",
      role: "MAYOR",
      active: true,
      votingDepartmentId: "dep-1",
      votingMunicipalityId: "mun-9",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    cy.visit("/resultados/login", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", accessToken);
        win.localStorage.setItem(
          "user",
          JSON.stringify({
            id: "mayor-1",
            email: "mayor@test.com",
            name: "Mayor",
            role: "MAYOR",
            active: true,
            status: "ACTIVE",
            departmentId: "dep-1",
            municipalityId: "mun-9",
          }),
        );
      },
    });

    cy.location("pathname").should("eq", "/resultados");
    cy.location("search").should("include", "department=dep-1");
    cy.location("search").should("include", "municipality=mun-9");
  });
});
