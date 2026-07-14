const mockPadronConfig = () => {
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke", {
    fixture: "elections/event-draft.json"
  }).as("event");
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/roles", {
    statusCode: 200,
    body: { data: [{ id: "role-1", eventId: "event-smoke", name: "Presidencia", maxWinners: 1 }] }
  }).as("roles");
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/options", {
    statusCode: 200,
    body: { data: [{ id: "option-1", eventId: "event-smoke", name: "Frente Verde", color: "#2E7D32", candidates: [] }] }
  }).as("options");
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/review-readiness", {
    fixture: "elections/review-ready.json"
  }).as("reviewReadiness");
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/padron/summary", {
    fixture: "padron/workflow-summary.json"
  }).as("padronSummary");
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/padron/staging*", {
    fixture: "padron/staging.json"
  }).as("padronStaging");
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/padron/imports/job-smoke", {
    statusCode: 200,
    body: {
      importJobId: "job-smoke",
      status: "PARSED",
      sourceType: "SYSTEM",
      summary: {
        parsedCount: 2,
        stagingCount: 2,
        enabledCount: 2,
        validCount: 2,
        invalidCount: 0,
        duplicateCount: 0,
        disabledCount: 0,
        missingIdentityCount: 0,
        totalCount: 2
      },
      errors: []
    }
  }).as("padronImportStatus");
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/padron/versions", {
    statusCode: 200,
    body: { data: [] }
  }).as("padronVersions");
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/padron/voters*", {
    statusCode: 200,
    body: { voters: [], page: 1, total: 0, totalPages: 0 }
  }).as("padronVoters");
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/padron/voters/summary", {
    statusCode: 200,
    body: { total: 2, enabled: 2, disabled: 0, participated: 0 }
  }).as("padronVotersSummary");
};

describe("[FLOW:PADRON] Smoke de importación y staging", () => {
  beforeEach(() => {
    cy.clearSession();
  });

  it("muestra staging procesado y confirma el padrón con respuesta mock", () => {
    mockPadronConfig();
    cy.intercept("POST", "**/api/v1/voting/events/event-smoke/padron/staging/confirm", {
      statusCode: 200,
      body: {
        importJobId: "job-smoke",
        padronVersionId: "padron-v1",
        totals: { validCount: 2, invalidCount: 0, duplicateCount: 0 },
        comparisonStatus: "OK",
        sourceType: "PDF_IMPORT"
      }
    }).as("confirmPadron");

    cy.setTenantSession("/votacion/elecciones/event-smoke/config/padron");
    cy.wait("@padronSummary");
    cy.contains("Padrón Electoral").should("be.visible");
    cy.contains("1234567").should("be.visible");
    cy.contains("button", "Finalizar configuración", { timeout: 10000 })
      .should("be.visible")
      .and("not.be.disabled")
      .click();
    cy.location("pathname").should("eq", "/votacion/elecciones/event-smoke/config/review");
  });

  it("muestra error visible de carga del padrón", () => {
    mockPadronConfig();
    cy.intercept("GET", "**/api/v1/voting/events/event-smoke/padron/summary", {
      statusCode: 500,
      body: { message: "No se pudo cargar el padrón" }
    }).as("padronSummaryError");

    cy.setTenantSession("/votacion/elecciones/event-smoke/config/padron");
    cy.wait("@padronSummaryError");
    cy.contains("No se pudo cargar el padrón").should("be.visible");
  });
});
