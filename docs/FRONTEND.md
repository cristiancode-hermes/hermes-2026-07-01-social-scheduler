# Frontend Architecture

## Overview

The frontend is a **standalone, zoneless, signal-first Angular 22 application** using Tailwind CSS v4. It has no NgModules, no NgRx, and no zone.js. Every component is standalone and imports its dependencies explicitly.

## Prerequisites for Understanding

If you're coming from a traditional Angular (v16 or earlier) codebase, here are the key differences:

1. **No `ngZone`**: Change detection fires only when signals change or explicit triggers happen
2. **No `NgModule`**: Components declare `imports: [RouterOutlet, DatePipe]` directly
3. **No `ngOnChanges`**: Use `effect()` to react to signal changes, or `computed()` for derived values
4. **No `| async` pipe**: Bind directly to signals in templates; the framework auto-unsubscribes
5. **`@Component` is a class decorator + `standalone: true`** on every component

## Project Structure

```
src/
├── main.ts                          # Bootstrap entry point
├── index.html                       # Shell HTML
├── styles.css                       # Tailwind v4 @theme + global styles
├── app/
│   ├── app.ts                       # Root component (<router-outlet />)
│   ├── app.config.ts                # App-wide providers
│   ├── app.routes.ts                # Route definitions (lazy loaded)
│   ├── models.ts                    # TypeScript interfaces + constants
│   ├── guards/
│   │   └── auth.guard.ts            # Route guard (redirects to /login)
│   ├── layout/
│   │   ├── app-shell.component.ts   # Sidebar + topbar + content wrapper
│   │   ├── top-bar.component.ts     # Search, dark-mode toggle, user menu
│   │   ├── sidebar.component.ts     # Desktop navigation (5 links)
│   │   └── bottom-nav.component.ts  # Mobile bottom navigation
│   ├── pages/
│   │   ├── login-page.component.ts
│   │   ├── register-page.component.ts
│   │   ├── dashboard-page.component.ts
│   │   ├── calendar-page.component.ts
│   │   ├── post-list-page.component.ts
│   │   ├── post-form.component.ts
│   │   ├── post-detail-page.component.ts
│   │   ├── media-library-page.component.ts
│   │   ├── settings-page.component.ts
│   │   └── not-found.component.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── post.service.ts
│   │   ├── platform.service.ts
│   │   ├── media.service.ts
│   │   ├── analytics.service.ts
│   │   ├── search.service.ts
│   │   └── dark-mode.service.ts
│   └── shared/
│       ├── button.component.ts
│       ├── badge.component.ts
│       ├── modal.component.ts
│       ├── toast.component.ts
│       ├── loading-skeleton.component.ts
│       ├── empty-state.component.ts
│       ├── confirm-dialog.component.ts
│       └── search-modal.component.ts
```

## Signal Architecture

### Where State Lives

State is distributed across **7 injectable services** (provided in root). There is no centralized store. Each service owns its own domain state using Angular signals.

**Service State Pattern:**

```typescript
@Injectable({ providedIn: 'root' })
class ExampleService {
  // Primary data
  readonly items = signal<Item[]>([]);
  readonly selectedItem = signal<Item | null>(null);

  // UI state
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Actions
  loadItems(): void { /* ... */ }
}
```

**Service Responsibilities:**

| Service | State Signals | API Endpoints |
|---|---|---|
| `AuthService` | `currentUser`, `isAuthenticated` (computed), `isLoading`, `error`, `tokenSignal` (private) | `/api/auth/*` |
| `PostService` | `posts`, `total`, `currentPost`, `loading`, `error`, `calendarPosts` | `/api/posts/*` |
| `PlatformService` | `profiles`, `loading`, `error` | `/api/platforms/*` |
| `MediaService` | `mediaList`, `loading`, `error` | `/api/media/*` |
| `AnalyticsService` | `kpis`, `postsByPlatform`, `recentPosts`, `loading`, `error` | `/api/analytics/*` |
| `SearchService` | `results`, `loading`, `error` | `/api/search*` |
| `DarkModeService` | `isDark` | None (client-only) |

### How State Flows

```
User interacts with component
  → Component calls service.method()
    → Service sets loading.set(true), error.set(null)
      → Service makes HTTP request
        → On success: service.data.set(response), loading.set(false)
        → On error: service.error.set(message), loading.set(false)
    → Template automatically re-renders via signal binding
```

### Computed Signals

Computed signals are used where values depend on other signals:

