# Resumen de cobertura

Estado global: IMPLEMENTADO_PENDIENTE_EJECUCION_LOCAL  
E2E real: E2E_REAL_BASE_SEPOLIA_PENDING

## Totales

| Dimension | Total |
| --- | ---: |
| Casos de matriz | 160 |
| Automatizables implementados pendientes de ejecucion | 137 |
| Manual only | 8 |
| External pending | 15 |
| E2E mocked | 6 |
| E2E sandbox/Base Sepolia pendiente | 6 |

## Por sistema

| Sistema | Casos |
| --- | ---: |
| Backend Results | 87 |
| Frontend Admin | 17 |
| Aplicacion movil | 26 |
| Backend Identity | 6 |
| Firebase/FCM | 6 |
| Wira/AA/Pimlico/Paymaster | 6 |
| Contratos/Base Sepolia | 6 |
| E2E mock/sandbox transversal | 6 |

## Por tipo

| Tipo | Casos |
| --- | ---: |
| UNIT | 60 |
| COMPONENT | 14 |
| INTEGRATION | 18 |
| API_CONTRACT | 18 |
| ACCEPTANCE | 0 |
| SECURITY | 21 |
| CONCURRENCY | 9 |
| RECOVERY | 9 |
| RESILIENCE | 6 |
| E2E_MOCKED | 6 |
| E2E_SANDBOX | 1 |

## Por prioridad

| Prioridad | Casos |
| --- | ---: |
| P0 | 128 |
| P1 | 25 |
| P2 | 7 |

## Por estado de automatizacion

| Estado | Casos |
| --- | ---: |
| IMPLEMENTED_PENDING_RUN | 137 |
| MANUAL_ONLY | 8 |
| EXTERNAL_PENDING | 15 |

## Seguridad

Se auditaron los terminos: `privateKey`, `mnemonic`, `seed`, `PIN`, `biometric`, `DNI`, `carnet`, `callData`, `nullifier`, `fcmToken`, `rpcUrl`, `Pimlico`, `paymaster`, `encryptedPayload` y `authTag`.

Hallazgos documentales:

- El push oficial no debe incluir DNI/carnet, callData, roots, nullifiers ni token FCM.
- El historial no debe exponer payload cifrado ni datos contractuales sensibles.
- El cliente no puede seleccionar institutionId, signer, costos, roots, target, callData ni status.
- El topico personal es canal canonico, no prueba de token unico.
- La vista/no vista es local por decision funcional.
- El EntryPoint debe ser confirmado antes del E2E real por discrepancia documental v0.6/v0.7 detectada en codigo Wira.
