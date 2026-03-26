/// <reference types="cypress" />

describe('Automatización de Registro de Admin Institucional E2E', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3005/api/v1';
  
  let createdTenantId = '';
  const testEmail = 'e2e.voting@test.local';
  const testPassword = 'Test12345*';
  
  // Generaremos un token dinámico para evitar los errores 401 de token vencido/inválido
  let adminToken = '';

  before(() => {
    // Iniciamos sesión en background como Súper Admin para generar un Token Fresco.
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/login`,
      body: {
        email: 'pabloquispe19982ui@gmail.com',
        password: 'secret123'
      }
    }).then((resp) => {
      adminToken = resp.body.accessToken;
      cy.log('🔑 Token de Super Admin obtenido automáticamente.');
    });
  });

  // ATENCIÓN: MANTENGO LA LIMPIEZA COMENTADA
  // Para que el usuario e2e.voting@test.local no se borre cuando finalice la prueba y puedas testearlo manualmente en tu navegador sin que te salga "Credenciales inválidas"
  /*
  after(() => {
    cy.request({
      method: 'DELETE',
      url: `${apiUrl}/institutional-admin-applications/test/by-email/${testEmail}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      failOnStatusCode: false
    }).then(({ status }) => {
      cy.log(`🧹 Teardown completado: HTTP ${status}`);
    });
  });
  */

  it('Fase 0: Debe limpiar el usuario E2E y su organización antes de iniciar (si existieran)', () => {
    cy.log('Asegurando base de datos limpia antes de iniciar...');
    cy.request({
      method: "DELETE",
      url: `${apiUrl}/institutional-admin-applications/test/by-email/${encodeURIComponent(testEmail)}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      failOnStatusCode: false
    }).then(({ status }) => {
      cy.log(`🧹 Limpieza inicial completada: HTTP ${status}`);
    });
  });

  it('Fase 1: Debe rellenar la pantalla de registro y crear el usuario "Aprobado" por el endpoint para ingresar', () => {
    // 1. Visitamos la pantalla de registro
    cy.visit('/registrarse');

    // 2. Llenamos los campos del formulario para validar UI
    cy.get('[data-cy="register-dni"]').should('be.visible').type('E2E-12345');
    cy.get('[data-cy="register-name"]').should('be.visible').type('Usuario E2E');
    cy.get('[data-cy="register-email"]').should('be.visible').type(testEmail);
    cy.get('[data-cy="register-tenant-name"]').should('be.visible').type('Institucion E2E Cypress');
    cy.get('[data-cy="register-password"]').should('be.visible').type(testPassword);
    cy.get('[data-cy="register-confirm-password"]').should('be.visible').type(testPassword);

    cy.log('Llamando al endpoint test/approved-admin con el TOKEN DINÁMICO...');
    
    // 3. Mandamos los datos con tu Token al endpoint
    cy.request({
      method: 'POST',
      url: `${apiUrl}/institutional-admin-applications/test/approved-admin`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        dni: 'E2E-12345',
        name: 'Usuario E2E',
        email: testEmail,
        password: testPassword,
        institutionName: 'Institucion E2E Cypress'
      },
      failOnStatusCode: false 
    }).then(({ status, body }) => {
      // Validamos que sea 201(Creado exitosamente) o 409(Si el usuario quedó vivo de antes)
      expect([201, 409]).to.include(status);
      
      createdTenantId = body?.tenantId || body?.id || 'ya_existia';
      cy.log(`✅ Usuario E2E aprobado listo con código HTTP: ${status}`);

      // 4. Proceder al Login con las credenciales que se acaban de aprobar
      cy.visit('/login');
      
      cy.get('input[name="email"]', { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type(testEmail);
        
      cy.get('input[name="password"]')
        .should('be.visible')
        .clear()
        .type(testPassword);
        
      cy.contains('button', 'Iniciar Sesión')
        .should('be.visible')
        .click();

      // Verificar que el inicio de sesión pase
      cy.url({ timeout: 15000 }).should('not.include', '/login');
    });
  });

  it('Fase 2: Debe ejecutar el flujo completo de creación de una nueva votación con el admin recién creado', () => {
    // 1. Visitamos directamente el login
    cy.visit('/login');

    // 2. Rellenamos credenciales e iniciamos sesión (Cypress limpia la sesión local por cada test)
    cy.get('input[name="email"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(testEmail);
    cy.get('input[name="password"]')
      .should('be.visible')
      .clear()
      .type(testPassword);
    cy.contains('button', 'Iniciar Sesión').should('be.visible').click();

    // 3. Click en Nueva Votación
    cy.url({ timeout: 15000 }).should('include', '/elections');
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
    cy.contains(/Confirmar/i, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });
  });

  it('Fase 3: Debe continuar la configuración: creación de cargos, 2 partidos con candidatos y subir el padrón', () => {
    // 1. Visita la página principal y navega al login
    cy.visit('/');
    cy.contains('a', 'Iniciar Sesión').should('be.visible').click();
    cy.url().should('include', '/login');

    // Interceptar la llamada a la API para guardar candidatos para poder esperarla
    cy.intercept('PUT', '/api/v1/voting/events/*/options/*/candidates').as('replaceCandidates');

    // 2. Rellenar credenciales e iniciar sesión (USANDO EL USUARIO E2E)
    cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').type(testEmail);
    cy.get('input[name="password"]').should('be.visible').type(testPassword);
    cy.contains('button', 'Iniciar Sesión').should('be.visible').click();

    // 3. Navegar a la configuración de la votación
    cy.url().should('include', '/elections');
    cy.contains('h1', 'Mis Votaciones', { timeout: 10000 }).should('be.visible');
    // Clic en la primera votación (la que acabamos de crear en la prueba anterior)
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
    // Scroll suave hacia abajo
    cy.scrollTo('bottom', { duration: 1000 });

    cy.contains('button', 'Finalizar configuración', { timeout: 10000 })
      .should('be.visible')
      .click();
  });

  it('Fase 4: Debe eliminar el usuario de prueba E2E después de la suite para limpiar los datos', () => {
    cy.log('Limpiando base de datos después de la prueba...');
    cy.request({
      method: "DELETE",
      url: `${apiUrl}/institutional-admin-applications/test/by-email/${encodeURIComponent(testEmail)}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      failOnStatusCode: false
    }).then(({ status, body }) => {
      cy.log(`🧹 Limpieza final completada: HTTP ${status}`);
      if (status === 200) {
        cy.log(`Detalles: ${JSON.stringify(body)}`);
      }
    });
  });
});