- **AuthService**: `isAuthenticated = computed(() => tokenSignal() !== null)`
- **DarkModeService**: No explicit computed, but `effect()` reacts to `isDark()`
- **PostFormComponent**: `selectedProfile`, `selectedMedia`, `charLimit`, `isEdit` — all computed from other local signals
- **CalendarPageComponent**: `monthDays`, `weekDays`, `headerText` — derived from `currentDate()` and `view()`

### Effect Usage

Effects are used sparingly and primarily for two purposes:

**1. Triggering data loading when page state changes:**
```typescript
constructor() {
  effect(() => {
    this.loadPosts(); // Re-runs when filters or page changes
  });
}
```

**2. Persisting side effects (dark mode):**
```typescript
effect(() => {
  localStorage.setItem('dark_mode', String(this.isDark()));
  this.applyTheme(this.isDark());
});
```

**3. Reacting to modal open/close:**
```typescript
effect(() => {
  if (this.isOpen()) {
    setTimeout(() => this.searchInput()?.nativeElement?.focus(), 100);
  } else {
    this.query.set('');
    this.searchService.clear();
  }
});
```

### Key Signal Anti-Patterns We Avoid

- ❌ **Setting signals inside computed()** — computed must be pure
- ❌ **Using effect() for data flow between components** — use service methods instead
- ❌ **Nesting effects** — keep them flat and focused on a single concern
- ❌ **Creating circular dependencies** — two signals reading each other in computed

## Zoneless Specifics

### What Changes

In zoneless mode:
- **No `NgZone` service**: `NgZone.onMicrotaskEmpty()`, `NgZone.run()` are unavailable
- **No automatic change detection**: Changes only propagate when signals change or when `ChangeDetectorRef.markForCheck()` is called
- **No zone-stabilization**: Tests can't wait for zone to stabilize — use `fixture.whenStable()` with patience or signal-based assertions

### What Still Works

- `@HostListener` decorators
- `setTimeout` / `setInterval`
- `RxJS.subscribe()` callbacks
- DOM events (click, input, etc.)
- `HttpClient` responses

All of these trigger change detection in zoneless mode through Angular's internal scheduling.

### Potential Pitfalls

1. **Third-party libs that rely on zone.js patches**: If a library calls `NgZone.run()` or expects zone microtasks to trigger change detection, it may appear unresponsive. Patch with `ChangeDetectorRef.detectChanges()` or use signal-based wrappers.

2. **Direct DOM manipulation**: Changing element properties outside Angular's tracking won't trigger re-renders. Use signal-based template bindings instead.

3. **Testing**: Use `TestBed.configureTestingModule({ ... }).compileComponents()` as usual, but be aware that `fixture.detectChanges()` may need explicit calls since there's no zone to flush.

## Component Tree

```
App (root)
├── LoginPageComponent
├── RegisterPageComponent
├── AppShellComponent (authenticated)
│   ├── TopBarComponent
│   │   ├── SearchModalComponent
│   │   ├── Dark mode toggle
│   │   └── User menu dropdown
│   ├── SidebarComponent
│   │   └── Nav links: Dashboard, Calendar, Posts, Media, Settings
│   ├── <router-outlet> (page content)
│   │   ├── DashboardPageComponent
│   │   │   ├── LoadingSkeletonComponent (×4)
│   │   │   ├── EmptyStateComponent
│   │   │   ├── BadgeComponent (status + platform)
│   │   │   └── Platform chart bars
│   │   ├── CalendarPageComponent
│   │   │   ├── BadgeComponent
│   │   │   ├── ModalComponent (post detail)
│   │   │   └── Calendar grid (7×6 cells)
│   │   ├── PostListPageComponent
│   │   │   ├── ButtonComponent
│   │   │   ├── BadgeComponent
│   │   │   ├── LoadingSkeletonComponent
│   │   │   ├── EmptyStateComponent
│   │   │   └── ConfirmDialogComponent
│   │   ├── PostFormComponent (/new, /:id/edit)
│   │   │   ├── ButtonComponent
│   │   │   ├── BadgeComponent
│   │   │   └── ModalComponent (media library picker)
│   │   ├── PostDetailPageComponent (/:id)
│   │   │   ├── BadgeComponent
│   │   │   ├── ButtonComponent
│   │   │   ├── LoadingSkeletonComponent
│   │   │   └── ConfirmDialogComponent
│   │   ├── MediaLibraryPageComponent
│   │   │   ├── ButtonComponent
│   │   │   ├── ModalComponent (preview)
│   │   │   ├── EmptyStateComponent
│   │   │   ├── LoadingSkeletonComponent
│   │   │   └── ConfirmDialogComponent
│   │   ├── SettingsPageComponent
│   │   │   ├── ButtonComponent
│   │   │   ├── BadgeComponent
│   │   │   ├── ModalComponent (add/edit profile)
│   │   │   ├── EmptyStateComponent
│   │   │   ├── LoadingSkeletonComponent
│   │   │   └── ConfirmDialogComponent
│   │   └── NotFoundPageComponent
│   └── BottomNavComponent (mobile)
└── 404 → NotFoundPageComponent
```

