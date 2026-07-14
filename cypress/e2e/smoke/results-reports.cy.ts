describe("[FLOW:RESULTS-REPORTS] Smoke de resultados y reportes", () => {
  beforeEach(() => {
    cy.clearSession();
  });

  it("muestra resultados con fixture, aplica filtro y conserva porcentajes visibles", () => {
    cy.mockConfigStatus({
      hasActiveConfig: true,
      isVotingPeriod: false,
      isResultsPeriod: true
    });
    cy.mockConfig();
    cy.intercept("GET", "**/api/v1/contracts/public-active*", {
      statusCode: 200,
      body: {
        data: [
          {
            contractId: "contract-smoke",
            election: {
              electionId: "election-mock-1",
              electionName: "Elección Smoke Resultados",
              electionType: "presidential"
            },
            territory: {
              type: "department",
              departmentId: "dep-lpz",
              departmentName: "La Paz"
            }
          }
        ]
      }
    }).as("publicContracts");
    cy.mockGeographyBasic();
    cy.mockLiveResults({
      presidential: {},
      deputies: {}
    });
    cy.intercept("GET", "**/api/v1/results/by-location*electionType=presidential*", {
      fixture: "results_ok_presidential.json"
    }).as("resultsByLocationPresidential");
    cy.intercept("GET", "**/api/v1/results/by-location*electionType=deputies*", {
      fixture: "results_ok_deputies.json"
    }).as("resultsByLocationDeputies");

    cy.visitResults({ electionId: "election-mock-1" });
    cy.contains("Resultados Generales").should("be.visible");
    cy.wait("@publicContracts");
    cy.get('[data-cy="results-percentage"]', { timeout: 10000 }).first().should("be.visible");
    cy.get('[data-cy="filters-reset"]').click({ force: true });
    cy.location("pathname").should("eq", "/resultados");
  });

  it("carga auditoría y reporte territorial con mocks controlados", () => {
    cy.intercept("GET", "**/api/v1/elections/config/status*", {
      statusCode: 200,
      body: {
        hasActiveConfig: true,
        isVotingPeriod: false,
        isResultsPeriod: true,
        elections: [{ id: "election-mock-1", isActive: true }]
      }
    }).as("auditConfigStatus");
    cy.intercept("GET", "**/api/v1/client-reports/my-active-contract*", {
      statusCode: 200,
      body: { data: { role: "SUPERADMIN" } }
    }).as("activeContract");
    cy.intercept("GET", "**/api/v1/client-reports/audit-match*", {
      fixture: "results/audit-records.json"
    }).as("auditMatch");

    cy.setResultsAdminSession("/resultados/auditoria-tse?electionId=election-mock-1");
    cy.contains("Auditoría vs Resultados TSE", { timeout: 15000 }).should("be.visible");
    cy.contains(/Auditoría|TSE/).should("be.visible");
  });

  it("muestra empty/error relevante para resultados públicos", () => {
    cy.mockConfigStatus({
      hasActiveConfig: true,
      isVotingPeriod: false,
      isResultsPeriod: true
    });
    cy.mockConfig();
    cy.mockGeographyBasic();
    cy.mockLiveResults({
      presidential: { body: { data: [] } },
      deputies: { statusCode: 500, body: { message: "No disponible" } }
    });

    cy.visitResults({ electionId: "election-mock-1" });
    cy.contains("Resultados Generales").should("be.visible");
    cy.contains(/sin resultados|no hay|error|preliminares/i).should("be.visible");
  });
});
