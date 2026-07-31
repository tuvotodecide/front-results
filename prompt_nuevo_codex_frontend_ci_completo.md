FRONTEND — ESTABILIZAR TODOS LOS TESTS ROJOS ACTUALES

Trabaja únicamente en:

C:\apps\front-results

Rama esperada:

new_feature_tokens

Antes de tocar nada:

git branch --show-current
git status --short

No cambies de rama. No uses reset, restore, clean, stash, commit ni push. Preserva todos los cambios ya hechos por otros agentes.

No toques:

App móvil
Backend Identity
matrices Markdown
tools/test-module-map.json
workflows
scripts de matrices

No uses:

test.skip
describe.skip
continue-on-error
as any
@ts-ignore
@ts-expect-error
reducción de coverage
exclusión de tests

Estado conocido

Ya pasaron y no deben repetirse al inicio:

pnpm lint
pnpm build
pnpm typecheck:tests
pnpm test:modules:check
pnpm test:matrix:03
tests/unit/public-results-navigation.test.tsx

Los grupos todavía rojos son:

pnpm test:matrix:02
pnpm test:matrix:04
pnpm test:module:applications-remaining
pnpm test:module:register
pnpm test:module:active-election
pnpm test:module:participation
pnpm test:coverage

Archivos con fallos conocidos

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

Primero inspecciona el diff actual y los tests. No deshagas correcciones previas que ya sean válidas.

Causas raíz que debes resolver

1. Matchers históricos desactualizados

Muchos tests siguen esperando textos o botones que ya no existen.

No cambies producto solo para recuperar copy viejo.

Actualiza los tests a la UI real usando:

roles accesibles
labels
headings reales
contenido semántico
estado visible

Evita cadenas frágiles por puntuación, tildes o abreviaciones.

Ejemplos conocidos:

“Colegio Médico”
“La solicitud quedó pendiente de autorización desde tu teléfono.”
“El saldo actual no cubre la estimación”
“La wallet tiene capacidad estimada para esta elección”
“Capacidad TVD”
“Eliminar”
“Firmante 1”
“Wallet no registrada”
“Contrato inteligente público”
“Verificar participación”
“Abrir resultados públicos”

Antes de cambiar una expectativa confirma qué regla funcional estaba probando.

2. Redux Provider / RTK Query

superadmin-screens.test.tsx y otros tests renderizan componentes con hooks RTK Query sin Provider o dejan requests reales.

Corrige con una sola estrategia coherente:

usar helper común con <Provider> y store de prueba; o

mockear completamente los hooks RTK Query cuando el test no evalúa transporte.

Los mocks deben devolver shapes reales:

data
isLoading
isFetching
isError
refetch
mutation(...).unwrap()

No permitir fetch real, RPC real ni incompatibilidades de AbortSignal.

3. MX-02

access-approvals.test.tsx

La aprobación debe afirmar el estado/feedback realmente producido por el mock actual, manteniendo la regla funcional de aprobar y rechazar.

No forzar un mensaje histórico.

admin-tenant-account.test.tsx

Comprobar semánticamente:

wallet activa del usuario
saldo real mockeado
tenant actual
ausencia de datos del tenant anterior

No depender de un nombre institucional no renderizado ni de una abreviación exacta.

4. MX-04

election-configuration-cd.test.tsx

Corregir fake timers, vi.setSystemTime, cleanup y timeout. Restaurar timers al finalizar.

election-config-review-redesign.test.tsx

Alinear mocks y expectativas con los estados actuales:

loading
capacidad suficiente
capacidad insuficiente
error/retry
padrón no listo

No exigir secciones o mensajes eliminados.

election-dashboard-listing.test.tsx

Usar un fixture realmente cancelable y la acción visible actual. No inventar botón Eliminar.

5. Applications residual

superadmin-screens.test.tsx

Corregir todos los casos restantes de:

Provider faltante
hooks no mockeados
requests reales
copy histórico
fixtures de contrato
parámetros
operaciones
wallet lookup
recuperación institucional

No declarar éxito mientras este archivo tenga un solo test rojo.

admin-tenant-estimate-modal.test.tsx

Probar la UI actual:

participantes estimados
TVD requeridos
saldo disponible
faltante
Crear votación
Crear borrador cuando corresponda
Recargar tokens
retry
doble submit
respuesta obsoleta

No exigir banners eliminados si la información funcional sigue visible.

6. Register residual

En padron-participation-check.test.tsx la vista pública actual usa:

Consultar mi estado

El modal real puede llamarse:

Consulta tu estado en el Padrón

y el campo:

Carnet de Identidad

Usa el flujo real: abrir acción, encontrar diálogo y campo, consultar.

No buscar el heading histórico Verificar participación.

7. Active election

election-status-redesign.test.tsx

aceptar el texto real con tildes;

no exigir botón inexistente en estado vacío;

mantener validación de tabs y resultados públicos.

election-status-more-menu.test.tsx

Para Uso TVD, corregir el mock para que el escenario válido no caiga en error.

Comprobar datos reales como:

500 $TVD
320 $TVD
180 $TVD
Liquidación completada

election-status-news-blockchain-tvd.test.tsx

La UI actual usa:

Integridad verificable
Registro de la votación
Contrato identificado
Elección registrada
Ver en BaseScan

No exigir manuales o textos legacy removidos.

8. Participation analytics

En participation-analytics-flow.test.tsx, Analíticas no está en la pestaña inicial.

El flujo correcto debe ser:

abrir tab “Mas”
→ elegir “Analíticas”
→ abrir modal
→ verificar datos/descarga

Mantener permisos:

usuario autorizado
tenant propio
tenant ajeno
usuario sin permiso
votación activa
finalizada
resultados publicados

No mostrar Analíticas globalmente para hacer pasar los tests.

Evita getByText ambiguo cuando un porcentaje aparece varias veces; usa getAllByText o scope semántico.

Estrategia de ejecución

Fase 1

Ejecuta únicamente:

pnpm vitest run tests/integration/superadmin-screens.test.tsx --reporter=verbose

Déjalo completamente verde primero porque concentra varias causas.

Fase 2

Ejecuta juntos todos los demás archivos que sigan rojos en un solo comando Vitest.

Corrige todos los residuos por causa agrupada.

No ejecutes archivos ya verdes.

Fase 3

Cuando la selección completa esté verde, ejecuta una sola vez:

pnpm test:matrix:02
pnpm test:matrix:04
pnpm test:module:applications-remaining
pnpm test:module:register
pnpm test:module:active-election
pnpm test:module:participation

Si un comando falla, corrige solo ese módulo y repítelo una vez.

Fase 4

Solo cuando los seis estén verdes:

pnpm test:coverage

Si coverage falla por tests, corrige esos tests. No reduzcas thresholds ni excluyas archivos.

Al final, si modificaste código productivo o imports, repite una sola vez:

pnpm lint
pnpm typecheck
pnpm build

Regla de cierre

No declares éxito si queda un solo test rojo.

Estado mientras haya fallos:

FRONTEND_CORRECCION_EN_PROGRESO

Estado final permitido:

FRONTEND_CI_CORREGIDO_Y_VERIFICADO

Entrega:

causas raíz agrupadas;

archivos modificados;

comandos ejecutados;

suites/tests PASS;

cualquier cambio productivo con prueba roja que lo justificó;

confirmación de que no se usaron skips, casts, reducción de coverage ni cambios de mapas/workflows.