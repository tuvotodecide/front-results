/// <reference types="cypress" />

describe('Flujos principales', () => {
  it('Hace scroll, hace clic y consulta un carnet válido', () => {
    cy.visit('/');
    cy.scrollTo('bottom', { duration: 500 });
    cy.contains('Consultar si estoy habilitado').should('be.visible').click();

    cy.get('input', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type('9896687{enter}');
  });

  it('Hace scroll, hace clic y consulta un carnet erróneo / inexistente', () => {
    cy.visit('/');
    cy.scrollTo('bottom', { duration: 500 });
    cy.contains('Consultar si estoy habilitado').should('be.visible').click();

    cy.get('input', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type('9999999999{enter}');
  });

  it('Hace scroll, hace clic y consulta un carnet con letras cruzadas', () => {
    cy.visit('/');
    cy.scrollTo('bottom', { duration: 500 });
    cy.contains('Consultar si estoy habilitado').should('be.visible').click();

    cy.get('input', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type('ABXCZTQ{enter}');
  });

  it('Hace scroll, hace clic y consulta un carnet de longitud excesiva', () => {
    cy.visit('/');
    cy.scrollTo('bottom', { duration: 500 });
    cy.contains('Consultar si estoy habilitado').should('be.visible').click();

    const textoLargo = 'ABCDEFGHI1234567890XYZ0987654321';
    cy.get('input', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(`${textoLargo}{enter}`);
  });

  it('Navega a información y consulta estado con carnet', () => {
    cy.visit('/');
    cy.scrollTo('bottom', { duration: 800 });
    cy.contains('Ver información').should('be.visible').click();
    cy.url().should('include', '/election');

    cy.contains('h2', 'CONSULTA SI ESTÁS', { timeout: 10000 })
      .scrollIntoView({ duration: 500 });

    cy.contains('button', 'Consultar mi estado').should('be.visible').click();

    cy.get('input', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type('9896687{enter}');
  });
});