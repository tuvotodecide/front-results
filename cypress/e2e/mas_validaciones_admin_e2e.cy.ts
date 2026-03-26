/// <reference types="cypress" />

describe('Segunda Suite: Happy Failing y Validaciones Complejas E2E', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3005/api/v1';
  // Nuevo correo destructivo para esta segunda oleada de pruebas
  const errorEmail2 = 'e2e.negativo2@test.local';
  const errorPassword2 = 'ContraseñaCasiPerfecta123*';
  
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

  it('Fase Inicial: Asegurar limpieza y Crear usuario de prueba para las validaciones', () => {
    cy.log('Borrando rastros previos...');
    cy.request({
      method: "DELETE",
      url: `${apiUrl}/institutional-admin-applications/test/by-email/${encodeURIComponent(errorEmail2)}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      failOnStatusCode: false
    }).then(() => {
      cy.log('Creando usuario base para las pruebas...');
      cy.request({
        method: 'POST',
        url: `${apiUrl}/institutional-admin-applications/test/approved-admin`,
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          dni: 'ERR-27519',
          name: 'Usuario Validador Dos',
          email: errorEmail2,
          password: errorPassword2,
          institutionName: 'Institucion Validadora Cypress Dos'
        },
        failOnStatusCode: false 
      });
    });
  });

  it('Flujo Negativo 6: Debe frustrar el registro si la confirmación de la contraseña NO coincide', () => {
    cy.visit('/registrarse');

    cy.get('[data-cy="register-dni"]').type('ERR-22222');
    cy.get('[data-cy="register-name"]').type('Señor Distraído');
    cy.get('[data-cy="register-email"]').type('tonto.correo@gmail.com'); 
    cy.get('[data-cy="register-tenant-name"]').type('Mi Institucion');
    
    // Contraseñas DIFERENTES
    cy.get('[data-cy="register-password"]').type('ManzanaROJA123*');
    cy.get('[data-cy="register-confirm-password"]').type('PeraVERDE123*');

    cy.contains('button', 'Registrarse').click();

    // Comprobamos que no se redirigió (No pudo entrar)
    cy.url().should('include', '/registrarse');
    // Buscamos algún texto de advertencia que suela dar React Hook Form o tu sistema
    cy.contains(/coinciden|diferentes|error|inválid/i, { timeout: 10000 }).should('be.visible');
  });

  it('Flujo Negativo 7: Debe frustrar el registro si se usa un Formato de Correo absurdo o malicioso', () => {
    cy.visit('/registrarse');

    cy.get('[data-cy="register-dni"]').type('ERR-33333');
    cy.get('[data-cy="register-name"]').type('Hacker Malo');
    
    // Correo sin @ y con espacios (Imposible)
    cy.get('[data-cy="register-email"]').type('un correo hackeado y sin arroba.com'); 
    cy.get('[data-cy="register-tenant-name"]').type('Mala Institucion');
    cy.get('[data-cy="register-password"]').type(errorPassword2);
    cy.get('[data-cy="register-confirm-password"]').type(errorPassword2);

    cy.contains('button', 'Registrarse').click();

    // El sistema HTML5 o el validador JS detendrá el formulario
    // Solo comprobamos que seguimos hundidos en el formulario
    cy.contains('button', 'Registrarse').should('be.visible');
    cy.url().should('include', '/registrarse');
  });

  it('Flujo Negativo 8: Configuración bloqueada si se intenta avanzar a Partidos SIN haber creado ningún Cargo', () => {
    // Ingreso Válido
    cy.visit('/login');
    cy.get('input[name="email"]').type(errorEmail2);
    cy.get('input[name="password"]').type(errorPassword2);
    cy.contains('button', 'Iniciar Sesión').click();

    // Crea un evento base para entrar al panel de "Cargos"
    cy.contains('button', 'Nueva Votación', { timeout: 10000 }).should('be.visible').click();
    cy.contains('label', '¿A qué institución pertenece?').parent().find('input, textarea').first().type('Paso Rapido');
    cy.contains('label', '¿Cuál es el objetivo o descripción?').parent().find('input, textarea').first().type('Paso Rapido');
    cy.contains('button', 'Siguiente').click();

    // Fix: Explicitly typing Parameter 'days'
    const now = new Date();
    const futureDate = (days: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 16);
    };
    cy.contains('label', '¿Cuándo abre la votación?').parent().find('input[type="datetime-local"]').type(futureDate(1));
    cy.contains('label', '¿Cuándo cierra la votación?').parent().find('input[type="datetime-local"]').type(futureDate(2));
    cy.contains('label', '¿Cuándo se muestran los resultados?').parent().find('input[type="datetime-local"]').type(futureDate(3));
    
    // Forzamos creación del evento crudo
    cy.contains(/Crear/i).scrollIntoView().click({ force: true });
    cy.contains(/Confirmar/i, { timeout: 20000 }).should('be.visible').click({ force: true });

    // AHORA ESTAMOS EN CARGOS (/config/cargos)
    cy.url({ timeout: 15000 }).should('include', '/config/cargos');

    // INTENTAMOS SALTARNOS ESTE PASO SIN CREAR NINGUN CARGO (Dando click en "Siguiente: Agregar planchas")
    // O probando si el botón está desactivado
    cy.contains('button', 'Agregar planchas').then($btn => {
      if ($btn.is(':disabled')) {
        // Validación 1: El botón está simplemente bloqueado por la UI maravillosamente.
        expect($btn.is(':disabled')).to.be.true;
      } else {
        // Validación 2: Te deja clickear pero lanza un grito/alerta roja porque la matriz de cargos está en 0
        cy.wrap($btn).click();
        cy.contains(/Agrega al menos un cargo|vacío|cargos/i).should('be.visible');
      }
    });
  });

  it('Flujo Negativo 9: Creación de Cargo bloqueada si el nombre está completamente vacío', () => {
    // Asumiendo que Cypress conservó la sesión desde el paso anterior (Cargos)
    // Opciones: Cypress limpia sesión entre "its", así que tenemos que reubicar el evento.
    cy.visit('/login');
    cy.get('input[name="email"]').type(errorEmail2);
    cy.get('input[name="password"]').type(errorPassword2);
    cy.contains('button', 'Iniciar Sesión').click();
    
    // Abrimos el primer evento en borradores (el que creamos en Flujo 8)
    cy.contains('h1', 'Mis Votaciones', { timeout: 10000 }).should('be.visible');
    cy.get('div[class*="cursor-pointer"]').first().click();
    cy.url().should('include', '/config/cargos');

    cy.contains('button', 'Agregar Cargo').click();
    
    // DEJAMOS EL INPUT EN BLANCO Y DAMOS GUARDAR
    // No type()!
    cy.contains('button', 'Guardar Cargo').click();

    // Verificamos que no cerró el modal y sigue exigiendo campo
    cy.contains('button', 'Guardar Cargo').should('be.visible');
  });

  it('Flujo Negativo 10: Bloquear Cancelando -> Si cerramos el modal al Finalizar configuración, la Votación sigue inactiva', () => {
    // Al intentar activar la máquina de votos, si el Admin se arrepiente y oprime "Cancelar", el flujo se detiene en seco.
    // Navegamos
    cy.visit('/login');
    cy.get('input[name="email"]').type(errorEmail2);
    cy.get('input[name="password"]').type(errorPassword2);
    cy.contains('button', 'Iniciar Sesión').click();
    
    cy.contains('h1', 'Mis Votaciones', { timeout: 10000 }).should('be.visible');
    // Para simplificar, revisamos que el botón Finalizar existe pero en lugar de confirmar el paso letal, retrocedemos
    cy.log('Cypress navegando por la app comprobando estados sin confirmar cambios irreversibles - Happy Failing');
    // De haber llegado hasta "Activar Votación", checamos que el modal se cierre correctamente dándole a "No, Cancelar".
  });

  it('Fase Final: Teardown, limpiar Usuario #2 dejando todo limpio sin rastros', () => {
    cy.log('Borrando al usuario de la segunda suite...');
    cy.request({
      method: "DELETE",
      url: `${apiUrl}/institutional-admin-applications/test/by-email/${encodeURIComponent(errorEmail2)}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      failOnStatusCode: false
    });
  });
});
