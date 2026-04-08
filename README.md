# Tu Voto Decide Frontend

Frontend web de Tu Voto Decide. La aplicación productiva actual corre sobre **Next.js App Router** y su superficie canónica está organizada por dominios.

## Artefacto productivo

- Runtime principal: **Next.js**
- Build productivo: `npm run build`
- Start productivo: `npm start`
- Artefacto de despliegue: **`.next`** y, para contenedores, **`.next/standalone`**

Los scripts y entrypoints de Vite/React Router se conservan solo como **legacy/compat**, no como la app principal de producción.

## Superficie canónica actual

### Resultados

- `/`
  redirige a `/resultados`
- `/resultados`
- `/resultados/mesa`
- `/resultados/mesa/[tableCode]`
- `/resultados/imagen`
- `/resultados/imagen/[id]`

### Auth resultados

- `/resultados/login`
- `/resultados/registrarse`
- `/resultados/verificar-correo`
- `/resultados/pendiente`
- `/resultados/rechazado`
- `/resultados/recuperar`
- `/resultados/restablecer`

### Resultados privado/admin

- `/resultados/control-personal`
- `/resultados/auditoria-tse`
- `/resultados/panel`
- `/resultados/configuraciones`
- `/resultados/configuraciones/nuevo`
- `/resultados/configuraciones/editar/[id]`
- `/resultados/partidos`
- `/resultados/partidos/nuevo`
- `/resultados/partidos/editar/[id]`
- `/resultados/partidos-politicos`
- `/resultados/partidos-politicos/nuevo`
- `/resultados/partidos-politicos/editar/[id]`
- `/resultados/departamentos`
- `/resultados/departamentos/nuevo`
- `/resultados/departamentos/editar/[id]`
- `/resultados/provincias`
- `/resultados/provincias/nuevo`
- `/resultados/provincias/editar/[id]`
- `/resultados/municipios`
- `/resultados/municipios/nuevo`
- `/resultados/municipios/editar/[id]`
- `/resultados/asientos-electorales`
- `/resultados/asientos-electorales/nuevo`
- `/resultados/asientos-electorales/editar/[id]`
- `/resultados/recintos-electorales`
- `/resultados/recintos-electorales/nuevo`
- `/resultados/recintos-electorales/editar/[id]`
- `/resultados/mesas`
- `/resultados/mesas/nuevo`
- `/resultados/mesas/editar/[id]`

### Votación pública

- `/votacion`
- `/votacion/elecciones/pasadas`
- `/votacion/elecciones/[electionId]/publica`

### Auth votación

- `/votacion/login`
- `/votacion/registrarse`
- `/votacion/verificar-correo`
- `/votacion/pendiente`
- `/votacion/rechazado`
- `/votacion/recuperar`
- `/votacion/restablecer`

### Votación privada

- `/votacion/elecciones`
- `/votacion/elecciones/new`
- `/votacion/elecciones/[electionId]/config/cargos`
- `/votacion/elecciones/[electionId]/config/planchas`
- `/votacion/elecciones/[electionId]/config/padron`
- `/votacion/elecciones/[electionId]/config/review`
- `/votacion/elecciones/[electionId]/status`

## Compat legacy externa

Estas rutas existen por compatibilidad externa, bookmarks o enlaces históricos. No deben considerarse la superficie principal:

- Auth votación legacy: `/login`, `/registrarse`, `/verificar-correo`, `/pendiente`, `/rechazado`, `/recuperar`, `/restablecer`
- Voting legacy: `/elections`, `/elections/past`, `/elections/[electionId]/public`, `/elections/new`, `/elections/[electionId]/config/*`, `/elections/[electionId]/status`
- Resultados legacy top-level: `/control-personal`, `/auditoria-tse`, `/panel`, `/departamentos`, `/provincias`, `/municipios`, `/asientos-electorales`, `/recintos-electorales`, `/mesas`, `/configuraciones`, `/partidos`, `/partidos-politicos`

## Estructura técnica relevante

- `src/app/**`
  routing canónico en Next App Router
- `src/domains/**`
  pantallas, shells, guards y navegación por dominio
- `src/store/**`
  estado compartido y RTK Query
- `src/shared/**`
  utilidades transversales
- `src/main.tsx`, `src/App.tsx`, `src/Router.tsx`
  entrypoints legacy conservados solo por compat histórica

## Desarrollo

### Requisitos

- Node.js 20+
- npm

### Comandos principales

```bash
npm install
npm run dev
npm run build
npm start
npm run lint
npm run typecheck
```

### Scripts legacy

```bash
npm run dev:legacy
npm run build:legacy
npm run preview:legacy
```

Úsalos solo para compatibilidad interna o tareas de migración histórica. No son el flujo recomendado de entrega.

## Despliegue

### Docker

El `Dockerfile` actual empaqueta la app Next en modo `standalone`.

```bash
docker build -t tuvotodecide-frontend .
docker run -p 3000:3000 tuvotodecide-frontend
```

### Vercel

La app debe desplegarse como proyecto Next.js, sin rewrites de SPA a `index.html`.

## Testing

### Superficie canónica

- `cypress/e2e/registro_admin_e2e.cy.ts`
  smoke/admin flow sobre rutas canónicas `/votacion/**`

### Compat legacy

- `cypress/e2e/flujo_principal.cy.ts`
  validaciones de redirección desde rutas legacy hacia la superficie canónica

### Variables opcionales para E2E con backend real

Si quieres ejecutar el flujo autenticado contra un backend real, define:

```bash
export CYPRESS_BASE_URL=http://localhost:3000
export CYPRESS_API_URL=http://localhost:3005/api/v1
export CYPRESS_E2E_SUPERADMIN_EMAIL=...
export CYPRESS_E2E_SUPERADMIN_PASSWORD=...
export CYPRESS_E2E_TEST_EMAIL=...
export CYPRESS_E2E_TEST_PASSWORD=...
```

Si esas variables no están presentes, los tests dependientes de backend deben saltarse.
