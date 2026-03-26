/// <reference types="cypress" />

describe('Flujos principales', () => {
  it('Hace scroll, hace clic y consulta un carnet', () => {
    // 1. Visita la página principal
    cy.visit('/');

    // 2. Scroll suave hacia abajo
    cy.scrollTo('bottom', { duration: 500 });

    // 3. Clic en el botón de consulta
    cy.contains('Consultar si estoy habilitado')
      .should('be.visible')
      .click();

    // 4. Escribir el carnet en el input que aparece
    // NOTA: He usado [data-cy="dni-input"], cámbialo si tu input tiene otro nombre
    cy.get('input', { timeout: 10000 }) // Esperamos a que el input aparezca
      .should('be.visible')
      .type('9896687{enter}'); // Escribe el número y presiona la tecla Enter

    // 5. Verificación opcional (ajusta según lo que deba aparecer)
    // cy.contains('Habilitado').should('be.visible');
  });

  it('Navega a información y consulta estado con carnet', () => {
    // 1. Visita la página principal
    cy.visit('/');

    // 2. Scroll suave hacia abajo
    cy.scrollTo('bottom', { duration: 800 });

    // 3. Clic en el botón de "Ver información"
    cy.contains('Ver información')
      .should('be.visible')
      .click();

    // 4. Verificar que la URL cambió
    cy.url().should('include', '/election');

    // 5. Enfocar la sección de consulta y hacer scroll hacia ella
    // Esto soluciona el problema de que el header fijo oculte elementos.
    cy.contains('h2', 'CONSULTA SI ESTÁS', { timeout: 10000 })
      .scrollIntoView({ duration: 500 });

    // 6. Clic en el botón "Consultar mi estado"
    cy.contains('button', 'Consultar mi estado')
      .should('be.visible')
      .click();

    // 7. Escribir el carnet en el input del modal

    // 8. Hacer clic en el botón de verificar
    cy.get('input', { timeout: 10000 }) // Esperamos a que el input aparezca
      .should('be.visible')
      .type('9896687{enter}'); // Escribe el número y presiona la tecla Enter

  });


});