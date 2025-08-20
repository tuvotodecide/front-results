# Sistema de Resultados Electorales

Aplicación web para visualizar y consultar resultados electorales con filtros territoriales y búsqueda por mesas específicas.

## Características Principales

- **Resultados Generales**: Visualización de resultados presidenciales y diputados con filtros territoriales
- **Resultados por Mesa**: Consulta detallada de resultados por mesa electoral con filtros por unidad territorial
- **Filtros Territoriales**: Sistema jerárquico de filtros (Departamento → Provincia → Municipio → Asiento Electoral → Recinto Electoral)
- **Búsqueda Directa**: Búsqueda por código de mesa específico
- **Interfaz Responsiva**: Diseño adaptable para dispositivos móviles y desktop

## Cambios Recientes

### ✨ Implementación de Filtros Territoriales en Resultados por Mesa

#### Objetivo
Permitir a los usuarios filtrar y visualizar mesas electorales por unidad territorial (departamento, provincia, municipio, asiento electoral, recinto electoral) en la vista de "Resultados por Mesa".

#### Cambios Implementados

**Archivo modificado**: `src/pages/Resultados/ResultadosMesa2.tsx`

##### 1. **Nuevas Importaciones y Dependencias**
- Agregado `useSearchParams` para manejo de parámetros URL
- Importado `Breadcrumb2` para filtros territoriales
- Agregado `selectFilters` para acceso al estado de filtros
- Importado `useGetDepartmentsQuery` para cargar departamentos

##### 2. **Nuevos Estados de Componente**
- `filteredTables`: Array de mesas filtradas por unidad territorial
- `showAllFilteredTables`: Control de visibilidad para mostrar todas las mesas filtradas
- `searchParams`: Parámetros de la URL para filtros
- `filters`: Estado global de filtros desde Redux

##### 3. **Funcionalidad de Filtros Territoriales**
- **Efecto para filtros territoriales**: Escucha cambios en `searchParams.electoralLocation` y obtiene mesas del recinto seleccionado
- **Integración con componente `Breadcrumb2`**: Reutilización del sistema de filtros existente de Resultados Generales

##### 4. **Nueva Interfaz de Usuario**
- **Vista sin mesa seleccionada**: Ahora incluye filtros territoriales y lista de mesas filtradas
- **Lista de mesas filtradas**: Grid responsivo con cards de mesas que incluyen:
  - Número de mesa
  - Código de mesa  
  - Nombre del recinto electoral
  - Enlaces directos a resultados de cada mesa
- **Botón "Mostrar todas"**: Para mesas cuando hay más de 15 resultados
- **Vista por defecto mejorada**: Instrucciones para usar filtros territoriales o búsqueda directa

##### 5. **Componentes Reutilizables**
- **`Breadcrumb2`**: Filtros territoriales jerárquicos reutilizados de Resultados Generales
- **Redux state management**: Uso del estado global para filtros y sincronización con URL

#### Criterios de Aceptación Cumplidos
✅ **Filtros por unidad territorial**: Implementado sistema completo de filtros  
✅ **Componentes reutilizables**: Reutilización de `Breadcrumb2` y sistema de filtros existente  
✅ **Propuesta de visualización**: Lista organizada en grid con información relevante de cada mesa  

#### Tecnologías Utilizadas
- **React 18** con Hooks (useState, useEffect, useSelector)
- **Redux Toolkit** para gestión de estado
- **React Router** para navegación y parámetros URL
- **TypeScript** para type safety
- **Tailwind CSS** para estilos responsivos

## Instalación y Desarrollo

### Requisitos Previos
- Node.js >= 16
- npm o yarn

### Comandos Disponibles
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Verificar tipos TypeScript
npx tsc --noEmit

# Ejecutar linter
npm run lint
```

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
