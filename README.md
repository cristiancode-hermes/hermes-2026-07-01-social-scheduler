# Social Scheduler (hermes-social-scheduler)

> A multi-tenant social media content scheduling platform with calendar view, drag-and-drop rescheduling, media library, and analytics.

Built with **Angular 22** (standalone, signals, zoneless, Tailwind CSS v4), **NestJS** (8 modules, JWT auth, Swagger, TypeORM), and **SQLite/PostgreSQL**.

![Stack](https://img.shields.io/badge/Angular-22-DD0031?logo=angular)
![Stack](https://img.shields.io/badge/NestJS-11-EA2845?logo=nestjs)
![Stack](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)
![Stack](https://img.shields.io/badge/TypeORM-0.3-262627?logo=typeorm)

---

## Features

- **📅 Calendar View** — Monthly and weekly calendar grids with post cards, day click → new post, post click → detail modal
- **🔄 Drag & Drop Reschedule** — Drag post cards to new dates; drafts auto-promote to scheduled
- **📊 Analytics Dashboard** — KPI cards (total, published, scheduled, engagement rate), posts-by-platform bar chart, recent posts timeline with date range filter
- **📝 Full Post Management** — Create, edit, list, detail, and delete posts with version history
- **📁 Media Library** — Upload, preview, and manage images with drag-and-drop upload zone
- **🔗 Platform Profiles** — Manage connected social media accounts (Twitter, LinkedIn, Instagram, Facebook)
- **🔍 Global Search** — Ctrl+K search across posts, profiles, and media
- **🌙 Dark Mode** — System preference detection, manual toggle, persisted to localStorage
- **🔐 Multi-Tenant Auth** — JWT-based authentication with organization-scoped data isolation
- **📋 Version History** — Automatic PostVersion tracking on every content change
- **📖 Swagger API Docs** — Interactive API documentation at `/api/docs`

---

## Full Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Angular 22 | Standalone components, signals, zoneless change detection, lazy-loaded routes |
| **Styling** | Tailwind CSS v4 | `@theme` design tokens, dark mode via class toggle, platform-specific colors |
| **Backend** | NestJS 11 | 8 feature modules, Passport JWT auth, global validation + exception filter |
| **API Docs** | Swagger | Auto-generated from decorators, available at `/api/docs` |
| **ORM** | TypeORM 0.3 | Entities, relations, auto-sync (dev), migration-ready (prod) |
| **Database** | SQLite (sql.js) dev / PostgreSQL prod | Zero-config dev, production-ready schema |
| **Auth** | bcryptjs + JWT | Password hashing, 7-day token expiry, `organizationId` in payload |

---

## Architecture Overview

```
Browser ──HTTP──► NestJS API (:3000) ──TypeORM──► SQLite/PostgreSQL
   ▲                                                   │
   │                                                   ▼
   └────────── Angular SPA (:4200) ────────── Seed Data (auto on start)
```

**Key concepts:**

- **Multi-tenancy**: Every database row has an `organizationId`. The JWT token embeds `organizationId`, and every query is scoped to it.
- **Signal-first state**: All frontend state lives in Angular signals within injectable services. No NgRx, no zone.js.
- **Auto-seed**: On first startup, the app seeds itself with 1 organization (TechCorp), 1 admin user, 4 platform profiles, 3 media assets, and 8 posts with version history.
- **Post state machine**: `draft → scheduled → published → failed`. The reschedule endpoint auto-promotes drafts to scheduled.
- **Version history**: Every post create/update generates a `PostVersion` snapshot. History is visible on the post detail page.

For a detailed architecture diagram and data flow descriptions, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+
- **Git** (for cloning)

No database server is required for development — SQLite runs in-memory/file via JavaScript.

---

## Local Setup

### 1. Clone and Install

```bash
git clone <repo-url> hermes-social-scheduler
cd hermes-social-scheduler
npm install
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
```

Or from the root (installs all three `package.json` files):

```bash
npm install
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for development):

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `data/social-scheduler.sqlite` | SQLite file path |
| `JWT_SECRET` | `social-scheduler-secret-key-change-in-production` | JWT signing key |
| `PORT` | `3000` | API server port |

### 3. Run the Application

```bash
npm run dev
```

This runs both the API server (`:3000`) and the Angular dev server (`:4200`) concurrently with hot-reload.

**Open the app:** [http://localhost:4200](http://localhost:4200)

### 4. Seed Data (Automatic)

On first startup, the API auto-seeds the database. You'll see in the terminal:

```
[SeedService] Database seeded successfully!
[SeedService]   Organization: TechCorp
[SeedService]   Admin user: ana@techcorp.com / password123
[SeedService]   4 platform profiles created
[SeedService]   3 media assets created
[SeedService]   8 posts created
```

**Login credentials:**
- Email: `ana@techcorp.com`
- Password: `password123`

### 5. Verify It Works

1. Open [http://localhost:4200](http://localhost:4200) — you'll be redirected to login
2. Sign in with `ana@techcorp.com` / `password123`
3. You should see the Dashboard with KPIs and a chart
4. Navigate to Calendar, Posts, Media, and Settings to see populated data
5. Open [http://localhost:3000/api/docs](http://localhost:3000/api/docs) for Swagger

### 6. Build for Production

```bash
npm run build
```

This runs `tsc --build --force` for the API and `ng build` for the web app.

---

## Project Structure

```
hermes-social-scheduler/
├── apps/
│   ├── api/                          # NestJS backend
│   │   ├── src/
│   │   │   ├── main.ts               # Entry point (Swagger, CORS, static files)
│   │   │   ├── app.module.ts         # Root module (7 feature + 1 seed module)
│   │   │   ├── config/
│   │   │   │   ├── database.config.ts # TypeORM config (sql.js)
│   │   │   │   └── jwt.config.ts      # JWT config (7-day expiry)
│   │   │   ├── entities/
│   │   │   │   ├── organization.entity.ts
│   │   │   │   ├── user.entity.ts
│   │   │   │   ├── platform-profile.entity.ts
│   │   │   │   ├── post.entity.ts
│   │   │   │   ├── post-version.entity.ts
│   │   │   │   └── media-asset.entity.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/             # Register, login, getMe
│   │   │   │   ├── posts/            # CRUD + calendar + reschedule
│   │   │   │   ├── platforms/        # CRUD platform profiles
│   │   │   │   ├── media/            # Upload, list, delete
│   │   │   │   ├── analytics/        # KPIs, by-platform, recent
│   │   │   │   ├── search/           # Global search
│   │   │   │   ├── dashboard/        # Summary endpoint
│   │   │   │   └── seed/             # Auto-seed on startup
│   │   │   └── common/               # Exception filter, pagination DTO
│   │   ├── data/
│   │   │   └── social-scheduler.sqlite # SQLite database file
│   │   └── uploads/                  # Uploaded media files
│   └── web/                          # Angular frontend
│       └── src/
│           ├── main.ts               # Bootstrap
│           ├── app/
│           │   ├── app.ts            # Root component
│           │   ├── app.config.ts     # Zoneless, router, HTTP client
│           │   ├── app.routes.ts     # Lazy-loaded routes
│           │   ├── models.ts         # TypeScript interfaces + constants
│           │   ├── guards/
│           │   │   └── auth.guard.ts # Auth route guard
│           │   ├── layout/           # App shell, sidebar, topbar, bottom nav
│           │   ├── pages/            # 10 page components
│           │   ├── services/         # 7 signal-based services
│           │   └── shared/           # 8 reusable components
│           └── styles.css            # Tailwind @theme configuration
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── DECISIONS.md
│   ├── FRONTEND.md
│   └── LEARNINGS.md
├── .env.example
├── package.json                      # Root orchestration (concurrently)
└── README.md
```

---

## API Endpoints (24 Total)

| Method | Endpoint | Module | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Auth | Register + create org |
| POST | `/api/auth/login` | Auth | Login, get JWT |
| GET | `/api/auth/me` | Auth | Current user profile |
| GET | `/api/posts` | Posts | List with filters + pagination |
| GET | `/api/posts/calendar?month=&year=` | Posts | Posts grouped by date |
| GET | `/api/posts/:id` | Posts | Post detail with versions |
| POST | `/api/posts` | Posts | Create post + v1 |
| PATCH | `/api/posts/:id` | Posts | Update post, create version if content changed |
| PATCH | `/api/posts/:id/reschedule` | Posts | Quick reschedule (drag-drop) |
| DELETE | `/api/posts/:id` | Posts | Delete post + versions |
| GET | `/api/platforms` | Platforms | List profiles |
| GET | `/api/platforms/:id` | Platforms | Profile detail |
| POST | `/api/platforms` | Platforms | Create profile |
| PATCH | `/api/platforms/:id` | Platforms | Update profile |
| DELETE | `/api/platforms/:id` | Platforms | Delete profile |
| GET | `/api/media` | Media | List with pagination |
| GET | `/api/media/:id` | Media | Media detail |
| POST | `/api/media/upload` | Media | Upload file |
| DELETE | `/api/media/:id` | Media | Delete media |
| GET | `/api/analytics/kpi` | Analytics | Dashboard KPIs |
| GET | `/api/analytics/by-platform` | Analytics | Posts by platform |
| GET | `/api/analytics/recent` | Analytics | Recent published posts |
| GET | `/api/search?q=` | Search | Global search |
| GET | `/api/dashboard/summary` | Dashboard | Complete summary |

Full request/response documentation: [docs/API.md](docs/API.md)

---

## Roadmap

### Near-term (Next Iteration)

- [ ] **Post publishing worker** — Scheduled job that checks for due posts and transitions them from `scheduled` to `published`
- [ ] **File type / dimension detection** — Extract width/height from uploaded images (currently stored as null)
- [ ] **Toast notifications** — Add success/error toast feedback for CRUD operations across all pages
- [ ] **Pagination on Media page** — Add page controls to the media library grid
- [ ] **Rate limiting** — Add `@nestjs/throttler` guard to prevent API abuse
- [ ] **Input validation feedback** — Inline field-level error messages instead of only top-level error blocks

### Medium-term

- [ ] **Role-based access control** — Add `editor` and `viewer` roles with permission checks
- [ ] **Bulk operations** — Select multiple posts for batch status change or deletion
- [ ] **Post templates** — Save and reuse content templates per platform
- [ ] **Analytics enhancements** — Real engagement metrics (likes, shares, comments) via platform API integrations
- [ ] **OAuth platform connections** — Authenticate with Twitter/LinkedIn/Instagram/Facebook via OAuth instead of manual profile entry

### Long-term

- [ ] **Multi-user real-time collaboration** — WebSocket-based presence and change broadcasting
- [ ] **Post preview** — Render posts in platform-specific previews (simulated tweet, LinkedIn post, Instagram story)
- [ ] **Content calendar sharing** — Public read-only calendar links for stakeholders
- [ ] **AI content suggestions** — Integrate LLM for content generation and hashtag recommendations
- [ ] **PostgreSQL production migration** — Documented migration path with TypeORM migrations

---

## Documentation Index

| Document | Description |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System diagram, data flow, module structure |
| [DATABASE.md](docs/DATABASE.md) | Schema, ERD, migration strategy, index strategy |
| [API.md](docs/API.md) | Endpoint reference with request/response examples |
| [DECISIONS.md](docs/DECISIONS.md) | ADR-style architecture decision records |
| [FRONTEND.md](docs/FRONTEND.md) | Signal architecture, component tree, shared components |
| [LEARNINGS.md](docs/LEARNINGS.md) | Pain points and lessons learned during development |

---

## Contributing

1. Read through the documentation files in `docs/` to understand the architecture
2. Run the application locally (`npm run dev`) and familiarize yourself with the UI
3. Check the roadmap for areas that need work
4. Make changes and test with the auto-seeded data
5. If you need to reset the database, delete `apps/api/data/social-scheduler.sqlite` and restart

---

*Built with Angular 22, NestJS, TypeORM, and Tailwind CSS v4.*
