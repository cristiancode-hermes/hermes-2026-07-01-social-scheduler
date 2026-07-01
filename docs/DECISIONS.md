# Architecture Decision Records

This document captures every non-obvious decision made during the development of this project, the alternatives considered, and the rationale for the chosen approach.

---

## ADR-001: Signal-First State Management over NgRx

**Status:** Accepted  
**Date:** 2026-07-01  
**Context:** We needed a state management strategy for the Angular frontend. Options included NgRx (the traditional choice), plain RxJS Subjects/Behaviors, and Angular Signals.

**Decision:** Use Angular Signals exclusively for all state management. No NgRx, no NgXs, no external state libraries.

**Alternatives Considered:**
- **NgRx**: Standard in enterprise Angular apps. Provides devtools, effects, selectors, and a strict unidirectional data flow. However, it introduces significant boilerplate (actions, reducers, effects, selectors) that is disproportionate for an app of this size (~7 pages, ~6 services).
- **RxJS Behaviors**: Tried-and-true pattern. But signals offer stronger integration with Angular's template engine, automatic change detection, and simpler APIs.
- **Simple class properties**: No reactivity — requires manual change detection.

**Rationale:**
- Signals are a first-party Angular primitive with deep framework integration
- No external dependencies needed
- Computed signals provide automatic memoization and dependency tracking
- The app is small enough that NgRx's benefits (time-travel debugging, normalized stores) don't justify its cost
- Starting with zoneless change detection made signals the natural choice — zone.js can't react to signal changes, but signals trigger their own change notification

**Trade-offs:**
- No centralized Redux DevTools for debugging state changes (mitigated by Angular DevTools)
- Larger components that manage more local state could become harder to test
- No built-in action logging (would need a custom middleware layer)

---

## ADR-002: Zoneless Change Detection

**Status:** Accepted  
**Date:** 2026-07-01  
**Context:** Angular 22 supports zoneless change detection as an opt-in feature starting from v18 (developer preview) to stable in v22.

**Decision:** Enable `provideZonelessChangeDetection()` and remove `zone.js` from the project.

**Alternatives Considered:**
- **Default zone.js-based change detection**: The standard for all Angular versions up to v17. Works, but has known performance costs from patching browser APIs.
- **Hybrid approach**: Keep zone.js but also use signals. Redundant.

**Rationale:**
- Zoneless aligns with the direction Angular is heading — zone.js will be optional/removed in future versions
- Better runtime performance: no monkey-patching of browser APIs, no change detection cycles triggered by non-relevant events
- Smaller bundle: `zone.js` accounts for ~25KB gzipped
- Signals provide explicit change notification, making zone.js redundant

**Trade-offs:**
- All change detection must be triggered through signals or explicit `ChangeDetectorRef.markForCheck()` calls
- Third-party libraries that rely on zone.js for change detection may not work without workarounds
- Debugging is slightly different — you can't rely on zone.js stack traces

---

## ADR-003: Multi-Tenancy via JWT Payload (Not Separate Databases)

**Status:** Accepted  
**Date:** 2026-07-01  
**Context:** The application serves multiple organizations (tenants). Each organization's data must be isolated.

**Decision:** Use a single-database, shared-schema approach where every table has an `organizationId` column, and the JWT token embeds `organizationId` in its payload.

**Alternatives Considered:**
- **Database-per-tenant**: Separate Postgres databases for each org. Strongest isolation but huge operational overhead (connection pooling, migrations x N). Overkill for an app at this scale.
- **Schema-per-tenant**: Same database, separate Postgres schemas. Better than separate DBs but still adds migration complexity and doesn't work with sql.js.

**Rationale:**
- Simple to implement: every query includes `where: { organizationId: req.user.organizationId }`
- Zero-config for development with sql.js
- Easy to migrate users between orgs if needed
- JWT is stateless — no server-side session store needed
- The `organizationId` comes from the authenticated token, never from user input

**Trade-offs:**
- A bug that omits the organizationId filter would leak data across tenants
- Harder to physically separate customer data for compliance (GDPR data deletion requires scanning all tables)
- No per-tenant performance isolation

**Mitigations:**
- All service methods receive organizationId as a required parameter (never read from the entity itself)
- Guard clause at the controller level ensures the user is authenticated before any service call
- Seed data and test fixtures include organization-specific IDs to catch cross-tenant bugs

---

## ADR-004: sql.js (SQLite) for Development, PostgreSQL for Production

**Status:** Accepted  
**Date:** 2026-07-01  
**Context:** We needed a development database that requires zero setup and a production database that can scale.

**Decision:** Use `sql.js` (SQLite compiled to WebAssembly/JavaScript) for local development via TypeORM's `sqljs` driver, with a PostgreSQL configuration ready for production.