## Routing

Routes are lazy-loaded using `loadComponent`. The auth guard checks `AuthService.isAuthenticated()` and redirects to `/login` if false.

```
/login          → LoginPageComponent (no guard)
/register       → RegisterPageComponent (no guard)
/               → redirectTo /dashboard (guarded)
/dashboard      → DashboardPageComponent (guarded)
/calendar       → CalendarPageComponent (guarded)
/calendar/:view → CalendarPageComponent (guarded, :view = month|week)
/posts          → PostListPageComponent (guarded)
/posts/new      → PostFormComponent (guarded)
/posts/:id      → PostDetailPageComponent (guarded)
/posts/:id/edit → PostFormComponent (guarded)
/media          → MediaLibraryPageComponent (guarded)
/settings       → SettingsPageComponent (guarded)
/**             → NotFoundPageComponent (no guard)
```

## Tailwind v4 Theme

The stylesheet (`src/styles.css`) uses Tailwind v4's `@import "tailwindcss"` and `@theme` directive. No `tailwind.config.js` file exists — all customization is in CSS.

**Key design tokens:**
- Color palette: primary (blue), secondary (violet), accent (amber), neutral (warm gray), success (green), warning (orange), danger (red)
- Platform colors: `platform-twitter`, `platform-linkedin`, `platform-instagram`, `platform-facebook` — used for badges and charts
- Shadows: sm, card, md, lg, modal, dropdown
- Radius: sm through 2xl plus full
- Dark mode: `@custom-variant dark (&:where(.dark, .dark *));`

**Dark mode implementation:**
- `DarkModeService` manages the `isDark` signal
- The service reads from localStorage first, then falls back to `prefers-color-scheme`
- Setting the `dark` class on `<html>` toggles all Tailwind `dark:` variants
- An `effect()` keeps localStorage in sync with the current state

## Shared Components Reference

### ButtonComponent
| Input | Type | Default | Values |
|---|---|---|---|
| `variant` | string | `'primary'` | `primary`, `secondary`, `ghost`, `danger` |
| `size` | string | `'md'` | `sm`, `md`, `lg` |
| `loading` | boolean | `false` | — |
| `disabled` | boolean | `false` | — |
| `type` | string | `'button'` | `button`, `submit` |
| `iconLeft` / `iconRight` | string | `''` | Raw HTML SVG |

### BadgeComponent
| Input | Type | Default | Values |
|---|---|---|---|
| `variant` | string | `'draft'` | `draft`, `scheduled`, `published`, `failed`, `twitter`, `linkedin`, `instagram`, `facebook` |

### ModalComponent
| Input | Type | Default | Values |
|---|---|---|---|
| `isOpen` | boolean | `false` | — |
| `title` | string | `''` | — |
| `size` | string | `'md'` | `sm`, `md`, `lg`, `xl` |
| `showClose` | boolean | `true` | — |

### LoadingSkeletonComponent
| Input | Type | Default | Values |
|---|---|---|---|
| `variant` | string | `'text'` | `card`, `row`, `chart`, `text` |
| `count` | number | `1` | — |

### EmptyStateComponent
| Input | Type | Default |
|---|---|---|
| `icon` | string | `''` (default SVG shown if empty) |
| `title` | string | `''` |
| `description` | string | `''` |
| `actionLabel` | string | `''` |
| Output: `action` | void | Emitted when CTA clicked |

### ToastComponent
| Input | Type | Default |
|---|---|---|
| `type` | string | `'info'` |
| `message` | string | `''` |
| `duration` | number | `5000` (ms) |
| Output: `dismiss` | void | Emitted when dismissed/timed out |

### ConfirmDialogComponent
| Input | Type | Default |
|---|---|---|
| `isOpen` | boolean | `false` |
| `title` | string | `'Confirm Delete'` |
| `message` | string | `'Are you sure...'` |
| `confirmLabel` | string | `'Delete'` |
| `cancelLabel` | string | `'Cancel'` |
| Output: `confirm` / `cancel` | void | — |

### SearchModalComponent
Ctrl+K opens a global search modal with categorized results (posts, profiles, media). Uses `SearchService` to hit `GET /api/search?q=`.
