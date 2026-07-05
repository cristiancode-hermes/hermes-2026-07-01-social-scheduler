# QA Report — Social Media Content Scheduler

## Resumen
⚠️ **WARN** — Builds pass, 41 new tests, but critical frontend-backend path mismatch exists.

## Build
| Comando | Resultado |
|---------|-----------|
| `tsc --build --force` (API) | ✅ (0.8s, sin errores) |
| `ng build` (Web) | ✅ (8.9s, 2 warnings NG8113) |

> **Nota:** El API usa `tsc --build --force` en lugar de `nest build` (documentado en LEARNINGS.md).

## Tests

### Existentes (antes)
- **API:** 0 tests (infraestructura Jest instalada pero sin specs)
- **Web:** 0 tests (sin infraestructura de testing — ni Jest, ni Karma, ni Vitest)
- **Total inicial:** 0 tests

### Nuevos añadidos
| Archivo | Tests | Qué cubren |
|---------|-------|------------|
| `api/src/modules/auth/auth.service.spec.ts` | 9 | register (éxito, email duplicado, slug), login (éxito, user no existe, password incorrecta), getMe (éxito, no encontrado, org null) |
| `api/src/modules/posts/posts.service.spec.ts` | 19 | findAll (paginación, filtros platform/status/fecha/search, dedup, vacío), findOne (relations, NotFound), create (versión inicial, draft default), update (nueva versión si cambia contenido), remove |
| `api/src/modules/platforms/platforms.service.spec.ts` | 13 | findAll, findOne, create (duplicados, isActive default), update (parcial), remove (NotFound en todos) |

**Total ahora: 41 tests, todos verdes.** ✅

### Pendiente
- Tests de controladores con supertest (integración)
- Tests de componentes Angular (requiere configurar test infra en web)
- Tests E2E completos

## Auditoría
| Aspecto | Estado | Detalle |
|---|---|---|
| Lint | ⚠️ | No hay ESLint configurado en API ni Web (proyectos nuevos sin eslint.config.js) |
| Types | ✅ | Strict mode en tsconfig, tipados fuertes en models.ts |
| Código | ✅ | Componentes bien estructurados, el más grande es calendar-page (395 líneas, aceptable) |
| Docs | ✅ | ARCHITECTURE.md, API.md, FRONTEND.md, DECISIONS.md, LEARNINGS.md, README.md — completos y detallados |
| Edge cases | ⚠️ | Frontend no maneja estados vacío/error de API de forma uniforme (falta prueba) |
| Seguridad | ⚠️ | CORS `origin: '*'` en main.ts; JWT fallback secret; **`synchronize: true` sin guard condicional** |
| Responsive | ✅ | BottomNav para mobile + Sidebar para desktop |
| Design System | ✅ | Tailwind v4 `@theme` con todos los tokens requeridos (primary, secondary, accent, success, warning, danger, platform colors). Neutral colors tienen leve discrepancia de hex vs spec (warm gray vs neutral) |
| HTTP method match | ✅ | Frontend `http.patch` ↔ Backend `@Patch`; `http.post` ↔ `@Post` — todo alineado |
| Frontend-Backend shape | 🔥 | **Ruta `/api/analytics/kpis` en frontend NO coincide con backend `@Get('kpi')`** |

## Issues
- [🔥 Alta] **Mismatch analytics endpoint: frontend llama a `/api/analytics/kpis` pero backend tiene `@Get('kpi')` (sin 's')** — El dashboard de KPIs siempre fallará con 404. Solución: cambiar el frontend a `'/api/analytics/kpi?...'` o renombrar el endpoint backend a `@Get('kpis')`.
- [🔥 Alta] **`synchronize: true` incondicional en database.config.ts** — En producción, TypeORM con `synchronize: true` puede dropear datos. Solución: cambiar a `synchronize: process.env.NODE_ENV !== 'production'`.
- [⚠️ Media] **CORS `origin: '*'` en main.ts** — Permite cualquier origen en producción. Debería ser configurable via env var.
- [⚠️ Media] **Sin tests en Angular** — El frontend carece de toda infraestructura de testing (no hay test builder en angular.json, no hay devDeps de testing). Se necesita configurar Vitest o Karma para añadir tests de componentes.
- [⚠️ Media] **JWT fallback secret hardcodeado** — `'social-scheduler-secret-key-change-in-production'` en jwt.config.ts. Funcional pero debe documentarse como prerequisito de producción.
- [📝 Baja] **NG8113 warnings en build** — `LoadingSkeletonComponent` importado pero no usado en `MediaLibraryPageComponent`; `DatePipe` importado pero no usado en `PostFormComponent`.
- [📝 Baja] **`totalPages` en backend no está en frontend `PaginatedResponse`** — Backend devuelve `totalPages` pero el frontend `PaginatedResponse<T>` no lo incluye. No causa error pero es type drift.
- [📝 Baja] **Discrepancia menor de diseño** — Neutral colors en styles.css usan warm gray (`#fafaf9`, `#f5f5f4`) mientras que DESIGN_SYSTEM.md especifica pure neutral gray (`#fafafa`, `#f5f5f5`). El spec actualizó la descripción a "Gris cálido" pero no los hex.

## Tests nuevos (detalle)

### `apps/api/src/modules/auth/auth.service.spec.ts` _(nuevo)_
- ✅ register - creates organization + user, returns token
- ✅ register - throws ConflictException when email exists
- ✅ register - generates slug from org name
- ✅ login - returns token on valid credentials
- ✅ login - throws UnauthorizedException when user not found
- ✅ login - throws UnauthorizedException when password wrong
- ✅ getMe - returns user with org name
- ✅ getMe - throws UnauthorizedException when user not found
- ✅ getMe - handles null org relation gracefully

### `apps/api/src/modules/posts/posts.service.spec.ts` _(nuevo)_
- ✅ findAll - paginated list (7 scenarios: default, platform filter, status filter, date filter, text search dedup, custom page/limit, empty result)
- ✅ findOne - with relations, NotFound by id, NotFound by org mismatch (3)
- ✅ create - post + version, default draft status, user not found (3)
- ✅ update - content change creates version, no version on unchanged content, status/media/platform/schedule updates, NotFound (4)
- ✅ remove - deletion + confirmation, NotFound (2)

### `apps/api/src/modules/platforms/platforms.service.spec.ts` _(nuevo)_
- ✅ findAll - returns profiles, empty array (2)
- ✅ findOne - found, NotFound (2)
- ✅ create - success, isActive default, explicit isActive, ConflictException duplicate (4)
- ✅ update - partial update, unchanged fields, NotFound (3)
- ✅ remove - deletion confirmation, NotFound (2)

## Conclusión
Builds pasan, documentación excelente, y se añadieron **41 tests unitarios** (0→41, todos verdes) cubriendo los 3 servicios core (Auth, Posts, Platforms). Sin embargo, hay **2 issues críticos**: el mismatch del endpoint analytics (`kpis` vs `kpi`) que rompe el dashboard, y `synchronize: true` incondicional que es peligroso en producción. El frontend necesita configuración de infraestructura de testing para poder añadir tests de componentes y servicios.
