# Database Schema & Strategy

## ER Diagram

```mermaid
erDiagram
    Organization ||--o{ User : "has"
    Organization ||--o{ PlatformProfile : "has"
    Organization ||--o{ MediaAsset : "has"
    User ||--o{ Post : "creates"
    User ||--o{ PostVersion : "creates"
    PlatformProfile ||--o{ Post : "targets"
    Post ||--o{ PostVersion : "has versions"
    Post }o--o| MediaAsset : "attaches"

    Organization {
        int id PK
        string name UK
        string slug UK
        datetime createdAt
    }

    User {
        int id PK
        int organizationId FK
        string name
        string email UK
        string password "select: false"
        string role "default: admin"
        datetime createdAt
    }

    PlatformProfile {
        int id PK
        int organizationId FK
        string platform "twitter|linkedin|instagram|facebook"
        string handle
        string displayName
        string avatarUrl "nullable"
        boolean isActive "default: true"
        datetime createdAt
        UK(organizationId, platform, handle)
    }

    Post {
        int id PK
        int organizationId FK
        int userId FK
        int platformProfileId FK
        int mediaAssetId "nullable, FK"
        string title
        text content
        string status "draft|scheduled|published|failed"
        datetime scheduledAt "nullable"
        datetime publishedAt "nullable"
        int characterCount
        datetime createdAt
        datetime updatedAt
        INDEX(organizationId, scheduledAt)
    }

    PostVersion {
        int id PK
        int postId FK
        text content
        int mediaAssetId "nullable"
        text changeDescription "nullable"
        int versionNumber
        int userId FK
        datetime createdAt
        UK(postId, versionNumber)
    }

    MediaAsset {
        int id PK
        int organizationId FK
        string filename
        string originalName
        string mimeType
        int fileSize
        int width "nullable"
        int height "nullable"
        string url
        datetime createdAt
    }
```

## Entity Breakdown

### Organization
The root tenant entity. Every user, post, platform profile, and media asset belongs to an organization. The `slug` field is auto-generated from the organization name during registration (lowercased, non-alphanumeric characters replaced with hyphens).

### User
Users belong to an organization. The `password` field has `select: false` in TypeORM, meaning it is excluded from SELECT queries by default — you must explicitly opt-in with `select: ['password']` when authenticating. The role is currently always `'admin'` since there is no role hierarchy implemented yet.

**Important**: When loading a user for login, the service manually specifies which fields to select to include the password field. This is the one query that breaks the `select: false` default.

### PlatformProfile
Represents a connected social media account. Each profile belongs to an organization and must have a unique combination of `(organizationId, platform, handle)`. The `platform` field is an enum-like string constrained to: `twitter`, `linkedin`, `instagram`, `facebook`.

### Post
The core entity. Tracks scheduled social media content through its lifecycle:

**Status state machine:**
```
draft ──► scheduled ──► published
  │                         │
  └──────────────────────► failed
```

- **draft**: Being written, not yet scheduled
- **scheduled**: Has a `scheduledAt` date, awaiting publication
- **published**: Has been sent (simulated)
- **failed**: Publication failed

The `characterCount` is computed from `content.length` on create/update. The composite index on `(organizationId, scheduledAt)` optimizes calendar queries that filter by date range within a tenant.

### PostVersion
An immutable audit trail of content changes. Every post creation generates v1. Every update that changes content generates a new version with an incremented `versionNumber`. The composite unique constraint on `(postId, versionNumber)` prevents duplicate version numbers for the same post.

### MediaAsset
Stores metadata about uploaded files. The actual file lives on the filesystem at `uploads/<timestamp>-<random>_<originalName>`. The `url` field is a relative path served by NestJS's static file middleware at `/uploads/<filename>`.

## Database Configuration

### Development (sql.js)

```typescript
// apps/api/src/config/database.config.ts
export function databaseConfig(): TypeOrmModuleOptions {
  return {
    type: 'sqljs',                          // SQLite compiled to JavaScript
    location: join(process.cwd(), 'data', 'social-scheduler.sqlite'), // Single file DB
    autoSave: true,                          // Persists to disk on every change
    entities: [join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
    synchronize: true,                       // Auto-creates/updates tables from entities
    logging: process.env.NODE_ENV !== 'production',
  };
}
```

