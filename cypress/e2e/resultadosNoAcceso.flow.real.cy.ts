describe("Resultados - Flujo E2E (seed real)", () => {
  const getElectionIdByName = (needle: string) => {
    const elections = Cypress.env("testElections") ?? [];
    const match = elections.find((e: any) =>
      String(e?.name || "").includes(needle),
    );
    return match?.id ?? null;
  };

  const visitResultadosWithElection = (nameHint: string) => {
    const electionId = getElectionIdByName(nameHint);
    const token = Cypress.env("authToken");
    const user = Cypress.env("authUser");
    cy.visit("/resultados", {
      onBeforeLoad(win) {
        if (electionId) {
          win.localStorage.setItem("selectedElectionId", electionId);
        }
        if (token) {
          win.localStorage.setItem("token", token);
          win.localStorage.setItem("accessToken", token);
        }
        if (user) {
          win.localStorage.setItem("user", JSON.stringify(user));
        }
      },
    });
  };

  const assertResultsLoaded = () => {
    cy.get('[data-cy="statsbars"]', { timeout: 20000 }).should("exist");
    cy.get('[data-cy="total-votes"]', { timeout: 20000 })
      .should("exist")
      .and("not.have.text", "");
  };

  before(() => {
    cy.seedTestData();
  });

  after(() => {
    cy.cleanupTestData();
  });

  beforeEach(() => {
    cy.clearSession();
    cy.intercept("GET", "**/api/v1/geographic/departments*").as("departments");
    cy.intercept("GET", "**/api/v1/results/by-location*").as("officialResults");
    cy.intercept("GET", "**/api/v1/elections/config*").as("config");
  });

  it("Gobernador ve resultados departamentales", () => {
    cy.loginUI("gobernador@test.com", "test1234");

    cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
    cy.wait("@departments", { timeout: 30000 });

    // Si visitResultadosWithElection se usa para forzar una elección, aseguramos que cargue
    visitResultadosWithElection("Gobernadores");

    cy.wait("@officialResults", { timeout: 30000 });
    assertResultsLoaded();
  });

  it("Alcalde ve resultados municipales", () => {
    cy.loginUI("alcalde@test.com", "test1234");

    cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
    cy.wait("@departments", { timeout: 30000 });

    visitResultadosWithElection("Alcaldes");

    cy.wait("@officialResults", { timeout: 30000 });
    assertResultsLoaded();
  });
});
