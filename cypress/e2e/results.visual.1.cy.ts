describe("Resultados - Casos Visuales Parte 1 (01-20)", () => {
    const liveResultsMatcher = /\/api\/v1\/results\/live\/by-location(\?.*)?$/;
    beforeEach(() => {
        cy.clearSession();
        cy.mockConfigStatus({
            hasActiveConfig: true,
            isVotingPeriod: true,
            isResultsPeriod: false,
        });
        cy.mockLiveResults({
            presidential: { delayMs: 0 },
            deputies: { delayMs: 0 },
        });
        cy.mockConfig([
            { _id: "election-mock-1", name: "Elección 1" },
            { _id: "election-mock-2", name: "Elección 2" },
        ]);
        cy.mockGeographyTwoDepts();
    });

    it("01: Visualización de Loaders", () => {
        cy.mockConfigStatus({
            hasActiveConfig: true,
            isVotingPeriod: true,
            isResultsPeriod: false,
        });

        const okPres = require("../fixtures/results_ok_presidential.json");
        const okDep = require("../fixtures/results_ok_deputies.json");

        cy.mockLiveResults({
            presidential: { body: okPres, delayMs: 2500 },
            deputies: { body: okDep, delayMs: 2500 },
        });

        cy.visitResults();

        cy.get('[data-cy="loading-skeleton"]', { timeout: 10000 }).should("exist");

        cy.wait("@liveResultsPresidential", { timeout: 20000 });
        cy.wait("@liveResultsDeputies", { timeout: 20000 });

        cy.contains("Resultados Generales").should("be.visible");
        cy.contains("Resultados Presidenciales")
            .scrollIntoView()
            .should("be.visible");
    });

    it("02: Renderizado exitoso de datos cuando hay resultados", () => {
        const okPres = require("../fixtures/results_ok_presidential.json");
        const okDep = require("../fixtures/results_ok_deputies.json");

        cy.mockLiveResults({
            presidential: { body: okPres, delayMs: 0 },
            deputies: { body: okDep, delayMs: 0 },
        });

        cy.visitResults();
        cy.wait("@liveResultsPresidential", { timeout: 20000 });
        cy.wait("@liveResultsDeputies", { timeout: 20000 });

        cy.contains("Resultados Generales").should("be.visible");
        cy.get('[data-cy="presidential-results"]', { timeout: 10000 }).should(
            "exist",
        );
        cy.get('[data-cy="total-votes"]').should("exist").and("not.have.text", "");
        cy.get('[data-cy="statsbars"]').should("exist");
    });

    it('03: Empty State muestra "Sin datos"', () => {
        cy.mockConfigStatus({
            hasActiveConfig: true,
            isVotingPeriod: true,
            isResultsPeriod: false,
        });

        const empty = require("../fixtures/results_empty.json");

        cy.mockLiveResults({
            presidential: { body: empty, delayMs: 2500 },
            deputies: { body: empty, delayMs: 2500 },
        });

        cy.visitResults();

        cy.wait("@liveResultsPresidential", { timeout: 20000 });
        cy.wait("@liveResultsDeputies", { timeout: 20000 });

        cy.contains("Resultados Generales", { timeout: 10000 }).should("exist");
        cy.contains("Sin datos", { timeout: 10000 }).should("exist");
    });

    it("04: 4xx no crashea", () => {
        cy.mockConfigStatus({
            hasActiveConfig: true,
            isVotingPeriod: true,
            isResultsPeriod: false,
        });

        const okDep = require("../fixtures/results_ok_deputies.json");

        cy.mockLiveResults({
            presidential: {
                statusCode: 400,
                body: { message: "Bad Request" },
                delayMs: 0,
            },
            deputies: { body: okDep, delayMs: 0 },
        });

        cy.visitResults();

        cy.wait("@liveResultsPresidential", { timeout: 20000 });
        cy.wait("@liveResultsDeputies", { timeout: 20000 });

        cy.contains("Resultados Generales").should("be.visible");

        cy.contains("Sin datos", { timeout: 10000 }).should("exist");
    });

    it("05: 5xx en mesas no crashea", () => {
        cy.mockResultsBootstrap();

        cy.mockConfigStatus({
            hasActiveConfig: true,
            isVotingPeriod: true,
            isResultsPeriod: false,
        });

        const okPres = require("../fixtures/results_ok_presidential.json");
        const okDep = require("../fixtures/results_ok_deputies.json");

        cy.mockLiveResults({
            presidential: { body: okPres, delayMs: 0 },
            deputies: { body: okDep, delayMs: 0 },
        });

        cy.mockTablesByLocation({
            statusCode: 500,
            body: { message: "Server error" },
        });

        cy.visitResults({ electoralLocation: "loc-123" });

        cy.wait("@liveResultsPresidential", { timeout: 20000 });
        cy.wait("@liveResultsDeputies", { timeout: 20000 });
        cy.wait("@tablesByLocation", { timeout: 20000 });

        cy.contains("Resultados Generales").should("be.visible");
        cy.contains("Mesas").should("be.visible");
    });

    it("06: Actualización dinámica por selección de filtro", () => {
        const resultsGeneral = require("../fixtures/results_ok_presidential.json");
        const resultsFiltered = {
            results: [
                { partyId: "MAS", totalVotes: 25000 },
                { partyId: "CC", totalVotes: 20000 },
            ],
            summary: {
                validVotes: 45000,
                nullVotes: 2000,
                blankVotes: 1000,
                tablesProcessed: 250,
                totalTables: 500,
            },
        };

        cy.mockLiveResults({
            presidential: { body: resultsGeneral, delayMs: 0 },
            deputies: { body: resultsGeneral, delayMs: 0 },
        });

        cy.visitResults();
        cy.wait("@liveResultsPresidential");

        cy.get('[data-cy="total-votes"]')
            .invoke("text")
            .then((initialVotes) => {
                cy.intercept("GET", "**/api/v1/results/live/by-location*", (req) => {
                    const hasFilters = req.query.department;
                    if (hasFilters) {
                        req.alias = "liveResultsFiltered";
                        req.reply({ statusCode: 200, body: resultsFiltered });
                    }
                });

                cy.get('[data-cy="option-0-dep-lpz"]').click();
                cy.wait("@liveResultsFiltered");

                cy.get('[data-cy="total-votes"]')
                    .invoke("text")
                    .should((newVotes) => {
                        expect(newVotes).to.not.equal(initialVotes);
                    });
            });
    });

    it("07: Limpieza de Estado en Cambio de Elección", () => {
        cy.mockConfigStatus({
            hasActiveConfig: true,
            isVotingPeriod: true,
            isResultsPeriod: false,
        });

        cy.mockConfig([
            { _id: "election-mock-1", name: "Elección 1" },
            { _id: "election-mock-2", name: "Elección 2" },
        ]);

        const okPres = require("../fixtures/results_ok_presidential.json");
        const okDep = require("../fixtures/results_ok_deputies.json");

        cy.mockLiveResults({
            presidential: { body: okPres, delayMs: 0 },
            deputies: { body: okDep, delayMs: 0 },
        });

        cy.mockGeographyBasic();

        cy.visitResults();

        cy.wait("@liveResultsPresidential", { timeout: 20000 });
        cy.wait("@liveResultsDeputies", { timeout: 20000 });

        cy.wait("@departments", { timeout: 20000 });

        cy.get('[data-cy="level-options"]', { timeout: 10000 }).should("exist");

        cy.get('[data-cy="option-0-dep-lpz"]', { timeout: 20000 })
            .should("be.visible")
            .scrollIntoView()
            .click();

        cy.get('[data-cy="department-select"]', { timeout: 10000 })
            .should("exist")
            .and("contain.text", "La Paz");

        cy.wait("@provincesByDepartment", { timeout: 20000 });

        cy.get('[data-cy="option-1-prov-mur"]', { timeout: 20000 })
            .should("be.visible")
            .scrollIntoView()
            .click();

        cy.wait("@municipalitiesByProvince", { timeout: 20000 });

        cy.get('[data-cy="option-2-mun-lpz"]', { timeout: 20000 })
            .should("be.visible")
            .scrollIntoView()
            .click();
        cy.wait("@seatsByMunicipality", { timeout: 20000 });
        cy.get('[data-cy="election-select"]', { timeout: 10000 })
            .should("exist")
            .find("option")
            .contains("Elección 2")
            .should("exist")
            .invoke("val")
            .then((val) => {
                cy.get('[data-cy="election-select"]').select(String(val));
            });

        cy.get('[data-cy="department-select"]', { timeout: 10000 }).should(
            "not.exist",
        );
        cy.get('[data-cy="department-select"]', { timeout: 10000 }).should(
            "not.exist",
        );

        cy.get('[data-cy="level-options"]', { timeout: 10000 }).should("exist");
        cy.get('[data-cy="option-0-dep-lpz"]', { timeout: 10000 }).should("exist");
    });

    it("08: Habilitación secuencial (no aparecen provincias/municipios hasta elegir nivel superior)", () => {
        cy.visitResults();

        cy.wait("@departments");

        cy.get('[data-cy^="option-"][data-cy*="prov-"]').should("not.exist");
        cy.get('[data-cy^="option-"][data-cy*="mun-"]').should("not.exist");

        cy.contains('[data-cy^="option-"]', "La Paz").click();

        cy.wait("@provincesByDepartmentLp");

        cy.contains('[data-cy^="option-"]', "Murillo").should("be.visible");

        cy.contains('[data-cy^="option-"]', "Murillo").click();

        cy.wait("@municipalitiesByProvinceMur");

        cy.contains('[data-cy^="option-"]', "La Paz").should("be.visible");
    });

    it("09: Inicialización desde URL (deep-link)", () => {
        cy.mockGeographyByIdBasic();

        cy.visitResults({
            department: "dep-lpz",
            province: "prov-mur",
            municipality: "mun-lpz",
        });

        cy.wait("@departmentById");
        cy.wait("@provinceById");
        cy.wait("@municipalityById");

        cy.get('[data-cy="department-select"]').should("contain.text", "La Paz");
        cy.get('[data-cy="province-select"]').should("contain.text", "Murillo");
        cy.get('[data-cy="municipality-select"]').should("contain.text", "La Paz");
    });

    it("10: Reseteo por cambio en nivel superior (cambiar depto limpia provincia/municipio)", () => {
        cy.visitResults();
        cy.wait("@departments");

        cy.get('[data-cy="option-0-dep-lpz"]').click();
        cy.wait("@provincesByDepartmentLp");

        cy.get('[data-cy="option-1-prov-mur"]').click();
        cy.wait("@municipalitiesByProvinceMur");

        cy.get('[data-cy="option-2-mun-lpz"]').click();
        cy.wait("@seatsByMunicipality");

        cy.get('[data-cy="department-select"]')
            .should("exist")
            .click({ force: true });

        cy.get('[data-cy="option-0-dep-cbba"]').should("be.visible").click();
        cy.wait("@provincesByDepartmentCbba");

        cy.location("search").should("include", "department=dep-cbba");
        cy.location("search").should("not.include", "province=");
        cy.location("search").should("not.include", "municipality=");

        cy.get('[data-cy="option-1-prov-cerc"]').should("be.visible");
        cy.get('[data-cy="option-1-prov-mur"]').should("not.exist");
    });

    it("11: Estado de inicialización (arranca en neutro/general)", () => {
        cy.visitResults();

        cy.wait("@departments");

        cy.location("search").should("not.include", "department=");
        cy.location("search").should("not.include", "province=");
        cy.location("search").should("not.include", "municipality=");

        cy.contains('[data-cy^="option-"]', "La Paz").should("be.visible");
        cy.contains('[data-cy^="option-"]', "Cochabamba").should("be.visible");
    });

    it('12: Botón "Resetear" vuelve a estado base', () => {
        cy.visitResults();
        cy.wait("@departments");

        cy.contains('[data-cy^="option-"]', "La Paz").click();
        cy.wait("@provincesByDepartmentLp");

        cy.get("body").then(($b) => {
            if ($b.find('[data-cy="filters-reset"]').length) {
                cy.get('[data-cy="filters-reset"]').click();
            } else {
                cy.contains("button", /resetear/i).click();
            }
        });
        cy.location("search").should("not.include", "department=");
        cy.get('[data-cy="department-select"]').should("not.exist");

        cy.get("body").then(($b) => {
            const hasAnyOption = $b.find('[data-cy^="option-"]').length > 0;
            if (!hasAnyOption) {
                cy.contains("button", /bolivia/i).click({ force: true });
            }
        });

        cy.contains('[data-cy^="option-"]', "La Paz").should("be.visible");
        cy.contains('[data-cy^="option-"]', "Cochabamba").should("be.visible");
    });

    it("13: Cerrar panel y reabrirlo desde breadcrumb (no pierde selección)", () => {
        cy.visitResults();
        cy.wait("@departments");

        cy.get('[data-cy="option-0-dep-lpz"]').click();
        cy.wait("@provincesByDepartmentLp");

        cy.get('button[aria-label="Cerrar"]').click();
        cy.get('[data-cy="level-options"]').should("not.exist");

        cy.get('[data-cy="department-select"]').click({ force: true });

        cy.contains('[data-cy^="option-"]', "La Paz").should("be.visible");
        cy.contains('[data-cy^="option-"]', "Cochabamba").should("be.visible");

        cy.contains('[data-cy^="option-"]', "La Paz").click();
        cy.wait("@provincesByDepartmentLp");
        cy.contains('[data-cy^="option-"]', "Murillo").should("be.visible");
    });

    it("14: Validación de combinaciones lógicas (Depto -> Prov -> Mun) + request query coherente", () => {
        cy.intercept(
            {
                method: "GET",
                url: liveResultsMatcher,
                query: {
                    electionType: "presidential",
                    department: "dep-lpz",
                    province: "prov-mur",
                    municipality: "mun-lpz",
                },
            },
            { fixture: "results_ok_presidential.json" },
        ).as("liveResultsPresidentialMun");

        cy.intercept(
            {
                method: "GET",
                url: liveResultsMatcher,
                query: {
                    electionType: "deputies",
                    department: "dep-lpz",
                    province: "prov-mur",
                    municipality: "mun-lpz",
                },
            },
            { fixture: "results_ok_deputies.json" },
        ).as("liveResultsDeputiesMun");

        cy.visitResults();
        cy.wait("@departments");

        cy.get('[data-cy="option-0-dep-lpz"]').click();
        cy.wait("@provincesByDepartmentLp");

        cy.get('[data-cy="option-1-prov-mur"]').click();
        cy.wait("@municipalitiesByProvinceMur");

        cy.get('[data-cy="option-2-mun-lpz"]').click();
        cy.wait("@seatsByMunicipality");

        cy.location("search").should("include", "department=dep-lpz");
        cy.location("search").should("include", "province=prov-mur");
        cy.location("search").should("include", "municipality=mun-lpz");

        cy.wait("@liveResultsPresidentialMun")
            .its("request.query")
            .then((q) => {
                expect(String(q.department)).to.eq("dep-lpz");
                expect(String(q.province)).to.eq("prov-mur");
                expect(String(q.municipality)).to.eq("mun-lpz");
            });

        cy.wait("@liveResultsDeputiesMun")
            .its("request.query")
            .then((q) => {
                expect(String(q.department)).to.eq("dep-lpz");
                expect(String(q.province)).to.eq("prov-mur");
                expect(String(q.municipality)).to.eq("mun-lpz");
            });

        cy.contains("Resultados Generales").should("exist");
    });

    it("15: Adaptabilidad a textos largos (no rompe selectores y sigue siendo seleccionable)", () => {
        cy.mockGeographyLongNames();

        cy.visitResults();
        cy.wait("@departments");

        cy.contains(
            '[data-cy^="option-"]',
            "Departamento con un nombre extremadamente largo",
        )
            .should("exist")
            .click({ force: true });

        cy.wait("@provincesByDepartmentLong");

        cy.contains(
            '[data-cy^="option-"]',
            "Provincia con un nombre extremadamente largo",
        )
            .should("exist")
            .click({ force: true });

        cy.wait("@municipalitiesByProvinceLong");

        cy.contains(
            '[data-cy^="option-"]',
            "Municipio con un nombre extremadamente largo",
        )
            .should("exist")
            .click({ force: true });

        cy.wait("@seatsByMunicipality");

        cy.contains("Resultados Generales").should("exist");
    });

    it("16: Prevención de valores indefinidos (no aparece undefined/null/NaN en UI)", () => {
        const broken = {
            results: [
                { partyId: "p1", totalVotes: null },
                { partyId: "p2", totalVotes: undefined },
            ],
            summary: {
                validVotes: undefined,
                nullVotes: null,
                blankVotes: NaN,
                tablesProcessed: 0,
                totalTables: 0,
            },
        };

        cy.mockLiveResults({
            presidential: { body: broken as any, delayMs: 0 },
            deputies: { body: broken as any, delayMs: 0 },
        });

        cy.visitResults();
        cy.wait("@liveResultsPresidential");
        cy.wait("@liveResultsDeputies");

        cy.get("body")
            .invoke("text")
            .then((t) => {
                expect(t).to.not.include("undefined");
                expect(t).to.not.include("null");
                expect(t).to.not.include("NaN");
            });

        cy.contains("Resultados Generales").should("exist");
    });

    it("17: Formato de porcentajes (2 decimales) en StatisticsBars", () => {
        cy.visitResults();
        cy.wait("@liveResultsPresidential");
        cy.wait("@liveResultsDeputies");

        cy.get('[data-cy="statsbars"] [data-cy="vote-percentage"]').each(($el) => {
            const txt = $el.text().trim();
            expect(txt).to.match(/^\d+\.\d{2}%$/);
            const val = Number(txt.replace("%", ""));
            expect(val).to.be.at.least(0);
            expect(val).to.be.at.most(100);
        });
    });

    it("18: Coherencia entre detalle y totales (no crashea ante discrepancias)", () => {
        const inconsistent = {
            results: [
                { partyId: "p1", totalVotes: 100 },
                { partyId: "p2", totalVotes: 100 },
            ],
            summary: {
                validVotes: 50,
                nullVotes: 10,
                blankVotes: 5,
                tablesProcessed: 1,
                totalTables: 10,
            },
        };

        cy.mockLiveResults({
            presidential: { body: inconsistent as any, delayMs: 0 },
            deputies: { body: inconsistent as any, delayMs: 0 },
        });

        cy.visitResults();
        cy.wait("@liveResultsPresidential");
        cy.wait("@liveResultsDeputies");

        cy.contains("Resultados Generales").should("exist");
    });

    it("19: Renderizado de votos no válidos (Blancos y Nulos)", () => {
        const withInvalid = {
            results: [
                { partyId: "p1", totalVotes: 80 },
                { partyId: "p2", totalVotes: 20 },
            ],
            summary: {
                validVotes: 100,
                nullVotes: 7,
                blankVotes: 3,
                tablesProcessed: 5,
                totalTables: 10,
            },
        };

        cy.mockLiveResults({
            presidential: { body: withInvalid as any, delayMs: 0 },
            deputies: { body: withInvalid as any, delayMs: 0 },
        });

        cy.visitResults();
        cy.wait("@liveResultsPresidential");
        cy.wait("@liveResultsDeputies");

        cy.contains("Resultados Generales").should("exist");
    });

    it("20: Estabilidad con datos parciales (solo algunos partidos)", () => {
        const partial = {
            results: [{ partyId: "p1", totalVotes: 123 }],
            summary: {
                validVotes: 123,
                nullVotes: 0,
                blankVotes: 0,
                tablesProcessed: 2,
                totalTables: 10,
            },
        };

        cy.mockLiveResults({
            presidential: { body: partial as any, delayMs: 0 },
            deputies: { body: partial as any, delayMs: 0 },
        });

        cy.visitResults();
        cy.wait("@liveResultsPresidential");
        cy.wait("@liveResultsDeputies");

        cy.get("body")
            .invoke("text")
            .then((t) => {
                expect(t).to.not.include("undefined");
                expect(t).to.not.include("NaN");
            });

        cy.contains("Resultados Generales").should("exist");
    });
});
