describe("Módulo Administrativo - Navegación y Búsqueda (Solo Visual)", () => {
    const adminEmail = 'admin.user@gmail.com';
    const adminPass = 'Swoosh7-Unwind6-Hunger4-Plentiful0-Krypton4';

    beforeEach(() => {
        cy.clearSession();
        cy.loginUI(adminEmail, adminPass);
        cy.url().should('not.include', '/login');
    });

    it("1. Flujo de Navegación y Búsqueda Geográfica", () => {
        const goBack = () => {
            cy.wait(1000); // Pausa para que el usuario vea el resultado
            cy.get('button[title="Volver"]').click();
        };

        // 1. Departamentos
        cy.visit("/panel");
        cy.contains('h2', 'Departamentos').click();
        cy.get('input[id="search"]').type("La Paz");
        cy.contains('button', 'Buscar').click();
        goBack();

        // 2. Provincias
        cy.contains('h2', 'Provincias').click();
        cy.get('input[id="search"]').type("Cochabamba");
        cy.contains('button', 'Buscar').click();
        goBack();

        // 3. Municipios
        cy.contains('h2', 'Municipios').click();
        cy.get('input[id="search"]').type("Cochabamba");
        cy.contains('button', 'Buscar').click();
        goBack();

        // 4. Asientos Electorales
        cy.contains('h2', 'Asientos Electorales').click();
        cy.get('input[id="search"]').type("Cochabamba");
        cy.contains('button', 'Buscar').click();
        goBack();

        // 5. Recintos Electorales
        cy.contains('h2', 'Recintos Electorales').click();
        cy.get('input[id="search"]').type("Cochabamba");
        cy.contains('button', 'Buscar').click();
        goBack();

        cy.contains('h1', 'Panel de Control').should('be.visible');
    });

    it("2. Verificación de Integridad y Recorrido del Sidebar", () => {
        const navWait = 3000; // Lapso de 3 segundos solicitado

        cy.visit("/panel");

        // 1. Inicio
        cy.contains('a', 'Inicio').click();
        cy.wait(navWait);

        // 2. Panel
        cy.contains('a', 'Panel').click();
        cy.wait(navWait);

        // 3. Resultados generales
        cy.contains('a', 'Resultados generales').click();
        cy.wait(navWait);

        // 4. Resultados por mesa
        cy.contains('a', 'Resultados por mesa').click();
        cy.wait(navWait);

        // 5. Resultados por imagen
        cy.contains('a', 'Resultados por imagen').click();
        cy.wait(navWait);

        // 6. Departamentos
        cy.contains('a', 'Departamentos').click();
        cy.wait(navWait);

        // 7. Provincias
        cy.contains('a', 'Provincias').click();
        cy.wait(navWait);

        // 8. Municipios
        cy.contains('a', 'Municipios').click();
        cy.wait(navWait);

        // 9. Asientos Electorales
        cy.contains('a', 'Asientos Electorales').click();
        cy.wait(navWait);

        // 10. Recintos Electorales
        cy.contains('a', 'Recintos Electorales').click();
        cy.wait(navWait);

        // 11. Mesas
        cy.contains('a', 'Mesas').click();
        cy.wait(navWait);

        // 12. Configuraciones
        cy.contains('a', 'Configuraciones').click();
        cy.wait(navWait);

        // 13. Partidos Políticos
        cy.contains('a', 'Partidos Políticos').click();
        cy.wait(navWait);

        cy.log("Recorrido de sidebar completado");
    });

    it("3. Verificación de Lógica de Breadcrumb (Filtros en Mesas)", () => {
        cy.visit("/mesas");

        // Esperamos a que cargue la vista
        cy.wait(3000);

        // Verificamos que el sistema de filtros (breadcrumb) esté visible
        // En tu código suele haber un botón de 'País' o contenedores de filtros
        cy.get('nav').should('be.visible');

        // Verificamos presencia de elementos clave del breadcrumb
        cy.contains('Bolivia').should('be.visible');
        cy.get('[data-cy="filters-reset"]').should('be.visible');

        // Pausa adicional para que el usuario verifique visualmente la ruta
        cy.wait(3000);
    });
});
