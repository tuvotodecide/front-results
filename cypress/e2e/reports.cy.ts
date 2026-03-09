/**
 * E2E Tests: Reportes de Cliente (PersonalParticipation y AuditAndMatch)
 *
 * Tests para verificar que MAYOR y GOVERNOR pueden ver sus reportes
 * de participación de delegados y auditoría vs TSE.
 *
 * Usuarios del seed (/testing/seed):
 * - gobernador.lapaz@test.local (GOVERNOR, La Paz)
 * - gobernador.cochabamba@test.local (GOVERNOR, Cochabamba)
 * - alcalde.lapaz@test.local (MAYOR, La Paz)
 * - alcalde.cochabamba@test.local (MAYOR, Cochabamba)
 * - admin@local.test (SUPERADMIN)
 * Password: test1234
 *
 * Data-cy disponibles para reportes:
 * - participation-table: tabla de participación de delegados
 * - view-ballots-link: link para ver boletas
 */

describe("Reportes E2E - Control Personal y Auditoría TSE", () => {
  const PASSWORD = "test1234";
  const LONG_TIMEOUT = 120000;

  /**
   * Espera a que la página termine de cargar y tenga contenido real.
   * Reintenta automáticamente hasta que loading desaparezca Y haya contenido.
   */
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
        "Page should have visible content (table, cards, text, or 'no data' message)",
      ).to.be.true;
    });
  };

  /** Verifica que no haya errores críticos de JS en pantalla */
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

    // Interceptar llamadas de reportes
    cy.intercept("GET", "**/api/v1/client-reports/my-active-contract*").as(
      "myActiveContract",
    );
    cy.intercept("GET", "**/api/v1/client-reports/executive-summary*").as(
      "executiveSummary",
    );
    cy.intercept("GET", "**/api/v1/client-reports/delegate-activity*").as(
      "delegateActivity",
    );
    cy.intercept("GET", "**/api/v1/contracts/my-elections*").as("myElections");
    cy.intercept("GET", "**/api/v1/auth/profile*").as("profile");
    cy.intercept("GET", "**/api/v1/geographic/departments*").as("departments");
  });

  describe("Control Personal - Alcalde", () => {
    it("Alcalde La Paz puede acceder a /control-personal", () => {
      cy.loginUI2("alcalde.lapaz@test.local", PASSWORD);

      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/control-personal",
      );

      waitForPageReady();
      assertNoErrors();
    });

    it("Alcalde ve resumen, abre tabla y navega a acta", () => {
      cy.loginUI2("alcalde.lapaz@test.local", PASSWORD);

      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/control-personal",
      );

      cy.get('[data-cy="summary-loaded"]', { timeout: LONG_TIMEOUT }).should(
        "exist",
      );

      cy.get('[data-cy="summary-loaded"]').should("contain.text", "participaron");

      assertNoErrors();

 
      cy.get('[data-cy="toggle-table-btn"]').click();

      cy.get('[data-cy="participation-table"]', { timeout: LONG_TIMEOUT }).should(
        "exist",
      );
      cy.get('[data-cy="participation-table"] tbody tr').should("have.length.greaterThan", 0);

 
      cy.get('[data-cy="view-ballots-link"]').should("have.length.greaterThan", 0);


      cy.get('[data-cy="view-ballots-link"]').first().click();

      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/resultados/mesa/",
      );

      assertNoErrors();
    });

    it("Alcalde Cochabamba puede acceder a /control-personal", () => {
      cy.loginUI2("alcalde.cochabamba@test.local", PASSWORD);

      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/control-personal",
      );

      waitForPageReady();
      assertNoErrors();
    });

    it("Alcalde puede ver links de boletas si existen", () => {
      cy.loginUI2("alcalde.lapaz@test.local", PASSWORD);

      cy.visit("/control-personal");

      // Esperar a que el resumen cargue
      cy.get('[data-cy="summary-loaded"]', { timeout: LONG_TIMEOUT }).should(
        "exist",
      );

      // Hacer click en "Ver reporte por mesa" para mostrar la tabla
      cy.get('[data-cy="toggle-table-btn"]').click();

      // Esperar a que la tabla se renderice
      cy.get('[data-cy="participation-table"]', { timeout: LONG_TIMEOUT }).should(
        "exist",
      );

      // Si hay links de boletas, deben ser clickeables
      cy.get("body").then(($body) => {
        if ($body.find('[data-cy="view-ballots-link"]').length > 0) {
          cy.get('[data-cy="view-ballots-link"]')
            .first()
            .should("have.attr", "href");
        }
      });

      assertNoErrors();
    });
  });

  describe("Control Personal - Gobernador", () => {
    it("Gobernador La Paz puede acceder a /control-personal", () => {
      cy.loginUI2("gobernador.lapaz@test.local", PASSWORD);

      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/control-personal",
      );

      waitForPageReady();
      assertNoErrors();
    });

    it("Gobernador ve datos de participación de delegados", () => {
      cy.loginUI2("gobernador.lapaz@test.local", PASSWORD);

      cy.visit("/control-personal");

      // Esperar a que el resumen ejecutivo se renderice en el DOM
      cy.get('[data-cy="summary-loaded"]', { timeout: LONG_TIMEOUT }).should(
        "exist",
      );

      // Verificar que el resumen tiene datos de participación
      cy.get('[data-cy="summary-loaded"]').should("contain.text", "participaron");

      assertNoErrors();
    });

    it("Gobernador Cochabamba puede acceder a /control-personal", () => {
      cy.loginUI2("gobernador.cochabamba@test.local", PASSWORD);

      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/control-personal",
      );

      waitForPageReady();
      assertNoErrors();
    });
  });

  describe("Auditoría TSE - Alcalde", () => {
    it("Alcalde La Paz puede acceder a /auditoria-tse", () => {
      cy.loginUI2("alcalde.lapaz@test.local", PASSWORD);

      cy.visit("/auditoria-tse");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/auditoria-tse",
      );

      waitForPageReady();
      assertNoErrors();
    });

    it("Alcalde Cochabamba puede acceder a /auditoria-tse", () => {
      cy.loginUI2("alcalde.cochabamba@test.local", PASSWORD);

      cy.visit("/auditoria-tse");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/auditoria-tse",
      );

      waitForPageReady();
      assertNoErrors();
    });
  });

  describe("Auditoría TSE - Gobernador", () => {
    it("Gobernador La Paz puede acceder a /auditoria-tse", () => {
      cy.loginUI2("gobernador.lapaz@test.local", PASSWORD);

      cy.visit("/auditoria-tse");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/auditoria-tse",
      );

      waitForPageReady();
      assertNoErrors();
    });

    it("Gobernador ve datos de auditoría", () => {
      cy.loginUI2("gobernador.lapaz@test.local", PASSWORD);

      cy.visit("/auditoria-tse");
      cy.wait("@myActiveContract", { timeout: LONG_TIMEOUT });
      waitForPageReady();

      // Verificar estructura de auditoría
      cy.get("body").then(($body) => {
        const hasTable = $body.find("table").length > 0;
        const hasContent = $body.text().length > 100;

        expect(hasTable || hasContent).to.be.true;
      });

      assertNoErrors();
    });

    it("Gobernador Cochabamba puede acceder a /auditoria-tse", () => {
      cy.loginUI2("gobernador.cochabamba@test.local", PASSWORD);

      cy.visit("/auditoria-tse");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/auditoria-tse",
      );

      waitForPageReady();
      assertNoErrors();
    });
  });

  describe("Acceso restringido - SUPERADMIN", () => {
    it("SUPERADMIN puede acceder a /control-personal", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.visit("/control-personal");

      // SUPERADMIN puede acceder a todo, pero puede no tener contrato
      cy.location("pathname", { timeout: 15000 }).then((pathname) => {
        // Puede quedarse en control-personal o redirigir a resultados
        expect(["/control-personal", "/resultados"]).to.include(pathname);
      });

      waitForPageReady();
      assertNoErrors();
    });

    it("SUPERADMIN puede acceder a /auditoria-tse", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.visit("/auditoria-tse");

      cy.location("pathname", { timeout: 15000 }).then((pathname) => {
        expect(["/auditoria-tse", "/resultados"]).to.include(pathname);
      });

      waitForPageReady();
      assertNoErrors();
    });
  });

  describe("Sin sesión - Protección de rutas", () => {
    it("Sin sesión, /control-personal redirige a /login", () => {
      cy.visit("/control-personal");

      cy.location("pathname", { timeout: 15000 }).should("eq", "/login");
    });

    it("Sin sesión, /auditoria-tse redirige a /login", () => {
      cy.visit("/auditoria-tse");

      cy.location("pathname", { timeout: 15000 }).should("eq", "/login");
    });
  });

  describe("Navegación entre reportes", () => {
    it("Alcalde puede navegar de resultados a control-personal", () => {
      cy.loginUI2("alcalde.lapaz@test.local", PASSWORD);

      // Empezar en resultados
      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

      // Navegar a control-personal
      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/control-personal",
      );

      waitForPageReady();
      assertNoErrors();
    });

    it("Gobernador puede navegar de control-personal a auditoria-tse", () => {
      cy.loginUI2("gobernador.lapaz@test.local", PASSWORD);

      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/control-personal",
      );
      waitForPageReady();

      // Navegar a auditoría
      cy.visit("/auditoria-tse");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/auditoria-tse",
      );

      waitForPageReady();
      assertNoErrors();
    });

    it("Persistencia de sesión entre páginas de reportes", () => {
      cy.loginUI2("alcalde.lapaz@test.local", PASSWORD);

      // Ir a control-personal
      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/control-personal",
      );

      // Ir a auditoría
      cy.visit("/auditoria-tse");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/auditoria-tse",
      );

      // Ir a resultados
      cy.visit("/resultados");
      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

      // No debe haber perdido sesión
      cy.location("pathname").should("not.eq", "/login");

      assertNoErrors();
    });
  });
});
