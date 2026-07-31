FRONTEND — CORREGIR LOS TESTS ROJOS ACTUALES

Repositorio:

C:\apps\front-results

Rama:

new_feature_tokens

No tocar mapas, workflows, matrices, App móvil ni Backend Identity. No usar skips, casts, @ts-ignore, bajar coverage ni cambiar producto por defecto.

Ya están verdes:

typecheck:tests
public-results-navigation
test:modules:check
MX-03
lint
build

No repetirlos ahora.

Archivos rojos

tests/integration/access-approvals.test.tsx
tests/integration/admin-tenant-account.test.tsx
tests/unit/election-configuration-cd.test.tsx
tests/integration/election-config-review-redesign.test.tsx
tests/integration/election-dashboard-listing.test.tsx
tests/integration/admin-tenant-estimate-modal.test.tsx
tests/integration/superadmin-screens.test.tsx
tests/unit/padron-participation-check.test.tsx
tests/integration/election-status-redesign.test.tsx
tests/integration/election-status-more-menu.test.tsx
tests/integration/election-status-news-blockchain-tvd.test.tsx
tests/integration/participation-analytics-flow.test.tsx

Causas a corregir

Matchers históricos: textos, títulos o botones cambiaron. Antes de cambiar expectativas, verificar la regla funcional de la matriz y el DOM actual. Preferir roles, labels y aserciones semánticas; no copiar cadenas frágiles.

Provider faltante en superadmin-screens: usar helper común con Redux Provider/store o mockear completamente hooks RTK Query. No permitir requests reales.

Participation: Analíticas ya no está visible en la pestaña inicial. Navegar primero a Mas y luego abrir Analíticas, respetando permisos/tenant.

Active election:

aceptar acentos reales en “La votación finalizó”;

en estado vacío no exigir botón inexistente;

actualizar “Contrato inteligente público” al heading real Integridad verificable / Registro de la votación;

corregir mocks de Uso TVD para que no caigan en error.

Register: la vista actual usa Consultar mi estado; abrir esa acción y afirmar el modal/diálogo real, no el heading histórico Verificar participación.

MX-04:

fecha con fake timers sin timeout: restaurar timers y esperar actualización;

Capacidad TVD y mensajes históricos: comprobar el estado real actual (loading, insuficiente, suficiente, padrón no listo);

cancelación: asegurar fixture cancelable y usar la acción real; no inventar Eliminar.

MX-02:

aprobación: afirmar resultado real del mock/estado, no mensaje histórico si cambió;

cuenta: comprobar wallet/saldo/tenant semánticamente; no exigir Colegio Médico si el fixture actual no lo renderiza.

Estimate modal: afirmar datos visibles actuales (TVD requeridos, Saldo disponible, Faltante, botones) en vez de mensajes eliminados; mantener retry, doble submit y respuesta obsoleta.

No modificar producto salvo test correcto que demuestre una brecha real.

Ejecución

Después de corregir todo, ejecutar los 12 archivos juntos en un solo comando Vitest.

Si pasan, ejecutar una sola vez:

pnpm test:matrix:02
pnpm test:matrix:04
pnpm test:module:applications-remaining
pnpm test:module:register
pnpm test:module:active-election
pnpm test:module:participation

No ejecutar coverage todavía.

Solo cuando esos seis comandos estén verdes:

pnpm test:coverage

Entregar tabla de comandos, suites, tests y resultado. Estado esperado:

FRONTEND_MODULOS_AFECTADOS_CORREGIDOS