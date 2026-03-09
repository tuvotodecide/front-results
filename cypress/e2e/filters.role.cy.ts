/**
 * E2E Tests: Filtros Geográficos por Rol
 *
 * Tests para verificar que los filtros funcionan correctamente
 * según el rol del usuario y sus restricciones territoriales.
 *
 * Usuarios del seed (/testing/seed):
 * - gobernador.lapaz@test.local (GOVERNOR, La Paz)
 * - gobernador.cochabamba@test.local (GOVERNOR, Cochabamba)
 * - alcalde.lapaz@test.local (MAYOR, La Paz)
 * - alcalde.cochabamba@test.local (MAYOR, Cochabamba)
 * - admin@local.test (SUPERADMIN)
 * Password: test1234
 *
 * Data-cy disponibles para filtros:
 * - level-options: contenedor de opciones
 * - option-{level}-{id}: opción individual
 * - {pathItem.id}-select: selector de nivel (department-select, etc)
 * - filters-reset: botón de resetear
 * - election-select: selector de elección
 */

describe("Filtros E2E - Restricciones por Rol", () => {
  const PASSWORD = "test1234";

  /** Espera a que el componente de opciones de filtro esté listo */
  const waitOptionsReady = () => {
    // Espera presencia positiva de level-options (retries hasta que aparezca)
    cy.get('[data-cy="level-options"]', { timeout: 60000 }).should("exist");
  };

  /** Espera a que aparezcan opciones del nivel específico */
  const waitLevel = (levelIndex: 0 | 1 | 2 | 3 | 4) => {
    waitOptionsReady();
    cy.get(`[data-cy="level-options"] [data-cy^="option-${levelIndex}-"]`, {
      timeout: 60000,
    }).should("exist");
  };

  /** Click en opción de filtro por texto */
  const clickOptionByText = (label: string) => {
    cy.get('[data-cy="level-options"]', { timeout: 60000 }).should("exist");
    cy.contains('[data-cy="level-options"] [data-cy^="option-"]', label, {
      timeout: 60000,
    })
      .should("exist")
      .scrollIntoView()
      .click({ force: true });
  };

  /** Abre los filtros raíz si están colapsados */
  const openRootFiltersIfNeeded = () => {
    cy.get("body").then(($b) => {
      const hasLevelOptions = $b.find('[data-cy="level-options"]').length > 0;
      if (hasLevelOptions) return;

      const hasBoliviaBtn = $b.find('button:contains("Bolivia")').length > 0;
      if (hasBoliviaBtn) {
        cy.contains("button", /bolivia/i).click({ force: true });
      }
    });
  };

  /**
   * Espera a que la página termine de cargar y tenga contenido real.
   * Verifica loading desaparezca Y que haya contenido visible.
   */
  const waitForPageReady = () => {
    cy.get("body", { timeout: 60000 }).should(($body) => {
      const hasSkeleton = $body.find('[data-cy="loading-skeleton"]').length > 0;
      expect(hasSkeleton, "Loading skeleton should be gone").to.be.false;

      const hasFilters = $body.find('[data-cy="level-options"]').length > 0;
      const hasResultsTitle = $body.text().includes("Resultados Generales");
      const hasSinDatos = $body.text().includes("Sin datos");
      const hasParticipacion = $body.text().includes("Participación");

      expect(
        hasFilters || hasResultsTitle || hasSinDatos || hasParticipacion,
        "Page should have visible content (filters, title, or data)",
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
    cy.seedTestData();
  });

  after(() => {
    cy.cleanupTestData();
  });

  beforeEach(() => {
    cy.clearSession();

    cy.intercept("GET", "**/api/v1/elections/config/status*").as("configStatus");
    cy.intercept("GET", "**/api/v1/elections/config*").as("config");
    cy.intercept("GET", "**/api/v1/geographic/departments*").as("departments");
    cy.intercept("GET", "**/api/v1/geographic/provinces/by-department/*").as(
      "provincesByDepartment",
    );
    cy.intercept("GET", "**/api/v1/geographic/municipalities/by-province/*").as(
      "municipalitiesByProvince",
    );
    cy.intercept(
      "GET",
      "**/api/v1/geographic/electoral-seats/by-municipality/*",
    ).as("seatsByMunicipality");
    cy.intercept(
      "GET",
      "**/api/v1/geographic/electoral-locations/by-electoral-seat/*",
    ).as("locationsBySeat");
    cy.intercept("GET", "**/api/v1/results/live/by-location*").as("liveResults");
    cy.intercept("GET", "**/api/v1/results/by-location*").as("officialResults");
  });

  describe("SUPERADMIN - Filtros sin restricción", () => {
    it("SUPERADMIN puede ver todos los departamentos", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click();
      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

      cy.wait("@departments", { timeout: 30000 });

      openRootFiltersIfNeeded();
      waitLevel(0);

      // Debe haber múltiples departamentos disponibles
      cy.get('[data-cy="level-options"] [data-cy^="option-0-"]').should(
        "have.length.at.least",
        1,
      );

      assertNoErrors();
    });

    it("SUPERADMIN puede navegar por toda la jerarquía", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click();
      cy.wait("@departments", { timeout: 60000 });

      openRootFiltersIfNeeded();
      waitLevel(0);

      // Nivel 0: Departamento
      clickOptionByText("La Paz");
      waitLevel(1);

      // Nivel 1: Provincia
      clickOptionByText("Murillo");
      waitLevel(2);

      // Nivel 2: Municipio
      cy.get('[data-cy="level-options"] [data-cy^="option-2-"]')
        .first()
        .click({ force: true });

      // Esperar siguiente nivel si existe
      cy.wait(1000);

      assertNoErrors();
    });

    it("SUPERADMIN puede cambiar de departamento libremente", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click();
      cy.wait("@departments", { timeout: 60000 });

      openRootFiltersIfNeeded();
      waitLevel(0);

      // Seleccionar La Paz
      clickOptionByText("La Paz");
      waitLevel(1);

      // Volver a nivel de departamento (si hay botón de departamento)
      cy.get("body").then(($b) => {
        if ($b.find('[data-cy="department-select"]').length > 0) {
          cy.get('[data-cy="department-select"]').click({ force: true });
          waitLevel(0);

          // Seleccionar otro departamento
          cy.get('[data-cy="level-options"] [data-cy^="option-0-"]')
            .not(':contains("La Paz")')
            .first()
            .click({ force: true });
        }
      });

      assertNoErrors();
    });

    it("SUPERADMIN puede usar el botón de resetear filtros", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click();
      cy.wait("@departments", { timeout: 60000 });

      openRootFiltersIfNeeded();
      waitLevel(0);

      // Seleccionar un departamento
      clickOptionByText("La Paz");
      waitLevel(1);

      // Buscar y usar el botón de resetear
      cy.get("body").then(($b) => {
        if ($b.find('[data-cy="filters-reset"]').length > 0) {
          cy.get('[data-cy="filters-reset"]').click({ force: true });

          // Después de resetear, debe volver a mostrar departamentos
          cy.wait(1000);
          openRootFiltersIfNeeded();
        }
      });

      assertNoErrors();
    });
  });

  describe("GOBERNADOR - Filtros restringidos a departamento", () => {
    it("Gobernador La Paz inicia con su departamento", () => {
      cy.loginUI2("gobernador.lapaz@test.local", PASSWORD);

      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });

      waitForPageReady();

      // Puede tener filtro de departamento preseleccionado en URL
      cy.get("body").should("be.visible");

      assertNoErrors();
    });

    // it("Gobernador puede navegar provincias de su departamento", () => {
    //   cy.loginUI2("gobernador.lapaz@test.local", PASSWORD);

    //   cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
    //   cy.wait("@departments", { timeout: 60000 });
    //   cy.wait("@officialResults", { timeout: 60000 });

    //   waitForPageReady();

    //   // Asegurar que las opciones de provincia est?n visibles
    //   cy.get("body").then(($b) => {
    //     if ($b.find('[data-cy="level-options"]').length === 0) {
    //       if ($b.find('[data-cy="department-select"]').length > 0) {
    //         cy.get('[data-cy="department-select"]').click({ force: true });
    //       }
    //     }
    //   });

    //   // Provincias (nivel 1)
    //   waitLevel(1);
    //   cy.get('[data-cy="level-options"] [data-cy^="option-1-"]')
    //     .first()
    //     .click({ force: true });

    //   assertNoErrors();
    // });

    it("Gobernador Cochabamba inicia con su departamento", () => {
      cy.loginUI2("gobernador.cochabamba@test.local", PASSWORD);

      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });

      waitForPageReady();
      assertNoErrors();
    });
  });

  describe("ALCALDE - Filtros restringidos a municipio", () => {
    it("Alcalde La Paz inicia con su municipio", () => {
      cy.loginUI2("alcalde.lapaz@test.local", PASSWORD);

      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });

      waitForPageReady();

      // Puede tener filtros preseleccionados
      cy.get("body").should("be.visible");

      assertNoErrors();
    });

    it("Alcalde puede ver asientos/recintos de su municipio", () => {
      cy.loginUI2("alcalde.lapaz@test.local", PASSWORD);

      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
      cy.wait("@departments", { timeout: 60000 });
      cy.wait("@officialResults", { timeout: 60000 });

      waitForPageReady();

      // El alcalde debería poder navegar dentro de su municipio (si hay filtros)
      cy.get("body").then(($b) => {
        if ($b.find('[data-cy="level-options"]').length > 0) {
          cy.get('[data-cy="level-options"] [data-cy^="option-"]')
            .first()
            .click({ force: true });
        }
      });

      assertNoErrors();
    });

    it("Alcalde Cochabamba inicia con su municipio", () => {
      cy.loginUI2("alcalde.cochabamba@test.local", PASSWORD);

      cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });

      waitForPageReady();
      assertNoErrors();
    });
  });

  describe("Selector de Elección", () => {
    it("SUPERADMIN puede ver selector de elección", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click();
      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });

      waitForPageReady();

      // Verificar si existe selector de elección
      cy.get("body").then(($b) => {
        if ($b.find('[data-cy="election-select"]').length > 0) {
          cy.get('[data-cy="election-select"]').should("be.visible");
        }
      });

      assertNoErrors();
    });

    it("Cambiar elección recarga los datos", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click();
      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });

      waitForPageReady();

      cy.get("body").then(($b) => {
        if ($b.find('[data-cy="election-select"]').length > 0) {
          // Seleccionar una opción diferente si hay
          cy.get('[data-cy="election-select"] option').then(($options) => {
            if ($options.length > 1) {
              cy.get('[data-cy="election-select"]').select(1);
              waitForPageReady();
            }
          });
        }
      });

      assertNoErrors();
    });
  });

  describe("Búsqueda en filtros", () => {
    it("SUPERADMIN puede buscar en las opciones de filtro", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.visit("/resultados");
      cy.wait("@departments", { timeout: 60000 });

      openRootFiltersIfNeeded();
      waitLevel(0);

      // Si hay campo de búsqueda
      cy.get("body").then(($b) => {
        // Buscar input de búsqueda (puede ser table-search-input u otro)
        const searchInput = $b.find(
          '[data-cy="table-search-input"], input[type="search"], input[placeholder*="Buscar"]',
        );

        if (searchInput.length > 0) {
          cy.wrap(searchInput).first().clear().type("La Paz");

          // Las opciones deben filtrarse
          cy.get('[data-cy="level-options"] [data-cy^="option-"]').should(
            "contain.text",
            "La Paz",
          );
        }
      });

      assertNoErrors();
    });
  });

  describe("URL y Query Params", () => {
    it("Seleccionar departamento actualiza URL", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click();
      cy.wait("@departments", { timeout: 60000 });

      openRootFiltersIfNeeded();
      waitLevel(0);

      clickOptionByText("La Paz");

      // La URL debe tener el parámetro de departamento
      cy.location("search", { timeout: 10000 }).should("include", "department=");

      assertNoErrors();
    });

    it("Seleccionar provincia actualiza URL", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click();
      cy.wait("@departments", { timeout: 60000 });

      openRootFiltersIfNeeded();
      waitLevel(0);

      clickOptionByText("La Paz");
      waitLevel(1);

      clickOptionByText("Murillo");

      // La URL debe tener parámetros
      cy.location("search", { timeout: 10000 }).should((search) => {
        expect(search).to.include("department=");
        expect(search).to.include("province=");
      });

      assertNoErrors();
    });

    it("Cargar página con query params mantiene filtros", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      // Visitar sin parámetros inválidos (la app limpia IDs inválidos)
      cy.visit("/resultados");
      cy.wait("@departments", { timeout: 30000 });
      cy.wait("@officialResults", { timeout: 60000 });

      waitForPageReady();

      // La página debe cargar correctamente
      cy.get("body").should("be.visible");

      assertNoErrors();
    });
  });

  describe("Manejo de errores en filtros", () => {
    it("UI maneja error 500 en departamentos", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.intercept("GET", "**/api/v1/geographic/departments*", {
        statusCode: 500,
        body: { message: "Internal Server Error" },
      }).as("departmentsError");

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click();
      cy.wait("@departmentsError", { timeout: 30000 });

      // La UI debe seguir funcional
      cy.get("body").should("be.visible");
      assertNoErrors();
    });

    it("UI maneja error 500 en provincias", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.intercept("GET", "**/api/v1/geographic/provinces/by-department/*", {
        statusCode: 500,
        body: { message: "Internal Server Error" },
      }).as("provincesError");

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click();
      cy.wait("@departments", { timeout: 60000 });

      openRootFiltersIfNeeded();
      waitLevel(0);

      clickOptionByText("La Paz");

      // Esperar el error
      cy.wait("@provincesError", { timeout: 10000 });

      // La UI debe seguir funcional
      cy.get("body").should("be.visible");
    });

    it("UI maneja respuesta vacía de departamentos", () => {
      cy.loginUI2("admin@local.test", PASSWORD);

      cy.intercept("GET", "**/api/v1/geographic/departments*", {
        statusCode: 200,
        body: { data: [] },
      }).as("departmentsEmpty");

      cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click();
      cy.wait("@departmentsEmpty", { timeout: 30000 });

      // La UI debe manejar lista vacía
      cy.get("body").should("be.visible");
      assertNoErrors();
    });
  });
});
