describe("[FLOW:APPROVALS] Smoke de aprobaciones institucionales", () => {
  beforeEach(() => {
    cy.clearSession();
  });

  it("carga solicitudes, abre detalle y aprueba con payload representativo", () => {
    cy.fixture("approvals/applications.json").then((applications) => {
      cy.intercept("GET", "**/api/v1/institutional-admin-applications*", {
        statusCode: 200,
        body: { data: applications }
      }).as("applications");
      cy.intercept("GET", "**/api/v1/institutional-admin-applications/app-smoke-pending", {
        statusCode: 200,
        body: { data: applications[0] }
      }).as("applicationDetail");
    });
    cy.intercept("POST", "**/api/v1/institutional-admin-applications/app-smoke-pending/approve", {
      statusCode: 200,
      body: {}
    }).as("approveApplication");

    cy.setResultsAdminSession("/aprobaciones");
    cy.wait("@applications");

    cy.contains("Gestión de registros").should("be.visible");
    cy.contains("Ana Smoke").click();
    cy.wait("@applicationDetail");
    cy.contains("Detalle del registro").should("be.visible");
    cy.contains("Universidad Smoke").should("be.visible");

    cy.contains("button", "Aprobar registro").click();
    cy.wait("@approveApplication").its("request.method").should("eq", "POST");
    cy.contains("La solicitud institucional fue aprobada.").should("be.visible");
  });

  it("muestra error visible cuando la carga falla", () => {
    cy.intercept("GET", "**/api/v1/institutional-admin-applications*", {
      statusCode: 500,
      body: { message: "backend no disponible" }
    }).as("applicationsError");

    cy.setResultsAdminSession("/aprobaciones");
    cy.wait("@applicationsError");

    cy.contains("No se pudieron cargar las solicitudes institucionales").should("be.visible");
  });
});
