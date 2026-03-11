describe("Flujo Público - Navegación desde Inicio a Resultados", () => {
  it("1. Debe navegar desde el Inicio hasta ver los gráficos de barras sin sesión", () => {
    // 1. Ir a la página de inicio
    cy.visit("/");

    // 2. Scroll hasta el botón "Ver Resultados Detallados"
    cy.contains('a', 'Ver Resultados Detallados')
      .scrollIntoView()
      .should('be.visible')
      .click();

    // 3. Verificar que estamos en la página de resultados
    cy.url().should('include', '/resultados');
    cy.contains('h1', 'Resultados Generales').should('be.visible');

    // 4. Click en el botón de "Barras" (dentro del componente Graphs)
    cy.contains('button', 'Barras')
      .should('be.visible')
      .click();

    cy.log("Flujo público completado con éxito");
  });
});

/**
 * E2E Tests: Reportes de Cliente (PersonalParticipation y AuditAndMatch)
 */

describe("Reportes E2E - Control Personal y Auditoría TSE", () => {
  const PASSWORD = "test1234";
  const LONG_TIMEOUT = 120000;

  const waitForPageReady = () => {
    cy.get("body", { timeout: LONG_TIMEOUT }).should(($body) => {
      const hasSkeleton = $body.find('[data-cy="loading-skeleton"]').length > 0;
      expect(hasSkeleton, "Loading skeleton should be gone").to.be.false;

      const hasTable = $body.find("table").length > 0;
      const hasCards = $body.find(".bg-white, [class*='shadow'], .rounded-lg").length > 2;
      const hasContent = $body.text().length > 200;
      const hasNoData = $body.text().includes("No tienes") || $body.text().includes("sin datos");

      expect(
        hasTable || hasCards || hasContent || hasNoData,
        "Page should have visible content",
      ).to.be.true;
    });
  };

  const assertNoErrors = () => {
    cy.get("body").then(($body) => {
      const text = $body.text();
      expect(text).to.not.match(/crash|cannot read|is not a function/i);
    });
  };

  before(() => {
    cy.seedTestData();
  });

  after(() => {
    cy.cleanupTestData();
  });

  beforeEach(() => {
    cy.clearSession();

    cy.intercept("GET", "**/api/v1/client-reports/my-active-contract*").as("myActiveContract");
    cy.intercept("GET", "**/api/v1/client-reports/executive-summary*").as("executiveSummary");
    cy.intercept("GET", "**/api/v1/client-reports/delegate-activity*").as("delegateActivity");
    cy.intercept("GET", "**/api/v1/contracts/my-elections*").as("myElections");
    cy.intercept("GET", "**/api/v1/auth/profile*").as("profile");
    cy.intercept("GET", "**/api/v1/geographic/departments*").as("departments");
  });

  describe("Control Personal - Alcalde", () => {
    it("Alcalde La Paz puede acceder a /control-personal", () => {
      cy.loginUI2("alcalde.lapaz@test.local", PASSWORD);
      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should("include", "/control-personal");
      waitForPageReady();
      assertNoErrors();
    });

    it("Alcalde ve resumen, abre tabla y navega a acta", () => {
      cy.loginUI2("alcalde.lapaz@test.local", PASSWORD);
      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should("include", "/control-personal");
      cy.get('[data-cy="summary-loaded"]', { timeout: LONG_TIMEOUT }).should("exist");
      cy.get('[data-cy="toggle-table-btn"]').click();
      cy.get('[data-cy="participation-table"]', { timeout: LONG_TIMEOUT }).should("exist");
      cy.get('[data-cy="view-ballots-link"]').first().click();
      cy.location("pathname", { timeout: 15000 }).should("include", "/resultados/mesa/");
    });

    it("Alcalde Cochabamba puede acceder a /control-personal", () => {
      cy.loginUI2("alcalde.cochabamba@test.local", PASSWORD);
      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should("include", "/control-personal");
      waitForPageReady();
      assertNoErrors();
    });
  });

  describe("Control Personal - Gobernador", () => {
    it("Gobernador La Paz puede acceder a /control-personal", () => {
      cy.loginUI2("gobernador.lapaz@test.local", PASSWORD);
      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should("include", "/control-personal");
      waitForPageReady();
      assertNoErrors();
    });

    it("Gobernador ve datos de participación", () => {
      cy.loginUI2("gobernador.lapaz@test.local", PASSWORD);
      cy.visit("/control-personal");
      cy.get('[data-cy="summary-loaded"]', { timeout: LONG_TIMEOUT }).should("exist");
    });
  });

  describe("Auditoría TSE - Alcalde", () => {
    it("Alcalde La Paz puede acceder a /auditoria-tse", () => {
      cy.loginUI2("alcalde.lapaz@test.local", PASSWORD);
      cy.visit("/auditoria-tse");
      cy.location("pathname", { timeout: 15000 }).should("include", "/auditoria-tse");
      waitForPageReady();
    });
  });

  describe("Auditoría TSE - Gobernador", () => {
    it("Gobernador La Paz puede acceder a /auditoria-tse", () => {
      cy.loginUI2("gobernador.lapaz@test.local", PASSWORD);
      cy.visit("/auditoria-tse");
      cy.location("pathname", { timeout: 15000 }).should("include", "/auditoria-tse");
      waitForPageReady();
    });
  });

  describe("Acceso restringido - SUPERADMIN", () => {
    it("SUPERADMIN puede acceder a /control-personal", () => {
      cy.loginUI2("admin@local.test", PASSWORD);
      cy.visit("/control-personal");
      waitForPageReady();
    });
  });

  describe("Sin sesión - Protección de rutas", () => {
    it("Sin sesión, /control-personal redirige a /login", () => {
      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should("eq", "/login");
    });
  });
});