**Alternatives Considered:**
- **SQLite throughout**: Simplest. But SQLite doesn't support concurrent writes well and has no user management — not suitable for production.
- **PostgreSQL throughout + Docker Compose**: Better parity but adds dev setup friction: every developer needs Docker.
- **Better-sqlite3**: Native SQLite bindings. Faster than sql.js but requires native compilation — adds platform-specific build issues.

**Rationale:**
- sql.js requires no native dependencies — just `npm install` and it works
- The database file (`social-scheduler.sqlite`) is a single file that can be committed or deleted at will
- TypeORM's abstraction means switching to Postgres requires only changing the database config
- The entity schema uses cross-dialect compatible column types

**Trade-offs:**
- sql.js is slower than native SQLite (it runs in WASM)
- `synchronize: true` in dev won't work with Postgres migrations in prod — must remember to disable it
- Some Postgres-specific features (array columns, JSONB, full-text search) won't work in dev unless also supported by SQLite

**Migration Path:**
```typescript
// config change needed:
type: 'postgres',
url: process.env.DATABASE_URL,
synchronize: false, // critically important to change
migrations: ['dist/migrations/*.js'],
```

---

## ADR-005: Auto-Seed on Application Startup

**Status:** Accepted  
**Date:** 2026-07-01  
**Context:** The project needs demo data for development. Running a separate seed command is an extra step that new developers may forget.

**Decision:** The `SeedService` implements `OnModuleInit` and auto-seeds the database on application startup if it's empty.

**Alternatives Considered:**
- **Separate seed script** (`npm run seed`): Common pattern but requires remembering to run it, and the seed state can drift from the schema
- **Migration-based seeding**: Data seeds in TypeORM migrations. Adds versioning but makes seeds harder to update
- **Factory/seeder pattern (like Faker)**: More realistic data but adds an external dependency and makes the seed non-deterministic

**Rationale:**
- Zero friction: `npm install && npm run dev` gives you a fully populated application
- The seed check (`if orgCount > 0 skip`) makes it idempotent — safe to restart the server
- Seed data is deterministic and well-documented, making tests reproducible
- The seed includes version history (v1 for all posts, v2 for published/scheduled), demonstrating the version history feature immediately

