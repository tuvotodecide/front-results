export { };

describe("Resultados - Filtros geográficos (Mocks)", () => {
  const getElectionId = () => "eleccion-2025";

  const waitOptionsReady = () => {
    cy.get('[data-cy="level-options"]', { timeout: 30000 }).should("be.visible");
  };

  const waitLevel = (levelIndex: number) => {
    waitOptionsReady();
    cy.get(`[data-cy="level-options"] [data-cy^="option-${levelIndex}-"]`, {
      timeout: 30000,
    }).should("exist");
  };

  const clickOptionByText = (label: string) => {
    cy.get('[data-cy="level-options"]', { timeout: 30000 }).should("exist");
    cy.contains('button', label, { timeout: 30000 })
      .should("be.visible")
      .click({ force: true });
  };

  const openRootFiltersIfNeeded = () => {
    // Primero asegurar que la navegación base cargó
    cy.get('[data-cy="country-select"]', { timeout: 15000 }).should("exist");

    cy.get("body").then(($b) => {
      if ($b.find('[data-cy="level-options"]').length > 0) return;
      cy.get('[data-cy="country-select"]').click({ force: true });
    });
  };

  beforeEach(() => {
    cy.clearSession();

    // Mocks obligatorios para que cargue el dashboard de resultados
    cy.intercept("GET", "**/api/v1/elections/config/status*", {
      body: {
        elections: [
          { id: 'eleccion-2025', name: 'Elecciones Generales', type: 'presidential', isActive: true, isVotingPeriod: true }
        ]
      }
    }).as("configStatus");

    cy.intercept("GET", "**/api/v1/elections/config*", {
      body: [
        { id: 'eleccion-2025', name: 'Elecciones Generales', isActive: true }
      ]
    }).as("config");

    cy.intercept("GET", "**/api/v1/geographic/departments*", {
      body: {
        data: [
          { _id: 'dept-lp', name: 'La Paz' },
          { _id: 'dept-cbba', name: 'Cochabamba' }
        ]
      }
    }).as("departments");

    cy.intercept("GET", "**/api/v1/geographic/provinces/by-department/*", {
      body: [
        { _id: 'prov-murillo', name: 'Murillo', departmentId: 'dept-lp' }
      ]
    }).as("provincesByDepartment");

    cy.intercept("GET", "**/api/v1/geographic/municipalities/by-province/*", {
      body: [
        { _id: 'mun-lp', name: 'Nuestra Señora de La Paz', provinceId: 'prov-murillo' }
      ]
    }).as("municipalitiesByProvince");

    cy.intercept("GET", "**/api/v1/geographic/electoral-seats/by-municipality/*", {
      body: [
        { _id: 'seat-lp', name: 'Nuestra Señora de La Paz', municipalityId: 'mun-lp' }
      ]
    }).as("seatsByMunicipality");

    cy.intercept("GET", "**/api/v1/geographic/electoral-locations/by-electoral-seat/*", {
      body: [
        { _id: 'loc-lp', name: 'Escuela Bolivia', electoralSeatId: 'seat-lp' }
      ]
    }).as("locationsBySeat");

    cy.intercept("GET", "**/api/v1/results/live/by-location*", {
      body: {
        results: [{ partyId: 'azul', totalVotes: 1000 }],
        summary: { totalTables: 100, tablesProcessed: 10, validVotes: 1000, nullVotes: 0, blankVotes: 0 }
      }
    }).as("liveResults");
  });

  const setupAdmin = () => {
    cy.loginUI2("admin@test.com", "test1234");
    cy.window().then((win) => {
      win.localStorage.setItem("selectedElectionId", "eleccion-2025");
    });
    cy.visit("/resultados");
  };

  it("E2E: Admin ve departamentos y puede seleccionar uno", () => {
    setupAdmin();
    openRootFiltersIfNeeded();
    waitLevel(0);
    cy.contains("button", "La Paz").should("be.visible");
  });

  it("E2E 08: Habilitación secuencial (LP -> Murillo -> LPZ)", () => {
    setupAdmin();
    openRootFiltersIfNeeded();

    waitLevel(0);
    clickOptionByText("La Paz");

    waitLevel(1);
    clickOptionByText("Murillo");

    waitLevel(2);
    clickOptionByText("Nuestra Señora de La Paz");

    waitLevel(3);
    clickOptionByText("Nuestra Señora de La Paz");

    cy.contains("País").should("exist");
  });

  it("E2E 09: Alcalde login exitoso", () => {
    cy.loginUI("alcalde@test.com", "test1234");
    cy.visit("/resultados");
    cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
  });

  it("E2E 09: Gobernador login exitoso y filtro bloqueado", () => {
    cy.loginUI("gobernador@test.com", "test1234");
    cy.visit("/resultados");

    // Debería tener el departamento en la URL
    cy.location("search", { timeout: 20000 }).should("include", "department=");
  });

  it("E2E 13: Cerrar y reabrir panel", () => {
    setupAdmin();
    openRootFiltersIfNeeded();
    waitLevel(0);

    clickOptionByText("La Paz");
    waitLevel(1);

    // Cerrar con el botón X
    cy.get('button[aria-label="Cerrar"]').click({ force: true });
    cy.get('[data-cy="level-options"]').should("not.exist");

    // Reabrir haciendo clic en el breadcrumb
    cy.contains("button", "País").click({ force: true });
    waitLevel(0);
  });

  it("E2E: Alcalde no ve Dept ni Prov", () => {
    cy.loginUI("alcalde@test.com", "test1234");
    cy.visit("/resultados");

    cy.get('[data-cy="department-select"]').should("not.exist");
    cy.get('[data-cy="province-select"]').should("not.exist");
    cy.get('[data-cy="municipality-select"]').should("exist");
  });

  it("E2E: Búsqueda en filtros", () => {
    setupAdmin();
    openRootFiltersIfNeeded();
    waitLevel(0);

    cy.get('[data-cy="table-search-input"]').type("La Paz");
    cy.contains("button", "La Paz").should("be.visible");
    cy.contains("button", "Cochabamba").should("not.exist");
  });
});
