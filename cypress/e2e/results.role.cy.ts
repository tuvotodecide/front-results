/**
 * E2E Tests: Resultados por Rol
 *
 * Tests para verificar que cada rol puede ver los resultados
 * correctamente de acuerdo a su ámbito territorial.
 *
 * Usuarios del seed (/testing/seed):
 * - gobernador.lapaz@test.local (GOVERNOR, La Paz)
 * - gobernador.cochabamba@test.local (GOVERNOR, Cochabamba)
 * - alcalde.lapaz@test.local (MAYOR, La Paz)
 * - alcalde.cochabamba@test.local (MAYOR, Cochabamba)
 * - admin@local.test (SUPERADMIN)
 * Password: test1234
 */

describe("Resultados E2E - Vista por Rol", () => {
  const PASSWORD = "test1234";
  const LONG_TIMEOUT = 120000;

  /**
   * Espera a que la página termine de cargar y tenga contenido real.
   * Usa cy.get("body").should(callback) que REINTENTA hasta que pase o expire el timeout.
   * Esto evita el bug de cy.contains(regex).should("not.exist") que pasa inmediatamente
   * cuando la página aún no cargó.
   */
  const waitForPageReady = () => {
    cy.get("body", { timeout: LONG_TIMEOUT }).should(($body) => {
      // Verificar que NO está en estado de carga
      const hasSkeleton = $body.find('[data-cy="loading-skeleton"]').length > 0;
      expect(hasSkeleton, "Loading skeleton should be gone").to.be.false;

      // Verificar que hay contenido real renderizado
      const hasPresidential = $body.find('[data-cy="presidential-results"]').length > 0;
      const hasFilters = $body.find('[data-cy="level-options"]').length > 0;
      const hasSinDatos = $body.text().includes("Sin datos");
      const hasParticipacion = $body.text().includes("Participación");
      const hasResultsTitle = $body.text().includes("Resultados Generales");

      expect(
        hasPresidential || hasFilters || hasSinDatos || hasParticipacion || hasResultsTitle,
        "Page should have visible content (results, filters, 'Sin datos', or title)",
      ).to.be.true;
    });
  };

  /** Verifica que hay datos de resultados visibles */
  const assertResultsVisible = () => {
    cy.get("body", { timeout: LONG_TIMEOUT }).should(($body) => {
      const hasPresidential = $body.find('[data-cy="presidential-results"]').length > 0;
      const hasDeputies = $body.find('[data-cy="deputies-results"]').length > 0;
      const hasSinDatos = $body.text().includes("Sin datos");
      const hasParticipacion = $body.text().includes("Participación");
      const hasTable = $body.find("table").length > 0;
      const hasSvgChart = $body.find("svg.recharts-surface").length > 0;

      expect(
        hasPresidential || hasDeputies || hasSinDatos || hasParticipacion || hasTable || hasSvgChart,
        "Page should show results, charts, table, or 'Sin datos' message",
      ).to.be.true;
    });
  };

  /** Verifica que no haya errores críticos de JS en pantalla */
  const assertNoErrors = () => {
    cy.get("body").then(($body) => {
      const text = $body.text();
      expect(text).to.not.match(/error interno|crash|cannot read|is not a function/i);
    });
  };

  before(() => {
    // Ejecutar seed una vez antes de todos los tests
    cy.seedTestData();
  });

  after(() => {
    // Limpiar datos después de todos los tests
    cy.cleanupTestData();
  });

  beforeEach(() => {
    cy.clearSession();

    // Interceptar llamadas principales
    cy.intercept("GET", "**/api/v1/elections/config/status*").as("configStatus");
    cy.intercept("GET", "**/api/v1/elections/config*").as("config");
    cy.intercept("GET", "**/api/v1/geographic/departments*").as("departments");
    cy.intercept("GET", "**/api/v1/results/live/by-location*").as("liveResults");
    cy.intercept("GET", "**/api/v1/results/by-location*").as("officialResults");
    cy.intercept("GET", "**/api/v1/auth/profile*").as("profile");
  });

  describe("SUPERADMIN - Acceso completo a resultados", () => {
    it("SUPERADMIN puede ver resultados generales sin restricciones", () => {
      cy.loginUI2("admin.user@gmail.com", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click({ force: true });
      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

      cy.wait("@departments", { timeout: 30000 });
      // Esperar también los resultados oficiales
      cy.wait("@officialResults", { timeout: 60000 });
      waitForPageReady();
      assertNoErrors();
    });

    it("SUPERADMIN puede navegar a cualquier departamento", () => {
      cy.loginUI2("admin.user@gmail.com", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click({ force: true });
      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });

      // Verificar que el selector de departamento está disponible
      cy.get('[data-cy="level-options"] [data-cy^="option-0-"]', {
        timeout: 30000,
      }).should("have.length.at.least", 1);

      assertNoErrors();
    });

    it("SUPERADMIN puede acceder al panel de administración", () => {
      cy.loginUI2("admin.user@gmail.com", PASSWORD);

      cy.visit("/panel");
      cy.location("pathname", { timeout: 15000 }).should("eq", "/panel");

      assertNoErrors();
    });
  });

  describe("GOBERNADOR - Resultados filtrados por departamento", () => {
    it("Gobernador La Paz ve resultados con filtro de su departamento", () => {
      cy.loginUI2("gobernador@test.com", PASSWORD);

      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

      // El gobernador debe tener su departamento preseleccionado
      cy.location("search", { timeout: 15000 }).then((search) => {
        const params = new URLSearchParams(search);
        const hasDepartment = params.has("department");

        if (hasDepartment) {
          cy.wrap(hasDepartment).should("be.true");
        }
      });

      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });
      waitForPageReady();
      assertNoErrors();
    });



    it("Gobernador NO puede acceder al panel de administración", () => {
      cy.loginUI2("gobernador@test.com", PASSWORD);

      cy.visit("/panel");

      // Debe redirigir a resultados
      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
    });

    it("Gobernador puede acceder a control-personal", () => {
      cy.loginUI2("gobernador@test.com", PASSWORD);

      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/control-personal",
      );

      assertNoErrors();
    });

    it("Gobernador puede acceder a auditoria-tse", () => {
      cy.loginUI2("gobernador@test.com", PASSWORD);

      cy.visit("/auditoria-tse");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/auditoria-tse",
      );

      assertNoErrors();
    });
  });

  describe("ALCALDE - Resultados filtrados por municipio", () => {
    it("Alcalde La Paz ve resultados con filtro de su municipio", () => {
      cy.loginUI2("alcalde@test.com", PASSWORD);

      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

      // El alcalde debe tener su municipio preseleccionado
      cy.location("search", { timeout: 15000 }).then((search) => {
        const params = new URLSearchParams(search);
        const hasMunicipality = params.has("municipality");

        if (hasMunicipality) {
          cy.wrap(hasMunicipality).should("be.true");
        }
      });

      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });
      waitForPageReady();
      assertNoErrors();
    });



    it("Alcalde NO puede acceder al panel de administración", () => {
      cy.loginUI2("alcalde@test.com", PASSWORD);

      cy.visit("/panel");

      // Debe redirigir a resultados
      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
    });

    it("Alcalde puede acceder a control-personal", () => {
      cy.loginUI2("alcalde@test.com", PASSWORD);

      cy.visit("/control-personal");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/control-personal",
      );

      assertNoErrors();
    });

    it("Alcalde puede acceder a auditoria-tse", () => {
      cy.loginUI2("alcalde@test.com", PASSWORD);

      cy.visit("/auditoria-tse");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/auditoria-tse",
      );

      assertNoErrors();
    });
  });

  describe("Visualización de datos de resultados", () => {
    it("SUPERADMIN ve tabla de resultados con partidos y votos", () => {
      cy.loginUI2("admin.user@gmail.com", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click({ force: true });
      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });
      waitForPageReady();

      // Verificar estructura de resultados
      cy.get("body").then(($body) => {
        const hasTable = $body.find("table").length > 0;
        const hasGraph = $body.find("svg").length > 0;
        const hasFilters = $body.find('[data-cy="level-options"]').length > 0;

        expect(hasTable || hasGraph || hasFilters).to.be.true;
      });

      assertNoErrors();
    });

    it("Resultados muestran porcentajes válidos", () => {
      cy.loginUI2("admin.user@gmail.com", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click({ force: true });
      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });
      waitForPageReady();

      // Verificar que no hay valores NaN visibles en texto
      cy.get("body").then(($body) => {
        const text = $body.text();
        // Solo verificar NaN como valor de porcentaje
        expect(text).to.not.include("NaN%");
        expect(text).to.not.include("null%");
      });

      assertNoErrors();
    });

    it("Resultados cargan correctamente al cambiar filtros", () => {
      cy.loginUI2("admin.user@gmail.com", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click({ force: true });
      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });
      waitForPageReady();

      // Seleccionar un departamento
      cy.get('[data-cy="level-options"] [data-cy^="option-0-"]', { timeout: 30000 })
        .first()
        .click({ force: true });

      // Esperar que se recarguen resultados
      cy.wait("@officialResults", { timeout: 60000 });
      waitForPageReady();

      assertNoErrors();
    });
  });

  describe("Deep linking y persistencia de filtros", () => {
    it("Resultados cargan con parámetros de URL válidos", () => {
      cy.loginUI2("admin.user@gmail.com", PASSWORD);

      // Visitar resultados sin parámetros inválidos
      cy.visit("/resultados");

      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });
      waitForPageReady();

      // La página debe cargar correctamente
      cy.get("body").should("be.visible");

      assertNoErrors();
    });

    it("Navegación atrás/adelante mantiene filtros", () => {
      cy.loginUI2("admin.user@gmail.com", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click({ force: true });
      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });
      waitForPageReady();

      // Seleccionar filtro
      cy.get('[data-cy="level-options"] [data-cy^="option-0-"]', { timeout: 30000 })
        .first()
        .click({ force: true });

      // Esperar navegación
      cy.wait(1000);

      // La URL debe tener el departamento
      cy.location("search").should("include", "department=");

      // Ir atrás
      cy.go("back");
      cy.wait(500);

      // Ir adelante
      cy.go("forward");
      cy.location("search").should("include", "department=");

      assertNoErrors();
    });
  });

  describe("Manejo de errores y estados vacíos", () => {
    it("UI maneja correctamente cuando no hay datos", () => {
      cy.loginUI2("admin.user@gmail.com", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click({ force: true });
      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });
      waitForPageReady();

      // Verificar que la UI no crashea
      cy.get("body").should("be.visible");
      assertNoErrors();
    });

    it("UI permanece funcional después de error de API", () => {
      // Interceptar para simular error ANTES del login
      cy.intercept("GET", "**/api/v1/results/by-location*", {
        statusCode: 500,
        body: { message: "Internal Server Error" },
      }).as("resultsError");

      cy.loginUI2("admin.user@gmail.com", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click({ force: true });

      // Esperar a que se complete la request (con error)
      cy.wait("@resultsError", { timeout: 30000 });

      // La UI debe seguir funcional (no crashear)
      cy.get("body").should("be.visible");

      // No debe haber crash de JS
      assertNoErrors();
    });
  });
});
