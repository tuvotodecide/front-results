// cypress/support/commands.ts

Cypress.Commands.add('clearSession', () => {
    cy.window().then((win) => {
        win.localStorage.clear();
    });
    cy.clearCookies();
    cy.clearLocalStorage();
});

Cypress.Commands.add('loginUI', (email: string, password: string = 'test1234') => {
    cy.visit('/login');
    cy.get('[data-cy="login-email"]', { timeout: 10000 }).type(email);
    cy.get('[data-cy="login-password"]', { timeout: 10000 }).type(password);
    cy.get('[data-cy="login-submit"]', { timeout: 10000 }).click();
});

Cypress.Commands.add('visitWithAuth', (url: string, { token, user }: { token: string; user: any }) => {
    cy.visit('/', {
        onBeforeLoad(win) {
            win.localStorage.setItem('token', token);
            win.localStorage.setItem('user', JSON.stringify(user));
        },
    });
    cy.visit(url);
});

Cypress.Commands.add('seedTestData', () => {
    // Implementar si es necesario seedear via API
    cy.log('Seeding test data');
});

Cypress.Commands.add('cleanupTestData', () => {
    // Implementar si es necesario limpiar via API
    cy.log('Cleaning up test data');
});

Cypress.Commands.add('loginUI2', (email: string, password: string = 'test1234') => {
    cy.loginUI(email, password);
});
