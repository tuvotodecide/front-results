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

Cypress.Commands.add('mockConfigStatus', (config) => {
    cy.intercept('GET', '**/api/v1/elections/config/status*', {
        statusCode: 200,
        body: config
    }).as('configStatus');
});

Cypress.Commands.add('mockLiveResults', ({ presidential, deputies }) => {
    const resultsOkPres = require('../fixtures/results_ok_presidential.json');
    const resultsOkDep = require('../fixtures/results_ok_deputies.json');

    if (presidential) {
        cy.intercept('GET', '**/api/v1/results/live/by-location*electionType=presidential*', (req) => {
            req.reply({
                statusCode: presidential.statusCode || 200,
                body: presidential.body || resultsOkPres,
                delay: presidential.delayMs || 0
            });
        }).as('liveResultsPresidential');
    }
    if (deputies) {
        cy.intercept('GET', '**/api/v1/results/live/by-location*electionType=deputies*', (req) => {
            req.reply({
                statusCode: deputies.statusCode || 200,
                body: deputies.body || resultsOkDep,
                delay: deputies.delayMs || 0
            });
        }).as('liveResultsDeputies');
    }
});

Cypress.Commands.add('mockConfig', (config) => {
    cy.intercept('GET', '**/api/v1/elections/config*', {
        statusCode: 200,
        body: config || require('../fixtures/elections_config.json')
    }).as('config');
});

Cypress.Commands.add('mockDepartments', () => {
    cy.intercept('GET', '**/api/v1/geographic/departments*', {
        statusCode: 200,
        body: {
            data: [
                { _id: 'dep-lpz', name: 'La Paz' },
                { _id: 'dep-cbba', name: 'Cochabamba' }
            ]
        }
    }).as('departments');
});

Cypress.Commands.add('visitResults', (query) => {
    const electionId = 'election-mock-1';
    cy.visit('/resultados', {
        onBeforeLoad(win) {
            win.localStorage.setItem('selectedElectionId', electionId);
        },
        qs: query
    });
});

Cypress.Commands.add('visitResultadosImagen', (id) => {
    const url = id ? `/resultados/imagen/${id}` : '/resultados/imagen';
    cy.visit(url);
});

Cypress.Commands.add('mockGeographyBasic', () => {
    cy.mockDepartments();
    cy.intercept('GET', '**/api/v1/geographic/provinces/by-department/dep-lpz*', {
        statusCode: 200,
        body: [{ _id: 'prov-mur', name: 'Murillo' }]
    }).as('provincesByDepartment');

    cy.intercept('GET', '**/api/v1/geographic/municipalities/by-province/prov-mur*', {
        statusCode: 200,
        body: [{ _id: 'mun-lpz', name: 'La Paz' }]
    }).as('municipalitiesByProvince');

    cy.intercept('GET', '**/api/v1/geographic/electoral-seats/by-municipality/mun-lpz*', {
        statusCode: 200,
        body: [{ _id: 'seat-1', name: 'Asiento 1' }]
    }).as('seatsByMunicipality');
});

Cypress.Commands.add('mockGeographyTwoDepts', () => {
    cy.mockDepartments();
    // La Paz
    cy.intercept('GET', '**/api/v1/geographic/provinces/by-department/dep-lpz*', {
        statusCode: 200,
        body: [{ _id: 'prov-mur', name: 'Murillo' }]
    }).as('provincesByDepartmentLp');
    cy.intercept('GET', '**/api/v1/geographic/municipalities/by-province/prov-mur*', {
        statusCode: 200,
        body: [{ _id: 'mun-lpz', name: 'La Paz' }]
    }).as('municipalitiesByProvinceMur');

    // Cochabamba
    cy.intercept('GET', '**/api/v1/geographic/provinces/by-department/dep-cbba*', {
        statusCode: 200,
        body: [{ _id: 'prov-cerc', name: 'Cercado' }]
    }).as('provincesByDepartmentCbba');

    cy.intercept('GET', '**/api/v1/geographic/electoral-seats/by-municipality/mun-lpz*', {
        statusCode: 200,
        body: []
    }).as('seatsByMunicipality');
});

