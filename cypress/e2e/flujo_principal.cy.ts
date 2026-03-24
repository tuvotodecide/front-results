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

  it('Flujo de inicio de sesión, creación de cargos, y creación de 2 partidos con candidatos', () => {
    // 1. Visita la página principal y navega al login
    cy.visit('/');
    cy.contains('a', 'Iniciar Sesión').should('be.visible').click();
    cy.url().should('include', '/login');

    // Interceptar la llamada a la API para guardar candidatos para poder esperarla
    cy.intercept('PUT', '/api/v1/voting/events/*/options/*/candidates').as('replaceCandidates');

    // 2. Rellenar credenciales e iniciar sesión
    cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').type('pabloquispe19982ui@gmail.com');
    cy.get('input[name="password"]').should('be.visible').type('secret123');
    cy.contains('button', 'Iniciar Sesión').should('be.visible').click();

    // 3. Navegar a la configuración de la votación
    cy.url().should('include', '/elections');
    cy.contains('h1', 'Mis Votaciones', { timeout: 10000 }).should('be.visible');
    cy.get('div[class*="cursor-pointer"]').first().click();
    cy.url().should('include', '/config/cargos');

    // 4. Crear 3 cargos
    const cargoNames = ['Presidente', 'Vicepresidente', 'Secretario'];
    cargoNames.forEach(cargoName => {
      cy.contains('button', 'Agregar Cargo', { timeout: 10000 }).should('be.visible').click();
      cy.get('input[placeholder="Ej. Presidente"]', { timeout: 5000 }).should('be.visible').type(cargoName);
      cy.contains('button', 'Guardar Cargo').should('be.visible').click();
      cy.contains(cargoName, { timeout: 10000 }).should('be.visible');
    });

    // 5. Navegar a la sección de planchas/partidos
    cy.contains('button', 'Siguiente: Agregar planchas y candidatos').should('be.visible').click();
    cy.url().should('include', '/config/planchas');

    // --- CREAR PRIMER PARTIDO Y SUS CANDIDATOS ---
    const partyName1 = `Partido Fenix ${Date.now()}`;
    cy.contains('button', 'Crear Partido', { timeout: 10000 }).should('be.visible').click();

    // Llenar datos del partido
    cy.get('input[placeholder="Ej: Movimiento Futuro"]', { timeout: 5000 }).should('be.visible').type(partyName1);
    cy.get('input[type="file"]').first().selectFile('C:\\Users\\WINDOWS\\Downloads\\prueba logos\\imagenPrueba1.jpg', { force: true });
    cy.contains('button', 'Guardar y Continuar').should('be.visible').click();

    // Llenar modal de candidatos
    cy.contains('h3', 'Gestión de Candidatos', { timeout: 10000 }).should('be.visible');
    cy.contains('div.p-4', 'Presidente').within(() => {
      cy.get('input[placeholder="Nombre completo"]').type('Candidato A1');
      cy.get('input[type="file"]').selectFile('C:\\Users\\WINDOWS\\Downloads\\prueba logos\\imagenPrueba3.jpg', { force: true });
    });
    cy.contains('div.p-4', 'Vicepresidente').within(() => {
      cy.get('input[placeholder="Nombre completo"]').type('Candidato A2');
      cy.get('input[type="file"]').selectFile('C:\\Users\\WINDOWS\\Downloads\\prueba logos\\imagenPrueba1.jpg', { force: true });
    });
    cy.contains('div.p-4', 'Secretario').within(() => {
      cy.get('input[placeholder="Nombre completo"]').type('Candidato A3');
      cy.get('input[type="file"]').selectFile('C:\\Users\\WINDOWS\\Downloads\\prueba logos\\imagenPrueba.jpg', { force: true });
    });
    // Guardar candidatos y esperar a que la API responda
    cy.contains('button', 'Guardar Candidatos').should('be.visible').click();
    cy.wait('@replaceCandidates', { timeout: 15000 });


    // 2. Clic en "Crear Partido" (debe estar habilitado tras cerrar el modal anterior)
    cy.contains('button', 'Crear Partido')
      .should('be.visible')
      .should('not.be.disabled')
      .click({ force: true });

    // 3. Validamos que el formulario de creación ya está listo para el siguiente
    const partyName2 = `Partido Omega ${Date.now()}`;
    cy.get('input[placeholder="Ej: Movimiento Futuro"]', { timeout: 5000 })
      .should('be.visible')
      .type(partyName2);

    cy.get('input[type="file"]').first().selectFile('C:\\Users\\WINDOWS\\Downloads\\prueba logos\\imagenPrueba1.jpg', { force: true });
    cy.contains('button', 'Guardar y Continuar').should('be.visible').click();

    // 4. Llenar modal de candidatos para el segundo partido
    cy.contains('h3', 'Gestión de Candidatos', { timeout: 10000 }).should('be.visible');
    cy.contains('div.p-4', 'Presidente').within(() => {
      cy.get('input[placeholder="Nombre completo"]').type('Candidato B1');
      cy.get('input[type="file"]').selectFile('C:\\Users\\WINDOWS\\Downloads\\prueba logos\\imagenPrueba.jpg', { force: true });
    });
    cy.contains('div.p-4', 'Vicepresidente').within(() => {
      cy.get('input[placeholder="Nombre completo"]').type('Candidato B2');
      cy.get('input[type="file"]').selectFile('C:\\Users\\WINDOWS\\Downloads\\prueba logos\\imagenPrueba1.jpg', { force: true });
    });
    cy.contains('div.p-4', 'Secretario').within(() => {
      cy.get('input[placeholder="Nombre completo"]').type('Candidato B3');
      cy.get('input[type="file"]').selectFile('C:\\Users\\WINDOWS\\Downloads\\prueba logos\\imagenPrueba3.jpg', { force: true });
    });

    // Guardar candidatos del segundo partido
    cy.contains('button', 'Guardar Candidatos').should('be.visible').click();
    cy.wait('@replaceCandidates', { timeout: 15000 });

    // 5. Navegar a la sección de Padrón Electoral
    cy.contains('button', 'Siguiente: Subir Padrón', { timeout: 10000 }).should('be.visible').click();
    cy.url().should('include', '/config/padron');


    // Interactuar con el input de tipo file para subir el CSV
    cy.get('input[type="file"]').first().selectFile('C:\\Users\\WINDOWS\\Downloads\\prueba logos\\Padron.csv', { force: true });

    // Clic en el botón para finalizar la subida del padrón
    cy.contains('button', 'Subir padrón')
      .should('be.visible')
      .should('not.be.disabled')
      .click();

    // 7. Finalizar configuración de la votación

    // 2. Scroll suave hacia abajo
    cy.scrollTo('bottom', { duration: 1000 });

    cy.contains('button', 'Finalizar configuración', { timeout: 10000 })
      .should('be.visible')
      .click();
  });
});