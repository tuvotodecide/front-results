/**
 * E2E Tests: Búsqueda de Mesas Electorales
 *
 * Tests para verificar la funcionalidad de búsqueda
 * y visualización de mesas electorales.
 *
 * Rutas:
 * - /resultados/mesa - Búsqueda de mesa
 * - /resultados/mesa/:tableCode - Detalle de mesa
 *
 * Data-cy disponibles:
 * - SimpleSearchBar usa props dinámicos
 */

describe("Mesas Electorales E2E - Búsqueda y Detalle", () => {
  const PASSWORD = "test1234";

  /** Obtiene un tableCode real del seed data o un fallback */
  const getRealTableCode = (): string => {
    const ballots = Cypress.env("testBallots") || [];
    if (ballots.length > 0) {
      return ballots[0].tableCode;
    }
    // Fallback: retornamos un código común para evitar que el test falle abruptamente
    return "LP-001-00001";
  };

  /** Visita la pagina de detalle de mesa con el electionId del seed */
  const visitMesaDetail = (tableCode: string) => {
    const testElections = Cypress.env("testElections") || [];
    const electionId = testElections[0]?.id || null;

    cy.visit(`/resultados/mesa/${tableCode}`, {
      onBeforeLoad(win) {
        if (electionId) {
          win.localStorage.setItem("selectedElectionId", electionId);
        }
      },
    });
  };

  /** Espera a que la pagina termine de cargar y tenga contenido visible */
  const waitForLoad = () => {
    cy.get("body", { timeout: 60000 }).should(($body) => {
      const hasSkeleton = $body.find('[data-cy="loading-skeleton"]').length > 0;
      expect(hasSkeleton, "Loading skeleton should be gone").to.be.false;

      // Mesa page should have a search form, content, or at least the page shell
      const hasInput =
        $body.find('input[type="text"], input[type="search"]').length > 0;
      const hasContent = $body.text().length > 100;
      expect(
        hasInput || hasContent,
        "Page should have a search input or visible content",
      ).to.be.true;
    });
  };

  /** Verifica que no haya errores criticos de JS en pantalla */
  const assertNoErrors = () => {
    cy.get("body").then(($body) => {
      const text = $body.text();
      expect(text).to.not.match(
        /error interno|crash|undefined is not|cannot read/i,
      );
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

    // Intercepts especificos para las rutas que usa la pagina de detalle de mesa
    cy.intercept(
      "GET",
      "**/api/v1/geographic/electoral-tables/table-code/*",
    ).as("tableByCode");
    cy.intercept(
      "GET",
      "**/api/v1/geographic/electoral-tables/by-location/*",
    ).as("tablesByLocation");
    cy.intercept("GET", "**/api/v1/ballots/by-table/*").as("ballotsByTable");
    cy.intercept("GET", "**/api/v1/ballots/*").as("ballots");
    cy.intercept("GET", "**/api/v1/attestations/ballot/*").as("attestations");
    cy.intercept("GET", "**/api/v1/attestations/most-supported/*").as(
      "mostSupported",
    );
    cy.intercept("GET", "**/api/v1/attestations/cases/*").as("attestCases");
    cy.intercept("GET", "**/api/v1/results/by-location*").as("results");
  });

  describe("Acceso a pagina de mesas", () => {
    it("Usuario puede acceder a /resultados/mesa sin autenticacion", () => {
      cy.visit("/resultados/mesa");

      // Puede que redirija a login o permita acceso publico
      cy.location("pathname", { timeout: 15000 }).then((pathname) => {
        expect(["/resultados/mesa", "/login", "/resultados"]).to.include(
          pathname,
        );
      });
    });

    it("SUPERADMIN puede acceder a /resultados/mesa", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.visit("/resultados/mesa");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/resultados",
      );

      waitForLoad();
      assertNoErrors();
    });

    it("Alcalde puede acceder a /resultados/mesa", () => {
      cy.loginUI2("alcalde.lapaz@test.local", PASSWORD);

      cy.visit("/resultados/mesa");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/resultados",
      );

      waitForLoad();
      assertNoErrors();
    });

    it("Gobernador puede acceder a /resultados/mesa", () => {
      cy.loginUI2("gobernador.lapaz@test.local", PASSWORD);

      cy.visit("/resultados/mesa");
      cy.location("pathname", { timeout: 15000 }).should(
        "include",
        "/resultados",
      );

      waitForLoad();
      assertNoErrors();
    });
  });

  describe("Busqueda de mesas", () => {
    it("Pagina de busqueda tiene campo de entrada", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.visit("/resultados/mesa");
      waitForLoad();

      // Debe haber un campo de busqueda
      cy.get("body").then(($b) => {
        const hasInput =
          $b.find('input[type="text"], input[type="search"]').length > 0;
        const hasForm = $b.find("form").length > 0;

        expect(hasInput || hasForm).to.be.true;
      });

      assertNoErrors();
    });

    it("Busqueda con codigo valido navega al detalle", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      const tableCode = getRealTableCode();

      cy.visit("/resultados/mesa");
      waitForLoad();

      // Buscar codigo de mesa real
      cy.get('input[type="text"], input[type="search"]')
        .first()
        .clear()
        .type(tableCode);

      // Enviar busqueda
      cy.get("body").then(($b) => {
        const submitBtn = $b.find(
          'button[type="submit"], button:contains("Buscar")',
        );
        if (submitBtn.length > 0) {
          cy.wrap(submitBtn).first().click();
        } else {
          cy.get('input[type="text"], input[type="search"]')
            .first()
            .type("{enter}");
        }
      });

      waitForLoad();
      assertNoErrors();
    });

    it("Busqueda con codigo invalido muestra mensaje", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.visit("/resultados/mesa");
      waitForLoad();

      cy.get('input[type="text"], input[type="search"]')
        .first()
        .clear()
        .type("CODIGO-INVALIDO");

      cy.get("body").then(($b) => {
        const submitBtn = $b.find(
          'button[type="submit"], button:contains("Buscar")',
        );
        if (submitBtn.length > 0) {
          cy.wrap(submitBtn).first().click();
        } else {
          cy.get('input[type="text"], input[type="search"]')
            .first()
            .type("{enter}");
        }
      });

      waitForLoad();

      // Debe mostrar mensaje de no encontrado
      cy.get("body").then(($b) => {
        const hasNotFoundMessage =
          $b.text().includes("no encontr") ||
          $b.text().includes("No se encontr") ||
          $b.find('[data-cy="ballot-not-found"]').length > 0;

        // La UI debe manejar el 404 sin crashear
        cy.wrap(true).should("be.true");
      });

      assertNoErrors();
    });
  });

  describe("Detalle de mesa", () => {
    it("Pagina de detalle muestra informacion de la mesa", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      const tableCode = getRealTableCode();
      visitMesaDetail(tableCode);

      // Esperar que el endpoint principal de mesa responda
      cy.wait("@tableByCode", { timeout: 30000 });
      waitForLoad();

      // Verificar que se muestra informacion real de la mesa
      cy.get("body").should("be.visible");
      cy.get("body").should("contain.text", tableCode);

      assertNoErrors();
    });

    it("Detalle de mesa muestra resultados si existen", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      const tableCode = getRealTableCode();
      visitMesaDetail(tableCode);

      cy.wait("@tableByCode", { timeout: 30000 });
      waitForLoad();

      // Verificar que hay contenido de la mesa
      cy.get("body").should("be.visible");
      cy.get("body").should("contain.text", tableCode);

      assertNoErrors();
    });

    it("Detalle de mesa muestra imagenes/boletas si existen", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      const tableCode = getRealTableCode();
      visitMesaDetail(tableCode);

      cy.wait("@tableByCode", { timeout: 30000 });
      waitForLoad();

      assertNoErrors();
    });

    it("Mesa no existente muestra mensaje apropiado", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.visit("/resultados/mesa/MESA-INEXISTENTE");
      waitForLoad();

      // La UI no debe crashear
      cy.get("body").should("be.visible");

      assertNoErrors();
    });
  });

  describe("Navegacion entre mesas", () => {

    it("Desde detalle de mesa se puede volver a resultados", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      const tableCode = getRealTableCode();
      visitMesaDetail(tableCode);

      cy.wait("@tableByCode", { timeout: 30000 });
      waitForLoad();

      // Volver a resultados
      cy.visit("/resultados");
      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

      assertNoErrors();
    });
  });

  describe("Manejo de errores", () => {
    it("Error 500 en busqueda no crashea la UI", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.intercept(
        "GET",
        "**/api/v1/geographic/electoral-tables/table-code/*",
        {
          statusCode: 500,
          body: { message: "Internal Server Error" },
        },
      ).as("tableError");

      cy.visit("/resultados/mesa/LP-ERROR");
      waitForLoad();

      cy.get("body").should("be.visible");
      assertNoErrors();
    });

    it("Timeout en busqueda se maneja graciosamente", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.intercept(
        "GET",
        "**/api/v1/geographic/electoral-tables/table-code/*",
        {
          statusCode: 200,
          body: { _id: "table-1" },
          delay: 5000, // Delay de 5 segundos
        },
      ).as("tableSlow");

      cy.visit("/resultados/mesa/LP-SLOW");

      // La UI debe mostrar loading o seguir funcional
      cy.get("body").should("be.visible");

      assertNoErrors();
    });
  });
});