Cypress.Commands.add('mockTableSearchOk', (data) => {
    cy.intercept('GET', '**/api/v1/geographic/tables/search*', {
        statusCode: 200,
        body: [data]
    }).as('tableSearch');
});

Cypress.Commands.add('mockBallotById', (id, body) => {
    cy.intercept('GET', `**/api/v1/ballots/${id}*`, {
        statusCode: 200,
        body: body
    }).as('ballotById');
});

Cypress.Commands.add('mockBallotNotFound', (id) => {
    cy.intercept('GET', `**/api/v1/ballots/${id}*`, {
        statusCode: 404,
        body: { message: `No se encontró la imagen "${id}"` }
    }).as('ballotById404');
});

Cypress.Commands.add('mockAttestationsByBallotId', (id, body) => {
    cy.intercept('GET', `**/api/v1/attestations/by-ballot/${id}*`, {
        statusCode: 200,
        body: body
    }).as('attestationsByBallot');
});

Cypress.Commands.add('mockGeographyByIdBasic', () => {
    cy.intercept('GET', '**/api/v1/geographic/departments/dep-lpz*', {
        statusCode: 200,
        body: { _id: 'dep-lpz', name: 'La Paz' }
    }).as('departmentById');
    cy.intercept('GET', '**/api/v1/geographic/provinces/prov-mur*', {
        statusCode: 200,
        body: { _id: 'prov-mur', name: 'Murillo' }
    }).as('provinceById');
    cy.intercept('GET', '**/api/v1/geographic/municipalities/mun-lpz*', {
        statusCode: 200,
        body: { _id: 'mun-lpz', name: 'La Paz' }
    }).as('municipalityById');
});

Cypress.Commands.add('mockGeographyLongNames', () => {
    const longName = "Departamento con un nombre extremadamente largo";
    cy.intercept('GET', '**/api/v1/geographic/departments*', {
        statusCode: 200,
        body: { data: [{ _id: 'dep-long', name: longName }] }
    }).as('departments');

    cy.intercept('GET', '**/api/v1/geographic/provinces/by-department/dep-long*', {
        statusCode: 200,
        body: [{ _id: 'prov-long', name: "Provincia con un nombre extremadamente largo" }]
    }).as('provincesByDepartmentLong');

    cy.intercept('GET', '**/api/v1/geographic/municipalities/by-province/prov-long*', {
        statusCode: 200,
        body: [{ _id: 'mun-long', name: "Municipio con un nombre extremadamente largo" }]
    }).as('municipalitiesByProvinceLong');

    cy.intercept('GET', '**/api/v1/geographic/electoral-seats/by-municipality/mun-long*', {
        statusCode: 200,
        body: []
    }).as('seatsByMunicipality');
});

Cypress.Commands.add('mockGeographyEmpty', () => {
    cy.intercept('GET', '**/api/v1/geographic/departments*', {
        statusCode: 200,
        body: { data: [] }
    }).as('departments');
});

Cypress.Commands.add('mockTablesByLocation', (config) => {
    cy.intercept('GET', '**/api/v1/geographic/tables/by-location*', {
        statusCode: config.statusCode || 200,
        body: config.body || []
    }).as('tablesByLocation');
});

Cypress.Commands.add('mockResultsBootstrap', () => {
    cy.mockConfig();
    cy.mockDepartments();
    cy.mockGeographyEmpty();

    cy.mockLiveResults({
        presidential: {
            body: require('../fixtures/results_ok_presidential.json'),
            delayMs: 0,
        },
        deputies: {
            body: require('../fixtures/results_ok_deputies.json'),
            delayMs: 0,
        },
    });
});
