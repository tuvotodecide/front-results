describe("Pruebas de Navegación Masiva por Departamentos", () => {

    beforeEach(() => {
        cy.clearSession();
    });

    // Lista de departamentos para generar las pruebas individualmente
    const departamentos = [
        "Chuquisaca",
        "La Paz",
        "Cochabamba",
        "Oruro",
        "Potosí",
        "Tarija",
        "Santa Cruz",
        "Beni",
        "Pando"
    ];

    departamentos.forEach((depto) => {
        it(`Departamento: ${depto.toUpperCase()} - Navegación hasta Recinto`, () => {
            cy.visit("/resultados");

            // Función auxiliar para hacer click en el departamento exacto
            const clickOptionByName = (name: string) => {
                cy.get('[data-cy="level-options"]', { timeout: 20000 })
                    .contains("button", new RegExp(`^${name}$`, "i"), { timeout: 15000 })
                    .should('be.visible')
                    .click({ force: true });
            };

            // 1. Seleccionar el Departamento por su nombre
            clickOptionByName(depto);

            // 2. Seleccionar la primera Provincia disponible
            cy.get('[data-cy="level-options"] button', { timeout: 15000 })
                .first()
                .should('be.visible')
                .click({ force: true });

            // 3. Seleccionar el primer Municipio disponible
            cy.get('[data-cy="level-options"] button', { timeout: 15000 })
                .first()
                .should('be.visible')
                .click({ force: true });

            // 4. Seleccionar el primer Asiento Electoral disponible
            cy.get('[data-cy="level-options"] button', { timeout: 15000 })
                .first()
                .should('be.visible')
                .click({ force: true });

            // 5. Seleccionar el primer Recinto disponible
            cy.get('[data-cy="level-options"] button', { timeout: 15000 })
                .first()
                .should('be.visible')
                .click({ force: true });

            // Verificación final de URL para confirmar que llegó al recinto
            cy.url().should('include', 'electoralLocation=');
        });
    });

    // Mantenemos el flujo específico de Arani/Pocoata al final
    it("Flujo Específico Cochabamba - Arani - Pocoata", () => {
        cy.visit("/resultados");

        const clickOption = (text: string) => {
            cy.get('[data-cy="level-options"]', { timeout: 20000 })
                .contains("button", new RegExp(`^${text}$`, "i"), { timeout: 15000 })
                .should('be.visible')
                .click({ force: true });
        };

        clickOption("Cochabamba");
        clickOption("Arani");
        clickOption("Arani");
        clickOption("Pocoata");

        cy.get('[data-cy="table-search-input"]', { timeout: 15000 })
            .should('be.visible')
            .type("escuela mixta pocoata");

        cy.get('[data-cy="level-options"] button', { timeout: 15000 })
            .first()
            .click({ force: true });
    });
});
