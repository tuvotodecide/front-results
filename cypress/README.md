# Cypress - Tu Voto Decide frontend

## Alcance

Cypress valida recorridos visibles criticos del frontend admin y publico con datos sinteticos. No valida backend real, persistencia, blockchain, Gemini, IPFS, Red Enlace, Firebase ni reglas internas del servidor.

## Categorias

| Categoria | Ruta | Ejecucion |
|---|---|---|
| Smoke activo | `cypress/e2e/smoke/**/*.cy.ts` | CI normal y PR |
| Staging | `cypress/staging/**/*.cy.ts` | Manual, con backend desplegado y seeds controlados |
| Legacy | `cypress/legacy/**/*.cy.ts` | No se ejecuta; conserva trazabilidad historica |

## Ejecucion local

```bash
pnpm cypress:verify
pnpm lint:cypress
pnpm typecheck:cypress
pnpm dev:next
pnpm test:cypress:smoke
```

Los smoke usan `CYPRESS_BASE_URL` si se necesita apuntar a otro host local. No deben requerir credenciales ni backend real.

## Specs activos

| Spec activo | Flujo matriz | Responsabilidad |
|---|---|---|
| `cypress/e2e/smoke/auth-and-guards.cy.ts` | Auth y sesion | Login mock, pending y sesion expirada/logout |
| `cypress/e2e/smoke/approvals.cy.ts` | Aprobaciones institucionales | Listado, detalle, accion representativa y error visible |
| `cypress/e2e/smoke/public-election.cy.ts` | Eleccion publica/padron/resultados | Landing publica, detalle, elegibilidad y detalle no disponible |
| `cypress/e2e/smoke/election-management.cy.ts` | Gestion de votaciones | Creacion, validacion visible, payload y navegacion |
| `cypress/e2e/smoke/padron.cy.ts` | Padron | Staging procesado, continuacion y error de carga |
| `cypress/e2e/smoke/publication-status.cy.ts` | Revision/publicacion/status | Readiness bloqueado, publicacion mock, exito y status |
| `cypress/e2e/smoke/results-reports.cy.ts` | Resultados/reportes | Resultados con fixture, filtro, auditoria y empty/error |

## Specs anteriores

| Spec anterior | Destino | Reemplazo | Motivo |
|---|---|---|---|
| `auth_resultados_canonica.cy.ts` | `cypress/legacy` | `smoke/auth-and-guards.cy.ts` | Reutilizado como base, reemplazado por smoke corto |
| `votacion_publica_canonica.cy.ts` | `cypress/legacy` | `smoke/public-election.cy.ts` | Reemplazado por recorrido publico deterministico |
| `votacion_privada_flujo_canonico.cy.ts` | `cypress/legacy` | `smoke/election-management.cy.ts`, `padron.cy.ts`, `publication-status.cy.ts` | Monolitico, dividido por dominio |
| `flujo_principal.cy.ts` | `cypress/legacy` | `smoke/auth-and-guards.cy.ts`, `public-election.cy.ts` | Compatibilidad cubierta por smokes actuales |
| `registro_admin_e2e.cy.ts` | `cypress/staging` | Fuera de CI normal | Requiere backend/seed |
| `resultadosNoAcceso.flow.real.cy.ts` | `cypress/staging` | `smoke/results-reports.cy.ts` | Dependia de datos reales |
| `results.filters.real.cy.ts` | `cypress/staging` | `smoke/results-reports.cy.ts` | Dependia de backend real |
| `Registro.real.cy.ts` | `cypress/legacy` | `smoke/auth-and-guards.cy.ts` | Rutas legacy y baja estabilidad |
| `admin.vistas.cy.ts` | `cypress/legacy` | `smoke/results-reports.cy.ts` | Visual legacy con waits |
| `NavegacionGobernadorLP.cy.ts` | `cypress/legacy` | `smoke/results-reports.cy.ts` | Visual frágil |
| `VerDetallesMesa.cy.ts` | `cypress/legacy` | `smoke/results-reports.cy.ts` | Navegacion masiva frágil |
| `filters.cy.ts`, `filters.role.cy.ts` | `cypress/legacy` | `smoke/results-reports.cy.ts` | Duplicados de filtros |
| `results.role.cy.ts` | `cypress/legacy` | `smoke/results-reports.cy.ts` y Vitest roles | Demasiado grande |
| `results.visual.1.cy.ts`, `results.visual.2.cy.ts` | `cypress/legacy` | `smoke/results-reports.cy.ts` | Visuales duplicados |
| `mesa.cy.ts`, `imagenesAlcaldeGobernador.cy.ts`, `ballots.cy.ts` | `cypress/legacy` | `smoke/results-reports.cy.ts` | Detalles cubiertos principalmente por Vitest |
| `reports.cy.ts` | `cypress/legacy` | `smoke/results-reports.cy.ts` | Mezclaba recorridos publicos y reportes |

## Reglas para nuevos smoke

- Usar `cy.intercept()` y fixtures sinteticos.
- No usar backend productivo ni datos reales.
- No usar `this.skip()`, `.only`, `.skip` ni waits arbitrarios.
- Preferir roles, labels, texto visible y atributos accesibles. Usar `data-testid` solo si no hay selector estable.
- Cada spec debe poder correr aislado, limpiar sesion y esperar aliases concretos.
- Los detalles exhaustivos de componentes deben quedar en Vitest.
