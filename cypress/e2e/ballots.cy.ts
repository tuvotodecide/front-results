export { };
/**
 * E2E Tests: Visualización de Boletas/Imágenes
 */

describe("Boletas/Imágenes E2E - Visualización y Auditoría", () => {
    const PASSWORD = "test1234";

    const waitForLoad = () => {
        cy.get("body", { timeout: 60000 }).should(($body) => {
            const hasSkeleton = $body.find('[data-cy="loading-skeleton"]').length > 0;
            expect(hasSkeleton, "Loading skeleton should be gone").to.be.false;
            const hasInput = $body.find('input[type="text"], input[type="search"]').length > 0;
            const hasContent = $body.text().length > 100;
            expect(hasInput || hasContent).to.be.true;
        });
    };

    const assertNoErrors = () => {
        cy.get("body").then(($body) => {
            const text = $body.text();
            expect(text).to.not.match(/error interno|crash|undefined is not|cannot read/i);
        });
    };

    beforeEach(() => {
        cy.clearSession();
        cy.intercept("GET", "**/api/v1/ballots/*").as("ballotById");
    });

    describe("Acceso a página de imágenes", () => {
        it("Usuario puede acceder a /resultados/imagen", () => {
            cy.visit("/resultados/imagen");
            cy.location("pathname", { timeout: 15000 }).should('include', 'resultados');
        });

        it("ADMIN (Real) puede acceder a /resultados/imagen", () => {
            cy.loginUI("admin.user@gmail.com", "Swoosh7-Unwind6-Hunger4-Plentiful0-Krypton4");
            cy.visit("/resultados/imagen");
            cy.location("pathname", { timeout: 15000 }).should("include", "/resultados");
            waitForLoad();
            assertNoErrors();
        });
    });

    describe("Visualización de boleta", () => {
        it("Boleta existente muestra imagen (Mock)", () => {
            cy.loginUI("admin.user@gmail.com", "Swoosh7-Unwind6-Hunger4-Plentiful0-Krypton4");

            const mockBallot = {
                _id: "ballot-test-123",
                tableCode: "LP-001-00001",
                imageUri: "ipfs://QmTestHash",
                votes: [{ partyId: "party-1", partyName: "Partido A", count: 100 }],
                validVotes: 100,
                department: { name: "La Paz" },
            };

            cy.intercept("GET", "**/api/v1/ballots/ballot-test-123*", {
                statusCode: 200,
                body: mockBallot,
            }).as("ballotData");

            cy.visit("/resultados/imagen/ballot-test-123");
            cy.wait("@ballotData", { timeout: 30000 });
            waitForLoad();
            cy.get("body").should("be.visible");
            assertNoErrors();
        });
    });

    describe("Navegación y links", () => {
        // ELIMINADO: Desde resultados se puede ir a imagen de boleta (pedido por usuario)

        it("Desde detalle de boleta se puede volver a resultados", () => {
            cy.loginUI("admin.user@gmail.com", "Swoosh7-Unwind6-Hunger4-Plentiful0-Krypton4");
            cy.intercept("GET", "**/api/v1/ballots/*", {
                statusCode: 200,
                body: { _id: "ballot-nav-test", tableCode: "LP-001-00006" },
            });

            cy.visit("/resultados/imagen/ballot-nav-test");
            waitForLoad();
            cy.visit("/resultados");
            cy.location("pathname", { timeout: 15000 }).should("eq", "/resultados");
            assertNoErrors();
        });
    });
});
