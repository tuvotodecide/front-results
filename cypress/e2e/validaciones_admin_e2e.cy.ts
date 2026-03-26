/// <reference types="cypress" />

describe('Validaciones y Casos Negativos de Admin Institucional E2E', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3005/api/v1';
  // Usamos un correo diferente para no chocar con tu script principal de éxito
  const errorEmail = 'e2e.negativo@test.local';
  const errorPassword = 'TestDefinitivo123*';
  
  let adminToken = '';

  before(() => {
    // Generar Token Súper Admin Fresco
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/login`,
      body: { email: 'pabloquispe19982ui@gmail.com', password: 'secret123' }
    }).then((resp) => {
      adminToken = resp.body.accessToken;
    });
  });

  it('Fase Inicial: Limpiar rastro anterior y Crear el usuario de prueba para las validaciones', () => {
    cy.log('Borrando cualquier rastro de usuario que interrumpa la prueba...');
    cy.request({
      method: "DELETE",
      url: `${apiUrl}/institutional-admin-applications/test/by-email/${encodeURIComponent(errorEmail)}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      failOnStatusCode: false
    }).then(() => {
      cy.log('Inyectando usuario silenciosamente...');
      cy.request({
        method: 'POST',
        url: `${apiUrl}/institutional-admin-applications/test/approved-admin`,
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          dni: 'ERR-77777',
          name: 'Usuario Validador',
          email: errorEmail,
          password: errorPassword,
          institutionName: 'Institucion Validadora Cypress'
        },
        failOnStatusCode: false 
      });
    });
  });

  it('Flujo Negativo 1: Debe rechazar el login cuando las credenciales son incorrectas', () => {
    cy.visit('/login');
    // Metemos datos inventados y malos
    cy.get('input[name="email"]').type('correo_imposible@test.com');
    cy.get('input[name="password"]').type('contraseñaMal12');
    cy.contains('button', 'Iniciar Sesión').click();

    // Verificamos que LA URL NO CAMBIA (sigue en el login)
    cy.url().should('include', '/login');
    // Verificamos que aparece algún mensaje o alerta roja de error (Credenciales inválidas)
    cy.contains(/No se pudo iniciar sesión|Error|inválid|incorrect/i, { timeout: 10000 }).should('be.visible');
  });

  it('Flujo Negativo 2: Debe bloquear el acceso a URLs protegidas si NO está logueado', () => {
    // El usuario "limpia" sus cookies al cambiar de test, así que aquí no está logueado
    // Intentamos entrar como hacker directamente al dashboard
    cy.visit('/elections');
    
    // El sistema debe detectarlo y patearlo de vuelta al login
    cy.url().should('include', '/login');
  });

  it('Flujo Negativo 3: No debe permitir avanzar en Nueva Votación si faltan campos obligatorios', () => {
    // Iniciamos sesión válidamente
    cy.visit('/login');
    cy.get('input[name="email"]').type(errorEmail);
    cy.get('input[name="password"]').type(errorPassword);
    cy.contains('button', 'Iniciar Sesión').click();

    cy.contains('button', 'Nueva Votación', { timeout: 10000 }).should('be.visible').click();

    // Damos click a "Siguiente" SIN haber llenado Institución ni Descripción
    cy.contains('button', 'Siguiente').click();

    // Verificamos que NO nos dejó avanzar. ¿Cómo lo sabemos? Porque seguimos viendo la pregunta "Institución"
    cy.contains('label', '¿A qué institución pertenece?').should('be.visible');
    cy.contains('h2', 'Fechas y horas').should('not.exist');
  });

  it('Flujo Negativo 4: Debe rechazar guardar una elección si ponemos fechas invertidas (Cierre en el pasado)', () => {
    // Reingresamos y pasamos la pantalla 1
    cy.visit('/login');
    cy.get('input[name="email"]').type(errorEmail);
    cy.get('input[name="password"]').type(errorPassword);
    cy.contains('button', 'Iniciar Sesión').click();

    cy.contains('button', 'Nueva Votación', { timeout: 10000 }).should('be.visible').click();
    
    cy.contains('label', '¿A qué institución pertenece?')
      .parent().find('input, textarea').first().type('Test Institución');
    cy.contains('label', '¿Cuál es el objetivo o descripción?')
      .parent().find('input, textarea').first().type('Motivo cualquiera');
    
    cy.contains('button', 'Siguiente').click();

    // CREAMOS FECHAS ILÓGICAS
    const now = new Date();
    // Ponemos que abrió hoy, pero que cerró hace 5 días (IMPOSIBLE)
    const aperturaValida = new Date(now).toISOString().slice(0, 16);
    const cierreImposible = new Date(now.setDate(now.getDate() - 5)).toISOString().slice(0, 16);
    const resultados = new Date(now.setDate(now.getDate() + 1)).toISOString().slice(0, 16);

    cy.contains('label', '¿Cuándo abre la votación?').parent().find('input[type="datetime-local"]').type(aperturaValida);
    cy.contains('label', '¿Cuándo cierra la votación?').parent().find('input[type="datetime-local"]').type(cierreImposible);
    cy.contains('label', '¿Cuándo se muestran los resultados?').parent().find('input[type="datetime-local"]').type(resultados);

    cy.contains(/Crear/i).scrollIntoView().click({ force: true });

    // La UI debería tener validaciones HTML5 nativas o JS que evitan que salte la pantalla.
    // Nosotros simplemente confirmamos que NO aparece el Modal final o la ruta no cambia a configuración
    cy.contains(/Confirmar/i).should('not.exist');
  });

  it('Flujo Negativo 5: Debe restringir el registro si el correo o el DNI ya fue usado en la app', () => {
    // Navegamos al registro
    cy.visit('/registrarse');

    // Llenamos con el MISMO DNI y EMAIL que ya metimos en la Fase Intermedia
    cy.get('[data-cy="register-dni"]').type('ERR-77777');
    cy.get('[data-cy="register-name"]').type('Tonto Intento Doble');
    cy.get('[data-cy="register-email"]').type(errorEmail); // CORREO DUPLICADO
    cy.get('[data-cy="register-tenant-name"]').type('Misma Institucion');
    cy.get('[data-cy="register-password"]').type(errorPassword);
    cy.get('[data-cy="register-confirm-password"]').type(errorPassword);

    // Intentamos hacer clic al botón REAL de tu UI (Registrarse)
    cy.contains('button', 'Registrarse').click();

    // Verificamos que el servidor nos rebota y aparece un mensaje de conflicto / error de email
    cy.contains(/ya existe|registrado|error|conflicto/i, { timeout: 10000 }).should('be.visible');
  });

  it('Fase Final: Teardown, limpieza profunda de los rastros de la prueba negativa', () => {
    cy.log('Eliminando al usuario validador para mantener todo limpio...');
    cy.request({
      method: "DELETE",
      url: `${apiUrl}/institutional-admin-applications/test/by-email/${encodeURIComponent(errorEmail)}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      failOnStatusCode: false
    }).then(({ status }) => {
      cy.log(`🧹 Teardown Negativo completado: HTTP ${status}`);
    });
  });
});
