describe("Ver Detalles de Mesa - Flujo E2E", () => {
    const TABLE_CODE = "2050781";

    beforeEach(() => {
        cy.clearSession();
        // Interceptores para evitar fallos por red
        cy.intercept("GET", "**/api/v1/geographic/electoral-tables/table-code/*").as("getTable");
        cy.intercept("GET", "**/api/v1/ballots/by-table/*").as("getBallots");
    });

    it("Debe buscar una mesa y ver los detalles de su acta", () => {
        // 1. Ir a resultados por mesa
        cy.visit("/resultados/mesa");

        // 2. Buscar la mesa 2050781 como solicitó el usuario
        cy.get('[data-cy="image-search-input"]', { timeout: 10000 })
            .should('be.visible')
            .type(TABLE_CODE);

        cy.get('[data-cy="image-search-submit"]').click();

        // 3. Verificar que navegó al detalle o que aparece en resultados
        // Si el sistema navega directamente (comportamiento actual):
        cy.url().should('include', `/resultados/mesa/${TABLE_CODE}`);

        // Esperamos a que carguen los datos de la mesa y las actas
        // Nota: Si el backend no tiene esta mesa, el test fallará aquí, lo cual es correcto para E2E
        cy.wait("@getTable", { timeout: 20000 });
        cy.wait("@getBallots", { timeout: 20000 });

        // 4. Hacer clic en "Detalles" en la sección de actas (ImagesSection)
        cy.contains('Detalles', { timeout: 15000 })
            .should('be.visible')
            .click();

        // 5. Verificar que navegó al detalle de la imagen (acta)
        cy.url().should('include', '/resultados/imagen/');
    });
});
