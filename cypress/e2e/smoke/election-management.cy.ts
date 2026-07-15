describe("[FLOW:ELECTIONS] Smoke de gestión de votaciones", () => {
  beforeEach(() => {
    cy.clearSession();
  });

  it("crea una votación con validación visible, payload mock y navegación posterior", () => {
    cy.intercept("GET", "**/api/v1/voting/events*", {
      fixture: "elections/events-list.json"
    }).as("eventsList");
    cy.intercept("POST", "**/api/v1/voting/events", (req) => {
      expect(req.body).to.include({
        name: "Elección Smoke Cypress",
        objective: "Validar payload del wizard"
      });
      req.reply({
        statusCode: 200,
        body: {
          id: "event-created-smoke",
          tenantId: "tenant-smoke",
          name: req.body.name,
          objective: req.body.objective,
          state: "DRAFT",
          status: "DRAFT",
          votingStart: req.body.votingStart,
          votingEnd: req.body.votingEnd,
          resultsPublishAt: req.body.resultsPublishAt
        }
      });
    }).as("createEvent");

    cy.setTenantSession("/votacion/elecciones");
    cy.wait("@eventsList");
    cy.contains("Mis Votaciones").should("be.visible");
    cy.contains("Nueva Votación").click();
    cy.location("pathname").should("eq", "/votacion/elecciones/new");

    cy.contains("button", "Siguiente").should("be.disabled");
    cy.get("#institution").type("Elección Smoke Cypress");
    cy.get("#description").type("Validar payload del wizard");
    cy.contains("button", "Siguiente").click();

    cy.get("#votingStartDate").type("2027-01-10T08:00");
    cy.get("#votingEndDate").type("2027-01-10T18:00");
    cy.get("#resultsDate").type("2027-01-10T19:00");
    cy.contains("button", "CREAR").click();
    cy.contains("¿Crear votación?").should("be.visible");
    cy.contains("button", "Confirmar").click();

    cy.wait("@createEvent");
    cy.location("pathname").should("eq", "/votacion/elecciones/event-created-smoke/config/cargos");
  });
});
