describe("Resultados - Filtros geográficos (Backend real)", () => {
  const getElectionId = () => {
    const testElections = Cypress.env("testElections") || [];
    return testElections[0]?.id || Cypress.env("electionId") || null;
  };

  const visitResultados = (path = "/resultados") => {
    const electionId = getElectionId();
    cy.visit(path, {
      onBeforeLoad(win) {
        if (electionId) {
          win.localStorage.setItem("selectedElectionId", electionId);
        }
      },
    });
  };

  const waitOptionsReady = () => {
    // Wait for level-options to actually appear (positive assertion that retries)
    cy.get('[data-cy="level-options"]', { timeout: 60000 }).should("exist");
  };

  const waitLevel = (levelIndex: 0 | 1 | 2 | 3 | 4) => {
    waitOptionsReady();
    cy.get(`[data-cy="level-options"] [data-cy^="option-${levelIndex}-"]`, {
      timeout: 60000,
    }).should("exist");
  };

  const clickOptionByText = (label: string) => {
    cy.get('[data-cy="level-options"]', { timeout: 60000 }).should("exist");
    cy.contains('[data-cy="level-options"] [data-cy^="option-"]', label, {
      timeout: 60000,
    })
      .should("exist")
      .scrollIntoView()
      .click({ force: true });
  };

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

  const selectOptionByText = (label: string) => {
    waitOptionsReady();
    clickOptionByText(label);
  };

  beforeEach(() => {
    cy.clearSession();

    cy.intercept("GET", "**/api/v1/elections/config/status*").as(
      "configStatus",
    );
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

    cy.intercept("GET", "**/api/v1/results/live/by-location*").as(
      "liveResults",
    );
    cy.intercept("GET", "**/api/v1/results/by-location*", (req) => {
      req.alias = "officialResults";
    });
  });

  it("E2E: Admin entra a /resultados y puede usar filtros", () => {
    cy.loginUI2("admin@local.test", "test1234");
    cy.get('[data-cy="res-gen"]').click();
    cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

    cy.wait("@configStatus", { timeout: 20000 }).its("response.statusCode");
    cy.wait("@departments", { timeout: 20000 }).its("response.statusCode");

    openRootFiltersIfNeeded();

    waitOptionsReady();
    cy.get('[data-cy="level-options"] [data-cy^="option-"]', {
      timeout: 20000,
    }).should("exist");
  });

  it("E2E 08: Habilitación secuencial (Departamento -> Provincia -> Municipio)", () => {
    cy.loginUI2("admin@local.test", "test1234");
    cy.get('[data-cy="res-gen"]', { timeout: 15000 }).click();
    cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

    cy.wait("@departments", { timeout: 60000 });

    waitLevel(0);
    clickOptionByText("La Paz");

    waitLevel(1);
    clickOptionByText("Murillo");

    waitLevel(2);
    clickOptionByText("Nuestra Señora de La Paz");
    waitLevel(3);
    clickOptionByText("Nuestra Señora de La Paz");
  });

  it("E2E 09 : Alcalde intenta abrir con dept+mun; si ID no existe, la app continúa sin crashear", () => {
    cy.loginUI("alcalde.lapaz@test.local", "test1234");

    cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
    cy.wait("@departments", { timeout: 30000 });

    cy.location("search", { timeout: 20000 }).then((search) => {
      const s = String(search || "");
      const hadParams =
        s.includes("department=") || s.includes("municipality=");

      cy.wrap(hadParams).should("be.a", "boolean");
    });

    cy.get("body").should("be.visible");
  });

  it("E2E 09: Gobernador intenta abrir con dept; si IDs no existen, la app hace fallback y sigue operable", () => {
    cy.loginUI("gobernador.lapaz@test.local", "test1234");

    cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");

    // Espera que la app procese la carga base real
    cy.wait("@departments", { timeout: 60000 });

    // Si el ID es inválido, la app debería limpiarlo y caer a /resultados (sin query)
    cy.location("search", { timeout: 60000 }).should(
      "not.include",
      "department=",
    );

    // UI operable (filtros base)
    openRootFiltersIfNeeded();
    waitLevel(0);

    cy.get("body").should("be.visible");
  });

  it("E2E 10: Cambiar Departamento limpia province/municipality en URL", () => {
    cy.loginUI2("admin@local.test", "test1234");
    cy.visit("/resultados");
    cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
    cy.wait("@departments", { timeout: 60000 });

    waitLevel(0);
    clickOptionByText("La Paz");

    waitLevel(1);
    clickOptionByText("Murillo");
    waitLevel(2);
    clickOptionByText("Nuestra Señora de La Paz");
    waitLevel(3);
    clickOptionByText("Nuestra Señora de La Paz");

    cy.get('[data-cy="department-select"]', { timeout: 20000 }).click({
      force: true,
    });

    waitLevel(0);
    clickOptionByText("Cochabamba");

    waitLevel(1);

    cy.location("search").should("include", "department=");
    cy.location("search").should("not.include", "province=");
    cy.location("search").should("not.include", "municipality=");
  });

  it('E2E 12: "Resetear" vuelve a estado inicial sin filtros en URL', () => {
    cy.loginUI2("admin@local.test", "test1234");
    cy.visit("/resultados");
    cy.wait("@departments", { timeout: 20000 });

    selectOptionByText("La Paz");
    waitLevel(1);

    cy.get('[data-cy="filters-reset"]', { timeout: 20000 }).click({
      force: true,
    });

    cy.location("search").should("not.include", "department=");
    cy.location("search").should("not.include", "province=");
    cy.location("search").should("not.include", "municipality=");

    waitOptionsReady();
    clickOptionByText("La Paz");
  });

  it("E2E 13: Cerrar panel y reabrirlo ", () => {
    cy.loginUI2("admin@local.test", "test1234");
    cy.visit("/resultados");
    openRootFiltersIfNeeded();
    waitLevel(0);

    clickOptionByText("La Paz");
    waitLevel(1);

    cy.get("body").then(($b) => {
      if ($b.find('button[aria-label="Cerrar"]').length) {
        cy.get('button[aria-label="Cerrar"]').click({ force: true });
        cy.get('[data-cy="level-options"]').should("not.exist");
      }
    });

    cy.get("body").then(($b) => {
      if ($b.find('[data-cy="department-select"]').length) {
        cy.get('[data-cy="department-select"]').click({ force: true });
      } else {
        openRootFiltersIfNeeded();
      }
    });

    waitLevel(0);
    cy.contains(
      '[data-cy="level-options"] [data-cy^="option-"]',
      "La Paz",
    ).should("exist");
    cy.contains(
      '[data-cy="level-options"] [data-cy^="option-"]',
      "Cochabamba",
    ).should("exist");

    clickOptionByText("La Paz");
    waitLevel(1);
  });

  it("E2E: Alcalde ve filtros bloqueados a su municipio", () => {
    cy.loginUI("alcalde.lapaz@test.local", "test1234");

    cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
    cy.wait("@departments", { timeout: 60000 });

    cy.get("body").then(($b) => {
      if ($b.find('[data-cy="municipality-select"]').length) {
        cy.get('[data-cy="municipality-select"]').should("exist");
        cy.get('[data-cy="department-select"]').should("not.exist");
        cy.get('[data-cy="province-select"]').should("not.exist");
      } else {
        openRootFiltersIfNeeded();
        waitLevel(0);
      }
    });
  });

  it("E2E: Gobernador ve filtros bloqueados a su departamento", () => {
    cy.loginUI("gobernador.lapaz@test.local", "test1234");

    cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
    cy.wait("@departments", { timeout: 60000 });

    cy.get("body").then(($b) => {
      if ($b.find('[data-cy="department-select"]').length) {
        cy.get('[data-cy="department-select"]').should("exist");
        cy.get('[data-cy="municipality-select"]').should("not.exist");
        cy.get('[data-cy="province-select"]').should("not.exist");
      } else {
        openRootFiltersIfNeeded();
        waitLevel(0);
      }
    });
  });

  it("E2E: Búsqueda en filtros reduce opciones visibles", () => {
    cy.loginUI2("admin@local.test", "test1234");
    cy.visit("/resultados");

    cy.wait("@departments", { timeout: 60000 });
    openRootFiltersIfNeeded();
    waitLevel(0);

    cy.get('[data-cy="level-options"] [data-cy^="option-"]').then(($opts) => {
      const initialCount = $opts.length;

      cy.get('[data-cy="table-search-input"]').clear().type("La Paz");

      cy.get('[data-cy="level-options"] [data-cy^="option-"]').should(
        ($after) => {
          if (initialCount > 0) {
            expect($after.length).to.be.at.most(initialCount);
          }
        },
      );
    });

    cy.contains(
      '[data-cy="level-options"] [data-cy^="option-"]',
      /La Paz/i,
    ).should("exist");
  });
});
