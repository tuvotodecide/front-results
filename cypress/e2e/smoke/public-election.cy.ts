describe("[FLOW:PUBLIC-ELECTION] Smoke de votación pública", () => {
  beforeEach(() => {
    cy.clearSession();
  });

  it("recorre landing, detalle público y consulta de elegibilidad con fixtures", () => {
    cy.intercept("GET", "**/api/v1/voting/events/public/landing", {
      fixture: "elections/public-landing.json"
    }).as("publicLanding");
    cy.intercept("GET", "**/api/v1/voting/events/public/detail/event-public-smoke", {
      fixture: "elections/public-detail.json"
    }).as("publicDetail");
    cy.intercept("GET", "**/api/v1/voting/events/event-public-smoke/eligibility/public?carnet=*", {
      statusCode: 200,
      body: { status: "ELIGIBLE", referenceVersion: "padron-smoke" }
    }).as("publicEligibility");

    cy.visit("/votacion");
    cy.get('a[href="/votacion/elecciones/pasadas"]').click();

    cy.wait("@publicLanding");
    cy.contains("Elección Pública Smoke").should("be.visible");
    cy.contains("Ver elección").scrollIntoView().click({ force: true });

    cy.wait("@publicDetail");
    cy.location("pathname").should("eq", "/votacion/elecciones/event-public-smoke/publica");
    cy.contains("Frente Verde").should("be.visible");
    cy.contains("Consultar mi estado").scrollIntoView().click({ force: true });
    cy.get('[role="dialog"][aria-label="Consulta tu estado en el Padrón"]').within(() => {
      cy.get("input#carnet-input").type("1234567");
      cy.contains("button", "Verificar").click();
    });
    cy.wait("@publicEligibility");
    cy.contains("HABILITADO").should("be.visible");
  });

  it("muestra estado público no disponible en detalle", () => {
    cy.intercept("GET", "**/api/v1/voting/events/public/detail/event-missing", {
      statusCode: 404,
      body: { message: "Elección no encontrada" }
    }).as("publicDetailMissing");

    cy.visit("/votacion/elecciones/event-missing/publica");
    cy.wait("@publicDetailMissing");
    cy.contains("Elección no encontrada").should("be.visible");
  });
});
