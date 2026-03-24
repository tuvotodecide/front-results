/// <reference types="cypress" />

describe('Creación de Votación', () => {
    it('Flujo completo de creación de una nueva votación', () => {
        // 1. Visita la página principal y navega al login
        cy.visit('/');
        cy.contains('a', 'Iniciar Sesión').should('be.visible').click();
        cy.url().should('include', '/login');

        // 2. Rellenar credenciales e iniciar sesión 
        cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').type('pabloquispe19982ui@gmail.com');
        cy.get('input[name="password"]').should('be.visible').type('secret123');
        cy.contains('button', 'Iniciar Sesión').should('be.visible').click();

        // 3. Click en Nueva Votación
        cy.url().should('include', '/elections');
        cy.contains('button', 'Nueva Votación', { timeout: 10000 })
            .should('be.visible')
            .click();

        // 4. Llenar primer paso (Información básica)
        cy.contains('label', '¿A qué institución pertenece?')
            .parent()
            .find('input, textarea')
            .first()
            .type('Universidad Tecnológica de Prueba');

        cy.contains('label', '¿Cuál es el objetivo o descripción?')
            .parent()
            .find('input, textarea')
            .first()
            .type('Esta es una votación de prueba creada automáticamente por Cypress.');

        cy.contains('button', 'Siguiente').should('be.visible').click();

        // 5. Llenar segundo paso (Fechas y horas)
        // Definimos fechas futuras
        const now = new Date();
        const futureDate = (days: number) => {
            const date = new Date(now);
            date.setDate(date.getDate() + days);
            return date.toISOString().slice(0, 16); // Formato YYYY-MM-DDTHH:MM
        };

        const fechaApertura = futureDate(1);
        const fechaCierre = futureDate(2);
        const fechaResultados = futureDate(2);

        cy.contains('label', '¿Cuándo abre la votación?')
            .parent()
            .find('input[type="datetime-local"]')
            .type(fechaApertura);

        cy.contains('label', '¿Cuándo cierra la votación?')
            .parent()
            .find('input[type="datetime-local"]')
            .type(fechaCierre);

        cy.contains('label', '¿Cuándo se muestran los resultados?')
            .parent()
            .find('input[type="datetime-local"]')
            .type(fechaResultados);

        // 6. Crear y confirmar
        cy.contains(/Crear/i, { timeout: 15000 })
            .scrollIntoView()
            .should('be.visible')
            .click({ force: true });

        // Modal de confirmación final
        // Buscamos directamente el botón o texto de "Confirmar", que es lo más importante
        cy.contains(/Confirmar/i, { timeout: 20000 })
            .should('be.visible')
            .click({ force: true });


    });
});
