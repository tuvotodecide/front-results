describe("Navegación Gobernador La Paz - Flujo Visual", () => {
    const governorEmail = 'gobernador@test.com';
    const governorPass = 'test1234';

    beforeEach(() => {
        cy.clearSession();
        cy.loginUI(governorEmail, governorPass);
        // El gobernador suele ser redirigido directamente a /resultados
        cy.url().should('include', '/resultados');
    });

    it("Flujo Guiado: Navegación por Resultados de La Paz", () => {
        const waitTime = 3000;

        // 1. Ver la pantalla inicial de resultados
        cy.log("Inicio de navegación para Gobernador");
        cy.wait(waitTime);

        // 2. Seleccionar Departamento La Paz
        // Como es Gobernador de LP, La Paz debería estar disponible o ya seleccionada
        cy.get('body').then(($body) => {
            const laPazBtn = $body.find('button:contains("La Paz")');
            if (laPazBtn.length > 0) {
                cy.wrap(laPazBtn).first().click({ force: true });
                cy.wait(waitTime);
            }
        });

        // 3. Seleccionar Provincia (ejemplo Murillo)
        cy.get('body').then(($body) => {
            const murilloBtn = $body.find('button:contains("Murillo")');
            if (murilloBtn.length > 0) {
                cy.wrap(murilloBtn).first().click({ force: true });
                cy.wait(waitTime);
            }
        });

        // 4. Seleccionar Municipio (ejemplo Nuestra Señora de La Paz)
        cy.get('body').then(($body) => {
            const munBtn = $body.find('button:contains("Nuestra Señora de La Paz")');
            if (munBtn.length > 0) {
                cy.wrap(munBtn).first().click({ force: true });
                cy.wait(waitTime);
            }
        });

        // 5. Navegar a otras vistas del menú lateral (Sidebar)

        // Resultados por mesa
        cy.contains('a', 'Resultados por mesa').click();
        cy.wait(waitTime);

        // Resultados por imagen
        cy.contains('a', 'Resultados por imagen').click();
        cy.wait(waitTime);

        // Auditoría TSE (solo si está habilitado para el rol)
        cy.get('aside').then(($aside) => {
            if ($aside.text().includes('Auditoría TSE')) {
                cy.contains('a', 'Auditoría TSE').click();
                cy.wait(waitTime);
            }
        });

        cy.log("Flujo visual completado éxito");
    });
});
