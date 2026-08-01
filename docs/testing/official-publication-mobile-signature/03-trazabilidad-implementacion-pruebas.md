# Trazabilidad - implementacion y pruebas

Estado: IMPLEMENTADO_PENDIENTE_EJECUCION_LOCAL

| Requisito | Regla | Sistema | Archivo productivo | Endpoint/funcion | IDs de casos | Archivo de test | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Crear solicitud oficial | Frontend envia solo eventId | Frontend Admin / Backend Results | `src/store/votingEvents/votingEventsEndpoints.ts`, `official-publication-admin.controller.ts` | POST requests | OPMS-FE-API-001, OPMS-BR-API-001 | `tests/unit/official-publication-api.test.ts`, `official-publication-api.service.unit.spec.ts` | IMPLEMENTED_PENDING_RUN |
| Derivar institucion | No aceptar institutionId cliente | Backend Results | `official-publication-preparation.service.ts`, `institutional-voting-access.service.ts` | `prepareOfficialPublication` | OPMS-BR-PRE-001, OPMS-BR-SEC-002 | `official-publication-preparation.service.unit.spec.ts` | IMPLEMENTED_PENDING_RUN |
| Calcular TVD | BigInt y spender TVDCredits | Backend Results | `tvd-blockchain.service.ts`, `tvd-abis.ts` | preflight TVD | OPMS-BR-TVD-001..006 | `tvd-blockchain.service.unit.spec.ts` | IMPLEMENTED_PENDING_RUN |
| Congelar snapshot | Padron una sola vez | Backend Results | `official-publication-preparation.service.ts`, `official-publication-artifacts.service.ts` | artifact snapshot | OPMS-BR-ART-001..006 | `official-publication-artifacts.service.unit.spec.ts` | IMPLEMENTED_PENDING_RUN |
| Maquina de estados | Version optimista e indices | Backend Results | `official-publication-request.schema.ts`, `official-publication-request.service.ts` | transition/claim/register | OPMS-BR-STATE-001..012 | `official-publication-request.service.unit.spec.ts` | IMPLEMENTED_PENDING_RUN |
| Notificacion al signer | Topico personal `user_<users._id>` | Backend Results / FCM | `official-publication-notification.service.ts` | enqueue/send | OPMS-BR-NOT-001..010 | `official-publication-notification.service.unit.spec.ts` | IMPLEMENTED_PENDING_RUN |
| Historial | `user_notifications` y `notification_logs` | Backend Results / Mobile | `users.controller.ts`, `UniversalHeader.js` | GET notifications | OPMS-MOB-NOT-001..010 | `NotificationDetailScreen.test.js` | IMPLEMENTED_PENDING_RUN |
| Detalle movil | Solo signer y smart account | Backend Results / Mobile | `official-publication-mobile.controller.ts`, `src/features/officialPublication` | GET detail | OPMS-MOB-API-001..006 | `officialPublicationRequest.test.js` | IMPLEMENTED_PENDING_RUN |
| Claim | Un dispositivo ejecutor | Backend Results / Mobile | `official-publication-api.service.ts` | POST claim | OPMS-MOB-CLAIM-001..006 | `official-publication-api.service.unit.spec.ts` | IMPLEMENTED_PENDING_RUN |
| Signing | Sin PIN/biometria adicional | Mobile | `src/features/officialPublication` | POST signing | OPMS-MOB-SIGN-001..004 | `officialPublicationScreen.test.js` | IMPLEMENTED_PENDING_RUN |
| Envio AA | Reutilizar Coinbase SA/Pimlico/paymaster | Mobile / Wira | `src/features/officialPublication`, `src/wallet/index.ts` | send with userOpHash | OPMS-AA-001..010 | `official-publication-blockchain.test.js` | IMPLEMENTED_PENDING_RUN |
| Outbox movil | No reenviar UserOperation | Mobile | `src/features/officialPublication/outbox` | sync outbox | OPMS-MOB-OUTBOX-001..008 | `official-publication-outbox.test.js` | IMPLEMENTED_PENDING_RUN |
| Submission | Solo registra hash | Backend Results / Mobile | `official-publication-mobile.controller.ts` | POST submission | OPMS-BR-SUB-001..008 | `official-publication-api.service.unit.spec.ts` | IMPLEMENTED_PENDING_RUN |
| Reconciliacion | Verificar userOp/receipt/eventos | Backend Results | `official-publication-chain-verification.service.ts` | verifySubmittedRequest | OPMS-BR-CHAIN-001..014 | `official-publication-chain-verification.service.unit.spec.ts` | IMPLEMENTED_PENDING_RUN |
| Worker | Locks, backoff y recuperacion | Backend Results | `official-publication-reconciliation.worker.ts` | process batch | OPMS-BR-WORKER-001..012 | `official-publication-reconciliation.worker.unit.spec.ts` | IMPLEMENTED_PENDING_RUN |
| Finalizacion | Idempotente y sin blockchain | Backend Results | `official-publication-finalization.service.ts` | finalizeOfficialPublication | OPMS-BR-FIN-001..010 | `official-publication-finalization.service.unit.spec.ts` | IMPLEMENTED_PENDING_RUN |
| Frontend polling | Estados activos y terminales | Frontend Admin | `useElectionPublish.ts`, `ElectionConfigReview.tsx` | polling status | OPMS-FE-STATE-001..014 | `use-election-publish.test.tsx` | IMPLEMENTED_PENDING_RUN |
| Cancelacion admin | Solo pre-submit | Frontend Admin / Backend Results | `ElectionConfigReview.tsx`, admin controller | POST cancel | OPMS-FE-CANCEL-001..004 | `election-publication-ux.test.tsx` | IMPLEMENTED_PENDING_RUN |
| E2E mock | Flujo completo sin FCM/blockchain real | Todos | multiples | flujo integral | OPMS-E2E-MOCK-001..004 | `official-publication-critical-flow.integration.spec.ts` | IMPLEMENTED_PENDING_RUN |
| E2E Base Sepolia | Validacion real con evidencias | Todos | scripts y plan | manual/sandbox | OPMS-E2E-SBX-001..010 | `06-plan-e2e-base-sepolia.md` | EXTERNAL_PENDING |
## Frontera legacy del frontend administrativo

| Caso | Frontera preservada | Estado |
| --- | --- | --- |
| `OPMS-FE-LEG-001` | `confirmOfficialPublication` y `publishEvent` se mantienen identificados como frontera legacy. El frontend administrativo nuevo debe utilizar el flujo documentado de solicitud, confirmacion movil y seguimiento de publicacion oficial. | DOCUMENTADO |
