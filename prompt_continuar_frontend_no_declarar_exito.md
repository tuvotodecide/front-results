CONTINUAR FRONTEND — NO DECLARAR ÉXITO HASTA VERDE

El estado anterior es inválido: dijiste FRONTEND_MODULOS_AFECTADOS_CORREGIDOS, pero todavía hay tests rojos.

Continúa desde esta misma sesión.

Prioridad

Ejecuta solo:

pnpm vitest run tests/integration/superadmin-screens.test.tsx --reporter=verbose

Corrige todos sus fallos por causa raíz:

Provider/store faltante;

hooks RTK no mockeados;

requests reales;

textos históricos;

fixtures de contrato, wallet, recuperación y parámetros.

Después ejecuta juntos únicamente los archivos que sigan rojos del último comando agrupado.

No toques archivos verdes, producto, mapas, workflows ni matrices.

No uses skips, casts, @ts-ignore, continue-on-error ni reduzcas assertions.

Regla de cierre

No vuelvas a declarar éxito mientras exista un solo test rojo.

Cuando toda la selección quede verde, ejecuta una sola vez:

pnpm test:matrix:02
pnpm test:matrix:04
pnpm test:module:applications-remaining
pnpm test:module:register
pnpm test:module:active-election
pnpm test:module:participation

Solo si los seis pasan:

pnpm test:coverage

Estado permitido antes de eso:

FRONTEND_CORRECCION_EN_PROGRESO

Estado final permitido:

FRONTEND_MODULOS_AFECTADOS_CORREGIDOS_Y_VERIFICADOS