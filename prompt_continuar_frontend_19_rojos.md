CONTINUAR CORRECCIÓN FRONTEND — 19 TESTS ROJOS

Continúa desde el estado actual de esta misma sesión.

Quedan:

19 tests rojos
79 verdes

Usa el último output Vitest como fuente de verdad.

Prioridad

Corrige únicamente los tests todavía rojos, especialmente:

tests/integration/superadmin-screens.test.tsx
flujos de Analíticas
mocks y expectativas de Uso TVD

Reglas

agrupa por causa raíz;

no tocar archivos verdes;

no modificar producto salvo brecha real demostrada;

no usar skips, casts, @ts-ignore;

no cambiar mapas, workflows ni matrices;

no ejecutar coverage todavía.

Ejecución

Ejecuta juntos todos los archivos todavía rojos.

Corrige los residuos por causa agrupada.

Repite solo esa selección.

Cuando quede verde, ejecuta una sola vez:

pnpm test:matrix:02
pnpm test:matrix:04
pnpm test:module:applications-remaining
pnpm test:module:register
pnpm test:module:active-election
pnpm test:module:participation

No repitas:

MX-03
lint
build
typecheck
archivos ya verdes

Solo cuando los seis comandos pasen:

pnpm test:coverage

Entrega:

causas raíz;

archivos modificados;

comandos ejecutados;

suites/tests PASS;

cambios productivos, si existieron.

Estado esperado:

FRONTEND_MODULOS_AFECTADOS_CORREGIDOS