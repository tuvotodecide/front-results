describe("votación pública canónica", () => {
  it("recorre landing, elecciones pasadas, detalle público y modal de padrón", () => {
    cy.intercept("GET", "**/api/v1/voting/events/public/landing", {
      statusCode: 200,
      body: {
        active: [],
        upcoming: [],
        results: [
          {
            id: "event-public-1",
            name: "Elección Centro de Estudiantes 2025",
            objective: "Universidad Demo",
            votingStart: "2025-01-10T08:00:00.000Z",
            votingEnd: "2025-01-10T18:00:00.000Z",
          },
        ],
      },
    }).as("publicLanding");

    cy.intercept("GET", "**/api/v1/voting/events/public/detail/event-public-1", {
      statusCode: 200,
      body: {
        id: "event-public-1",
        name: "Elección Centro de Estudiantes 2025",
        objective: "Universidad Demo",
        phase: "RESULTS",
        votingStart: "2025-01-10T08:00:00.000Z",
        votingEnd: "2025-01-10T18:00:00.000Z",
        publicEligibilityEnabled: true,
        resultsAvailable: true,
        options: [
          {
            id: "party-1",
            name: "Frente Verde",
            color: "#2E7D32",
            candidates: [{ id: "cand-1", name: "Ana Pérez", roleName: "Presidencia" }],
          },
        ],
        results: [{ option: "Frente Verde", votes: 120 }],
      },
    }).as("publicDetail");

    cy.intercept(
      "GET",
      "**/api/v1/voting/events/event-public-1/eligibility/public?carnet=*",
      {
        statusCode: 200,
        body: {
          status: "ELIGIBLE",
          referenceVersion: "padron-v1",
        },
      },
    ).as("publicEligibility");

    cy.visit("/votacion");
    cy.get('a[href="/votacion/elecciones/pasadas"]').click();

    cy.wait("@publicLanding");
    cy.location("pathname").should("eq", "/votacion/elecciones/pasadas");
    cy.contains("Elecciones pasadas").should("be.visible");
    cy.contains("Elección Centro de Estudiantes 2025").should("be.visible");
    cy.contains("Ver elección").click();

    cy.wait("@publicDetail");
    cy.location("pathname").should(
      "eq",
      "/votacion/elecciones/event-public-1/publica",
    );
    cy.contains("Elección Centro de Estudiantes 2025").should("be.visible");
    cy.contains("Consultar mi estado").click();

    cy.get("#carnet-input").type("12345678");
    cy.contains("button", "Verificar").click();

    cy.wait("@publicEligibility");
    cy.contains("HABILITADO").should("be.visible");
  });
});
