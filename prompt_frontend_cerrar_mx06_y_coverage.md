FRONTEND — CERRAR MX-06 Y UNIT COVERAGE

Trabaja solo en:

C:\apps\front-results

Rama:

new_feature_tokens

No cambiar rama, no reset/restore/clean/stash, no commit/push. No tocar matrices, mapas, workflows, App móvil ni Backend Identity. No usar skips, casts, @ts-ignore, bajar coverage ni excluir tests.

Estado conocido

Ya pasan localmente:

pnpm lint
pnpm build
pnpm test:matrix:02
pnpm test:matrix:03
pnpm test:matrix:04

No los repitas al inicio.

Primero corrige:

tests/integration/election-config-review-redesign.test.tsx

En torno a la línea 594, user está declarado y no se usa. Elimínalo o usa la instancia correcta; no lo renombres con _.

Después ejecuta:

pnpm typecheck:tests
pnpm test:matrix:06

MX-06: regla principal

Usa el output real de pnpm test:matrix:06 como fuente de verdad.

La mayoría de fallos son tests históricos contra la UI actual. No cambies producto solo para recuperar textos viejos. Actualiza tests con roles, labels y estados semánticos reales.

Corrige todos los archivos rojos de MX-06 por causa agrupada, no uno por uno.

Recarga QR

Archivo principal:

tests/integration/admin-tenant-recharge.test.tsx

Los tests buscan 4.2 TVD, pero la pantalla actual ya está en estados posteriores:

QR vencido
Procesando tokens
Requiere revisión
Tokens recibidos
Pago confirmado

No exijas cotización cuando el fixture inicia directamente en QR/estado terminal.

Para casos que sí prueban cotización, configura el mock inicial correcto y espera la cotización antes de generar QR.

Mantén separación entre:

estado del pago
estado de acreditación
saldo
txHash
referencia
polling

Contrato y parámetros Superadmin

tests/integration/superadmin-tvd-contracts-parameters.test.tsx

Actualizar expectativas a la UI real.

No exigir strings históricos como:

2 de 3 firmantes
Deshabilitadas

si la pantalla muestra la misma regla con otra estructura.

Afirmar semánticamente:

umbral
cantidad de firmantes
firmantes autorizados
tesorería multisig
campaña inexistente/deshabilitada
valores leídos
estado parcial y reintento

Asignación manual

tests/integration/superadmin-tvd-manual-assignment.test.tsx

La UI actual usa:

2 wallets disponibles
Continuar
direcciones de wallet
Elegible

No buscar:

2 wallet(s) disponible(s)
Revisar operación
FINANCE_ADMIN

Seleccionar la wallet por su dirección/rol accesible real, completar monto y motivo, y continuar por el flujo vigente.

Mantener validaciones de:

wallet no elegible
monto inválido
motivo
Idempotency-Key
NEEDS_REVIEW
sin txHash inventado

Operaciones

tests/integration/superadmin-tvd-operations.test.tsx

La tabla vacía indica mock/payload desalineado, no solo matcher.

Alinear el fixture al contrato actual del hook/API antes de afirmar institución, operaciones, paginación, tabla y cards móviles.

No cambiar producto para insertar filas ficticias.

Wallet lookup

tests/integration/superadmin-wallet-lookup.test.tsx

Actualizar copy histórico:

“verificar” → “consultar el detalle”
“Wallet registrada y asociada” → estado actual “Sí pertenece”
“Wallet no registrada/disponible” → estado actual “No pertenece”

No reducir la cobertura. Mantener:

no consulta al montar
validación de dirección
Authorization
sin x-api-key
sin tenant arbitrario
wallet asociada
registrada sin asociación
no registrada
error temporal
403
retry
limpieza de resultado anterior

Corregir también el mock del saldo: el DOM muestra Reintentar, lo que indica que la consulta de balance está cayendo en error. Para escenarios exitosos, devolver saldo válido.

Otros archivos MX-06

Revisa todos los FAIL restantes del mismo comando, incluyendo publicación oficial, capacidad, UI final y registros documentales.

No inventar IDs ni eliminar assertions. Si un test documental exige un ID realmente removido de la trazabilidad, primero verifica la fuente documental vigente; corrige el test o documento solo si pertenece al repositorio y la regla sigue vigente.

Ejecución optimizada

Haz todos los cambios estáticos.

Ejecuta juntos únicamente los archivos MX-06 que fallaron.

Corrige residuos por causa agrupada.

Ejecuta una sola vez:

pnpm test:matrix:06

No declares éxito hasta:

Test Files: todos PASS
Tests: todos PASS

Unit coverage

Solo después de MX-06 verde:

pnpm test:coverage

Si falla:

si hay tests rojos, corrige solo esos archivos;

si falla threshold, identifica archivo/líneas reales sin cobertura;

no bajes thresholds;

no agregues exclusiones;

no confundas coverage con MX-06.

Después de cualquier cambio de imports o producto, ejecutar al final una sola vez:

pnpm lint
pnpm typecheck
pnpm build

CI

No modifiques .github/workflows/main.yaml.

Los checks MX-02/MX-03/MX-04 que aparecen rojos en GitHub corresponden al commit ejecutado. Si pasan localmente con cambios aún no subidos, quedarán verdes recién después de commit/push y rerun del workflow.

Entrega:

Comando

Suites

Tests

Resultado

Estados permitidos:

FRONTEND_MX06_CORRECCION_EN_PROGRESO
FRONTEND_MX06_Y_COVERAGE_CORREGIDOS_Y_VERIFICADOS