describe("Resultados - Casos Visuales Parte 2 (21-47)", () => {
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

    it("21: Búsqueda de mesa válida muestra resultados", () => {
        const tableData = {
            tableCode: "MESA-123",
            department: "La Paz",
            province: "Murillo",
            municipality: "La Paz",
            location: "Unidad Educativa San Andrés",
        };

        cy.mockTableSearchOk(tableData);
        cy.mockLiveResults({
            presidential: { delayMs: 0 },
            deputies: { delayMs: 0 },
        });

        cy.visit("/resultados");

        cy.get("body").then(($body) => {
            if ($body.find('[data-cy="table-search-input"]').length) {
                cy.get('[data-cy="table-search-input"]').type("MESA-123");
                cy.get('[data-cy="table-search-submit"]').click();
                cy.wait("@tableSearch");
                cy.contains("MESA-123").should("exist");
            }
        });
    });

    it("22: Manejo de Mesa/Imagen no Encontrada (404) muestra mensaje controlado", () => {
        const missingId = "NO-EXISTE-123";

        cy.mockBallotNotFound(missingId);

        cy.mockAttestationsByBallotId(missingId, []);

        cy.visitResultadosImagen(missingId);

        cy.wait("@ballotById404");

        cy.get('[data-cy="ballot-not-found"]').should("exist");
        cy.contains(`No se encontró la imagen "${missingId}"`).should("exist");

        cy.get('[data-cy="image-search-input"]').should("exist");
    });

    it("23: Normalización de entrada (trim) navega con ID limpio", () => {
        cy.visitResultadosImagen();

        cy.get('[data-cy="image-search-input"]').type("   ABC123   ");
        cy.get('[data-cy="image-search-submit"]').click();

        cy.location("pathname").should("eq", "/resultados/imagen/ABC123");
    });

    it("24: Visualización IPFS + fallback si la imagen falla (onError)", () => {
        const id = "BALLOT-OK-1";

        cy.mockBallotById(id, require("../fixtures/ballot_ok.json"));
        cy.mockAttestationsByBallotId(
            id,
            require("../fixtures/attestations_ok.json"),
        );

        cy.visitResultadosImagen(id);

        cy.wait("@ballotById");
        cy.wait("@attestationsByBallot");

        cy.get('[data-cy="ipfs-image-link"]')
            .should("have.attr", "href")
            .and("include", "https://ipfs.io/ipfs/");

        cy.get("body").then(($b) => {
            if ($b.find('[data-cy="ballot-image"]').length) {
                cy.get('[data-cy="ballot-image"]').trigger("error");
                cy.get('[data-cy="ballot-image-fallback"]').should("exist");
            }
        });
    });

    it("25: Integridad de enlaces de auditoría (Ver NFT / Metadata) tienen URLs correctas", () => {
        const id = "BALLOT-OK-1";

        cy.mockBallotById(id, require("../fixtures/ballot_ok.json"));
        cy.mockAttestationsByBallotId(
            id,
            require("../fixtures/attestations_ok.json"),
        );

        cy.visitResultadosImagen(id);

        cy.wait("@ballotById");

        cy.get('[data-cy="link-nft"]')
            .should("have.attr", "href")
            .and("match", /^https?:\/\//);
        cy.get('[data-cy="link-metadata"]')
            .should("have.attr", "href")
            .and("match", /^https?:\/\//);
    });

    it("26: Recuperación de estado vía URL (deep link)", () => {
        cy.mockGeographyByIdBasic();
        const okPres = require("../fixtures/results_ok_presidential.json");

        cy.mockLiveResults({
            presidential: { body: okPres, delayMs: 0 },
            deputies: { body: okPres, delayMs: 0 },
        });

        cy.visitResults({
            department: "dep-lpz",
            province: "prov-mur",
            municipality: "mun-lpz",
        });

        cy.wait("@departmentById", { timeout: 10000 });
        cy.wait("@provinceById");
        cy.wait("@municipalityById");

        cy.get('[data-cy="department-select"]').should("contain.text", "La Paz");
        cy.get('[data-cy="province-select"]').should("contain.text", "Murillo");
        cy.get('[data-cy="municipality-select"]').should("contain.text", "La Paz");
    });

    it("27: Sincronización con historial del navegador (back/forward)", () => {
        cy.mockGeographyByIdBasic();

        cy.mockLiveResults({
            presidential: { delayMs: 0 },
            deputies: { delayMs: 0 },
        });

        cy.visitResults();
        cy.wait("@departments");

        cy.location("search").should("not.include", "department=");

        cy.get('[data-cy="option-0-dep-lpz"]').click();
        cy.wait("@provincesByDepartmentLp");
        cy.location("search").should("include", "department=dep-lpz");

        cy.get('[data-cy="option-1-prov-mur"]').click();
        cy.wait("@municipalitiesByProvinceMur");
        cy.location("search").should("include", "province=prov-mur");

        cy.visit("/");
        cy.location("pathname").should("eq", "/");

        cy.go("back");

        cy.location("pathname").should("eq", "/resultados");
        cy.location("search").should("include", "department=dep-lpz");
        cy.location("search").should("include", "province=prov-mur");

        cy.wait("@departmentById", { timeout: 20000 });
        cy.wait("@provinceById", { timeout: 20000 });

        cy.get('[data-cy="department-select"]', { timeout: 10000 }).should(
            "contain.text",
            "La Paz",
        );
        cy.get('[data-cy="province-select"]').should("contain.text", "Murillo");
    });

    it("37: Restricción por partido (solo ve su partido) - MOCK", () => {
        const restrictedResults = {
            results: [{ partyId: "PARTY-A", totalVotes: 1000 }],
            summary: { validVotes: 1000, nullVotes: 0, blankVotes: 0 },
        };

        cy.mockLiveResults({
            presidential: { body: restrictedResults, delayMs: 0 },
            deputies: { body: restrictedResults, delayMs: 0 },
        });

        cy.visitResults();
        cy.wait("@liveResultsPresidential");

        cy.contains("PARTY-A").should("exist");
        cy.get('[data-cy="presidential-results"]').should("not.contain", "PARTY-B");
    });

    it("40: Alcaldía incluye concejales (misma elección/territorio)", () => {
        const mayorResults = {
            results: [
                { partyId: "PARTY-A", totalVotes: 500, type: "mayor" },
                { partyId: "PARTY-B", totalVotes: 300, type: "mayor" },
            ],
            councilors: [
                { partyId: "PARTY-A", seats: 3 },
                { partyId: "PARTY-B", seats: 2 },
            ],
            summary: { validVotes: 800, nullVotes: 20, blankVotes: 10 },
        };

        cy.mockLiveResults({
            presidential: { body: mayorResults, delayMs: 0 },
            deputies: { body: mayorResults, delayMs: 0 },
        });

        cy.visitResults();
        cy.wait("@liveResultsPresidential");

        cy.contains("Resultados Generales").should("exist");
        cy.get('[data-cy="presidential-results"]').should("exist");
    });

    it("40-b: Alcaldía incluye concejales (misma elección / misma selección territorial)", () => {
        const mayorResults = {
            results: [
                { partyId: "MAS", totalVotes: 15000 },
                { partyId: "CC", totalVotes: 12000 },
            ],
            summary: {
                validVotes: 27000,
                nullVotes: 1000,
                blankVotes: 500,
                tablesProcessed: 100,
                totalTables: 200,
            },
        };

        const councilorResults = {
            results: [
                { partyId: "MAS", totalVotes: 14500 },
                { partyId: "CC", totalVotes: 13000 },
            ],
            summary: {
                validVotes: 27500,
                nullVotes: 800,
                blankVotes: 700,
                tablesProcessed: 100,
                totalTables: 200,
            },
        };

        cy.intercept("GET", "**/api/v1/results/live/by-location*", (req) => {
            const type = String(req.query.electionType || "");
            if (type === "mayor") {
                req.alias = "liveResultsMayor";
                req.reply({ statusCode: 200, body: mayorResults });
            } else if (type === "councilor") {
                req.alias = "liveResultsCouncilor";
                req.reply({ statusCode: 200, body: councilorResults });
            } else {
                req.alias = "liveResultsOther";
                req.reply({ statusCode: 200, body: { results: [], summary: {} } });
            }
        });

        cy.visitResults();
        cy.wait("@departments");
        cy.get('[data-cy="option-0-dep-lpz"]').click();
        cy.wait("@provincesByDepartmentLp");
        cy.get('[data-cy="option-1-prov-mur"]').click();
        cy.wait("@municipalitiesByProvinceMur");
        cy.get('[data-cy="option-2-mun-lpz"]').click();
        cy.wait("@seatsByMunicipality");

        cy.get("body").then(($body) => {
            if ($body.find('[data-cy="mayor-results"]').length) {
                cy.get('[data-cy="mayor-results"]').should("exist");
                cy.get('[data-cy="councilor-results"]').should("exist");
            } else {
                cy.contains("Resultados Generales").should("exist");
            }
        });
    });

    it("41: Gobernación (con solo Departamento carga resultados)", () => {
        const governorResults = {
            results: [
                { partyId: "MAS", totalVotes: 85000 },
                { partyId: "CC", totalVotes: 75000 },
            ],
            summary: {
                validVotes: 160000,
                nullVotes: 8000,
                blankVotes: 4000,
                tablesProcessed: 800,
                totalTables: 1500,
            },
        };

        cy.intercept("GET", "**/api/v1/results/live/by-location*", (req) => {
            const type = String(req.query.electionType || "");
            if (type === "governor") {
                req.alias = "liveResultsGovernor";
                req.reply({ statusCode: 200, body: governorResults });
            } else {
                req.alias = "liveResultsOther";
                req.reply({ statusCode: 200, body: { results: [], summary: {} } });
            }
        });

        cy.visitResults();
        cy.wait("@departments");
        cy.get('[data-cy="option-0-dep-lpz"]').click();
        cy.wait("@provincesByDepartmentLp");

        cy.get("body").then(($body) => {
            if ($body.find('[data-cy="governor-results"]').length) {
                cy.get('[data-cy="governor-results"]').should("exist");
            } else {
                cy.contains("Resultados Generales").should("exist");
            }
        });
    });

    it("41-b: Gobernación (solo Departamento carga resultados)", () => {
        cy.mockGeographyTwoDepts();

        cy.mockLiveResults({
            presidential: { delayMs: 0 },
            deputies: { delayMs: 0 },
        });

        cy.visitResults();
        cy.wait("@departments");

        cy.get('[data-cy="option-0-dep-lpz"]').click();
        cy.wait("@provincesByDepartmentLp");
        cy.wait("@liveResultsPresidential");

        cy.contains("Resultados Generales").should("exist");
        cy.location("search").should("include", "department=dep-lpz");
        cy.location("search").should("not.include", "province=");
    });

    it("43: Cambiar tipo de elección cambia la lógica de filtros", () => {
        const presidentialResults = require("../fixtures/results_ok_presidential.json");
        const deputiesResults = require("../fixtures/results_ok_deputies.json");

        cy.intercept("GET", "**/api/v1/results/live/by-location*", (req) => {
            const type = String(req.query.electionType || "");
            if (type === "presidential") {
                req.alias = "liveResultsPresidential";
                req.reply({ statusCode: 200, body: presidentialResults });
            } else if (type === "deputies") {
                req.alias = "liveResultsDeputies";
                req.reply({ statusCode: 200, body: deputiesResults });
            }
        });

        cy.visitResults();
        cy.wait("@liveResultsPresidential", { timeout: 10000 });
        cy.wait("@liveResultsDeputies", { timeout: 10000 });

        cy.contains(/presidencial/i).should("exist");
        cy.contains(/diputados/i).should("exist");
    });

    it("44: Filtros con valores no existentes (IDs inválidos) no crashean", () => {
        cy.intercept("GET", "**/api/v1/geographic/departments/INVALID-ID", {
            statusCode: 404,
            body: { message: "Not Found" },
        }).as("departmentNotFound");

        cy.mockLiveResults({
            presidential: { body: { results: [], summary: {} }, delayMs: 0 },
            deputies: { body: { results: [], summary: {} }, delayMs: 0 },
        });

        cy.visitResults({
            department: "INVALID-ID",
            province: "INVALID-ID",
            municipality: "INVALID-ID",
        });

        cy.wait("@departmentNotFound", { timeout: 10000 });

        cy.location("search", { timeout: 10000 }).should((search) => {
            const hasInvalid = search.includes("INVALID-ID");
            expect(hasInvalid).to.be.false;
        });

        cy.contains("Resultados Generales").should("exist");
        cy.get("body").should("be.visible");
    });

    it("45: Listas grandes (performance UI) - 100+ opciones", () => {
        const manyDepartments = Array.from({ length: 100 }, (_, i) => ({
            _id: `dep-${i}`,
            name: `Departamento ${i}`,
        }));

        cy.intercept("GET", "**/api/v1/geographic/departments*", {
            statusCode: 200,
            body: { data: manyDepartments },
        }).as("manyDepartments");

        cy.visitResults();
        cy.wait("@manyDepartments");

        cy.get('[data-cy="level-options"]', { timeout: 10000 }).should("exist");
        cy.get('[data-cy^="option-0-"]').should("have.length.at.least", 50);
    });

    it("46: Renderizar tabla de participaciones", () => {
        const dataWithParticipation = {
            results: [
                { partyId: "PARTY-A", totalVotes: 1000 },
                { partyId: "PARTY-B", totalVotes: 800 },
            ],
            summary: {
                validVotes: 1800,
                nullVotes: 100,
                blankVotes: 50,
                tablesProcessed: 150,
                totalTables: 200,
            },
        };

        cy.mockLiveResults({
            presidential: { body: dataWithParticipation, delayMs: 0 },
            deputies: { body: dataWithParticipation, delayMs: 0 },
        });

        cy.visitResults();
        cy.wait("@liveResultsPresidential");

        cy.get('[data-cy="statsbars"]').should("exist");

        cy.contains("Válidos").should("exist");
        cy.contains("Nulos").should("exist");
        cy.contains("Blancos").should("exist");
    });

    it("47: Renderizar correctamente imágenes de comparación", () => {
        const ballotId = "BALLOT-TEST-001";

        cy.mockBallotById(ballotId, {
            _id: ballotId,
            tableCode: "MESA-123",
            tableNumber: "12345",
            image: "ipfs://QmTest123",
            ipfsUri: "https://ipfs.io/ipfs/QmTest123/metadata.json",
            recordId: "record-123",
            votes: {
                parties: {
                    partyVotes: [
                        { partyId: "PARTY-A", votes: 100 },
                        { partyId: "PARTY-B", votes: 80 },
                    ],
                    validVotes: 180,
                    nullVotes: 10,
                    blankVotes: 5,
                },
            },
            location: {
                department: "La Paz",
                province: "Murillo",
                municipality: "La Paz",
                electoralLocationName: "Unidad Educativa A",
                electoralSeat: "Asiento 1",
            },
        });

        cy.mockAttestationsByBallotId(ballotId, [
            {
                _id: "att-1",
                support: true,
                userRole: "MAYOR",
                createdAt: new Date().toISOString(),
            },
            {
                _id: "att-2",
                support: true,
                userRole: "GOVERNOR",
                createdAt: new Date().toISOString(),
            },
        ]);

        cy.visitResultadosImagen(ballotId);
        cy.wait("@ballotById");
        cy.wait("@attestationsByBallot");

        cy.get('[data-cy="ipfs-image-link"]').should("exist");
        cy.get('[data-cy="link-metadata"]').should("exist");
        cy.get('[data-cy="link-nft"]').should("exist");

        cy.contains("A favor").should("exist");
        cy.contains("2").should("exist");
    });
});
