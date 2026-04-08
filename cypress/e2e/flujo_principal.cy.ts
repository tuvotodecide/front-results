/// <reference types="cypress" />

describe("Compat legacy externa", () => {
  it("redirige la raíz a la superficie canónica de resultados", () => {
    cy.visit("/");
    cy.location("pathname").should("eq", "/resultados");
  });

  it("redirige auth legacy de votación a /votacion/*", () => {
    cy.visit("/login");
    cy.location("pathname").should("eq", "/votacion/login");

    cy.visit("/registrarse");
    cy.location("pathname").should("eq", "/votacion/registrarse");

    cy.visit("/recuperar");
    cy.location("pathname").should("eq", "/votacion/recuperar");
  });

  it("redirige voting legacy público a la superficie canónica", () => {
    cy.visit("/elections/past");
    cy.location("pathname").should("eq", "/votacion/elecciones/pasadas");

    cy.visit("/elections/demo-election/public");
    cy.location("pathname").should(
      "eq",
      "/votacion/elecciones/demo-election/publica",
    );
  });
});
