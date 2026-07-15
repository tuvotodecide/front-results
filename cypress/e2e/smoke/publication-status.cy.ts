const mockPublicationConfig = (readinessFixture: string) => {
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke", {
    fixture: "elections/event-ready.json"
  }).as("event");
  cy.intercept("GET", "**/api/v1/voting/events?tenantId=*", {
    fixture: "elections/events-list.json"
  }).as("tenantEvents");
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/roles", {
    statusCode: 200,
    body: { data: [{ id: "role-1", eventId: "event-smoke", name: "Presidencia", maxWinners: 1 }] }
  }).as("roles");
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/options", {
    statusCode: 200,
    body: { data: [{ id: "option-1", eventId: "event-smoke", name: "Frente Verde", color: "#2E7D32", candidates: [{ name: "Ana Perez", roleName: "Presidencia" }] }] }
  }).as("options");
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
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/padron/voters*", {
    statusCode: 200,
    body: { voters: [], page: 1, total: 0, totalPages: 0 }
  }).as("padronVoters");
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/padron/voters/summary", {
    statusCode: 200,
    body: { total: 2, enabled: 2, disabled: 0, participated: 0 }
  }).as("padronVotersSummary");
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/padron/versions", {
    statusCode: 200,
    body: { data: [] }
  }).as("padronVersions");
  cy.intercept("GET", "**/api/v1/voting/events/event-smoke/review-readiness", {
    fixture: readinessFixture
  }).as("reviewReadiness");
};

describe("[FLOW:PUBLICATION] Smoke de revisión, publicación y estado activo", () => {
  beforeEach(() => {
    cy.clearSession();
  });

  it("muestra readiness bloqueado en revisión", () => {
    mockPublicationConfig("elections/review-blocked.json");

    cy.setTenantSession("/votacion/elecciones/event-smoke/config/review");
    cy.wait("@reviewReadiness");
    cy.contains("Así verán los votantes las papeletas", { timeout: 10000 }).should("be.visible");
    cy.contains(/pendiente|bloque|padrón|configuración/i).should("be.visible");
  });

  it("publica con confirmación mock y navega al estado activo", () => {
    mockPublicationConfig("elections/review-ready.json");
    cy.intercept("POST", "**/api/v1/voting/events/event-smoke/official-publication/confirm", {
      statusCode: 200,
      body: {
        id: "event-smoke",
        state: "RESULTS_PUBLISHED",
        officialPublishedAt: "2026-07-14T12:00:00.000Z",
        publicationConfirmed: true,
        publicPath: "/votacion/elecciones/event-smoke/publica"
      }
    }).as("confirmPublication");
    cy.intercept("GET", "**/api/v1/voting/events/event-smoke/results", {
      statusCode: 200,
      body: { data: { options: [{ name: "Frente Verde", votes: 120 }], totalVotes: 120 } }
    }).as("eventResults");
    cy.intercept("GET", "**/api/v1/voting/events/event-smoke/participation-analytics", {
      statusCode: 200,
      body: {
        votingId: "event-smoke",
        votingName: "Elección Smoke 2027",
        status: "RESULTS_PUBLISHED",
        totalEnabled: 2,
        totalParticipated: 1,
        totalPending: 1,
        participationPercentage: 50
      }
    }).as("participationAnalytics");

    cy.setTenantSession("/votacion/elecciones/event-smoke/config/review");
    cy.wait("@reviewReadiness");
    cy.contains("Así verán los votantes las papeletas", { timeout: 10000 }).should("be.visible");
    cy.contains("button", "Confirmar publicación oficial").scrollIntoView().click();
    cy.contains("Confirmar publicación oficial").should("be.visible");
    cy.contains("button", "Publicar oficialmente").click();
    cy.wait("@confirmPublication");

    cy.contains("Publicación oficial confirmada").should("be.visible");
    cy.setTenantSession("/votacion/elecciones/event-smoke/status");
    cy.contains("Elección Smoke 2027").should("be.visible");
    cy.contains("Resultados").click();
    cy.contains("Frente Verde").should("be.visible");
  });
});