**Trade-offs:**
- Adds ~500ms to first startup (negligible)
- If you delete the DB file while the server is running, it won't re-seed until restart
- Seed data in production would be dangerous — but the seed check prevents that (production DB isn't empty)

---

## ADR-006: PostVersion as Manual Audit Trail (Not TypeORM Soft-Delete)

**Status:** Accepted  
**Date:** 2026-07-01  
**Context:** We needed version history for posts — tracking what content changed, when, and by whom.

**Decision:** Create a separate `PostVersion` entity that stores snapshots of post content, rather than using TypeORM's built-in soft-delete/logging mechanisms.

**Alternatives Considered:**
- **TypeORM's `@DeleteDateColumn` soft-delete**: Only handles deletes, not content changes
- **Event sourcing / append-only log**: Too heavyweight for this use case
- **JSON diff in a single column**: Harder to query and display individual versions
- **Database triggers**: Coupled to the database engine, not portable

**Rationale:**
- Each version is a full snapshot, making it easy to display "what the post looked like at version N"
- The `versionNumber` auto-increments per post, giving a clean linear history
- Stores `userId` per version, so you know who made each change
- No external dependencies, pure TypeORM
- Version creation is embedded in the service layer (posts.service.ts), not in controllers, keeping the API clean

**Trade-offs:**
- Each post update that changes content creates a new row — storage grows with edits
- No automatic diffing — if you want to display "what changed" between versions, you need to compare content strings
- The `changeDescription` field is manually set by the service (currently always "Initial version" or "Content updated") — no intelligent diff summary

---

## ADR-007: Tailwind CSS v4 with Custom Theme Tokens

**Status:** Accepted  
**Date:** 2026-07-01  
**Context:** We needed a styling approach that supports dark mode, platform-specific colors, and rapid UI development.

**Decision:** Use Tailwind CSS v4 with a fully customized `@theme` configuration. Platform colors (Twitter blue, LinkedIn blue, Instagram pink, Facebook blue) are defined as design tokens.

**Alternatives Considered:**
- **SCSS / CSS Modules**: No design system, each component defines its own styles. Harder to maintain consistency.
- **Material UI / Angular Material**: Provides ready-made components but is opinionated and hard to customize for non-Material designs.
- **CSS custom properties only**: Works but lacks Tailwind's utility-first productivity.

**Rationale:**
- Tailwind v4 uses the new `@theme` directive for design tokens — cleaner than the old `tailwind.config.js`
- Platform colors as CSS variables (`--color-platform-twitter`, etc.) makes them reusable in any component
- Dark mode via `@custom-variant dark` and `class` strategy — simple toggle on `<html>`
- No runtime CSS-in-JS overhead

**Theme Structure:**
```
colors
├── primary (blue)          # Main actions, links
├── secondary (violet)      # Accent elements
├── accent (amber)          # Highlights, warnings
├── neutral (warm gray)     # Text, backgrounds, borders
├── success (green)         # Positive states
├── warning (orange)        # Caution states
├── danger (red)            # Destructive actions, errors
└── platform-{name}         # Twitter, LinkedIn, Instagram, Facebook
```

---

## ADR-008: Standalone Components + All Imports Explicit

**Status:** Accepted  
**Date:** 2026-07-01  
**Context:** Angular supports both NgModule-based modules and standalone components. The application needed to choose one approach.

**Decision:** Every component is standalone. No NgModules exist in the application. All dependencies (pipes, directives, child components) are imported directly in the component's `imports` array.

**Alternatives Considered:**
- **NgModule-based**: Traditional Angular. Creates a module hierarchy that adds indirection.
- **Hybrid**: Some modules, some standalone. Confusing and inconsistent.

**Rationale:**
- Standalone is Angular's recommended future direction
- Eliminates the mental overhead of understanding module structure
- Tree-shaking is more effective with standalone components
- Lazy loading is simpler — `loadComponent` instead of `loadChildren`

**Trade-offs:**
- More verbose component decorators (each import repeated across components)
- No shared module to group common imports — but this is mitigated by importing directly and trusting the build tool's tree-shaking

---

## ADR-009: Drag-and-Drop Reschedule via API Endpoint (Not Websockets)

**Status:** Accepted  
**Date:** 2026-07-01  
**Context:** The calendar view supports dragging a post card to a new date to reschedule it. We needed to decide how the drag-drop interaction communicates with the backend.

**Decision:** Use a dedicated REST API endpoint (`PATCH /api/posts/:id/reschedule`) that accepts a new `scheduledAt` datetime. Clients call this on drop. No websockets, no optimistic UI with rollback.

**Alternatives Considered:**
- **Websocket / real-time sync**: Would allow broadcasting reschedules to other users. Overkill for a single-user-per-org workflow.
- **Optimistic UI update with rollback**: Faster UX but more complex error handling. The current implementation does update the local signal immediately after the HTTP response.
- **Increment the PATCH /api/posts/:id endpoint**: Could work but would require clients to know which fields changed. A dedicated endpoint is more explicit and self-documenting.

**Rationale:**
- A dedicated endpoint keeps the intent clear: this is a reschedule, not a generic update
- The endpoint auto-promotes `draft` to `scheduled` when a date is set — a business rule that would be easy to miss in a generic update
- Simple to implement, simple to test

**Trade-offs:**
- One extra endpoint to maintain
- Not real-time: if two users drag the same post simultaneously, the last write wins (no optimistic locking)

---

## ADR-010: No Dedicated CSS-in-JS or Component Libraries

**Status:** Accepted  
**Date:** 2026-07-01  
**Context:** The application needs a UI toolkit. Options included Angular Material, PrimeNG, or a fully custom approach.

**Decision:** Build all UI components from scratch using Tailwind CSS utility classes. No component library dependency.

**Alternatives Considered:**
- **Angular Material**: Full component suite. But it comes with its own design language (Material Design) that clashes with a custom brand. Heavy bundle.
- **PrimeNG / Taiga UI**: Third-party libraries with more flexibility. Still add bundle weight and opinionated markup.

**Rationale:**
- The application has a small number of unique UI patterns (forms, cards, modals, badges, buttons, loading states)
- Building from scratch gives full control over markup, accessibility, and theming
- Tailwind's utility classes make it fast to build custom components
- No risk of version conflicts or breaking upgrades from third-party component libraries

**Built shared components:**
| Component | Variants |
|---|---|
| ButtonComponent | primary, secondary, ghost, danger; sm, md, lg; loading state |
| BadgeComponent | status (draft/scheduled/published/failed) and platform (twitter/linkedin/instagram/facebook) |
| ModalComponent | sm, md, lg, xl sizes; optional close button |
| ToastComponent | success, error, info; auto-dismiss with configurable duration |
| LoadingSkeletonComponent | card, row, chart, text variants |
| EmptyStateComponent | customizable icon, title, description, CTA button |
| ConfirmDialogComponent | customizable title, message, button labels |
| SearchModalComponent | Ctrl+K triggered, global search with categorized results |