Key behaviors:
- **`synchronize: true`** means TypeORM auto-creates tables on startup. No migrations needed in dev.
- **`autoSave: true`** writes the in-memory sql.js database to the `.sqlite` file after every operation.
- The database file is at `apps/api/data/social-scheduler.sqlite` relative to the API working directory.

### Production (PostgreSQL)

To switch to PostgreSQL, change the database config:

```typescript
export function databaseConfig(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    url: process.env.DATABASE_URL,          // e.g., postgresql://user:pass@host:5432/db
    entities: [join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
    synchronize: false,                      // Use migrations in production
    migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
    ssl: { rejectUnauthorized: false },      // For hosted Postgres (Neon, Supabase, etc.)
  };
}
```

The entities use TypeORM column types that are cross-dialect compatible (`int`, `text`, `varchar`, `datetime`, `boolean`). The schema was designed with PostgreSQL in mind — no SQLite-specific types are used in production paths.

## Migration Strategy

| Environment | Strategy |
|---|---|
| **Development** | `synchronize: true` — let TypeORM auto-sync entities |
| **Production** | TypeORM migrations: `typeorm migration:generate` then `typeorm migration:run` |

To generate production migrations:

```bash
# After configuring Postgres connection
cd apps/api
npx typeorm migration:generate src/migrations/InitialSchema -d src/config/database.config.ts
npx typeorm migration:run -d src/config/database.config.ts
```

## Index Strategy

| Entity | Index | Purpose |
|---|---|---|
| `Post` | `(organizationId, scheduledAt)` | Calendar queries: find posts by tenant and month |
| `Post` | `organizationId` | Implicit FK index via TypeORM |
| `Post` | `userId` | Implicit FK index |
| `Post` | `platformProfileId` | Implicit FK index |
| `PlatformProfile` | `(organizationId, platform, handle)` UNIQUE | Prevent duplicate profile connections |
| `PostVersion` | `(postId, versionNumber)` UNIQUE | Enforce version integrity |
| `Organization` | `slug` UNIQUE | URL-friendly tenant identifier |
| `User` | `email` UNIQUE | Login lookup |
| `User` | `password` | No index (excluded from selects by default) |

## TypeORM Column Type Notes

The use of `sql.js` (SQLite via JavaScript) has a few quirks compared to native TypeORM drivers:

1. **`@Column({ type: 'datetime' })`** — SQLite has no native datetime type; sql.js stores these as ISO strings. The NestJS entities use `Date` type in TypeScript, and TypeORM handles the conversion transparently.
2. **`@CreateDateColumn()` / `@UpdateDateColumn()`** — Work correctly with sql.js, auto-set on insert/update.
3. **`@Column({ type: 'text' })`** — SQLite maps TEXT correctly. Use for long content, change descriptions.
4. **`@Column({ type: 'int', nullable: true })`** — Nullable integer columns (like `mediaAssetId` on Post) require explicit `type: 'int'` annotation in the decorator. Without the type hint, TypeORM with sql.js may infer the column type from the TypeScript type and produce `integer`, which is fine, but the explicit annotation ensures cross-dialect compatibility.
5. **`@Column({ select: false })`** — The password field uses this to prevent accidental exposure. The `findOne` query in auth service must manually override with `select: ['password']`.

## Seed Data

When the application starts with an empty database, it auto-seeds:

- **1 Organization**: TechCorp (slug: `techcorp`)
- **1 Admin User**: Ana Martínez (`ana@techcorp.com` / `password123`)
- **4 Platform Profiles**: Twitter, LinkedIn, Instagram, Facebook (all "@techcorp" handles)
- **3 Media Assets**: banner image, team photo, animated logo
- **8 Posts**: 2 per platform, mixed statuses (published, scheduled, draft)
- **Post Versions**: v1 for every post, v2 for published/scheduled posts
