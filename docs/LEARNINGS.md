# Learnings & Pain Points

This document records lessons learned during the construction of this project. It is meant to feed into improvements for the next iteration and to save other engineers from hitting the same issues.

---

## 1. TypeORM + sql.js: Entity Column Type Annotations

**Issue:** When using `sql.js` (SQLite via WebAssembly) as the TypeORM driver, nullable foreign key columns require explicit `type` annotations.

**Example:**
```typescript
// ❌ This causes issues with sql.js
@Column({ name: 'media_asset_id', nullable: true })
mediaAssetId: number | null;

// ✅ This works correctly
@Column({ type: 'int', name: 'media_asset_id', nullable: true })
mediaAssetId: number | null;
```

**Root cause:** The `sqljs` driver in TypeORM does not always infer column types correctly from TypeScript types, especially for nullable numeric foreign keys. Without the explicit `type: 'int'`, the column may be created without a type or with an incompatible type, causing errors during joins or saves.

**Affected entities:**
- `Post.mediaAssetId` (nullable FK to MediaAsset)
- `PostVersion.mediaAssetId` (nullable FK)
- `MediaAsset.width`, `MediaAsset.height` (nullable dimensions)

**Lesson:** Always use explicit `type` annotations on nullable columns when using sql.js. Cross-check `@Column` decorators after entity changes.

---

## 2. Build Commands: `tsc --build --force` vs `nest build`

**Issue:** The standard `nest build` command failed consistently in this project setup, while `tsc --build --force` works.

**Symptoms:**
```
> nest build
Error: Unable to compile TypeScript: ... (various TS errors)

> tsc --build --force --pretty
Compilation successful (no errors)
```

**Root cause:** `nest build` uses the NestJS build system which wraps `tsc` with additional logic (assets copying, webpack for some configs). In this project's configuration, `nest build` encounters issues — possibly related to the `tsconfig.json` incremental compilation settings or the TypeScript project reference setup.

**Workaround:** The `apps/api/package.json` build script explicitly uses `tsc --build --force` instead of `nest build`:

```json
{
  "scripts": {
    "build": "tsc --build --force",
    "start:dev": "nest build --watch"
  }
}
```

Note: `nest start:dev` with `--watch` still uses `nest build` under the hood for the watch mode, but the one-shot production build uses `tsc --build --force`.

**Lesson:** When NestJS's build system fails, fall back to `tsc --build --force`. If that works, the issue is in the Nest build pipeline, not in the TypeScript compilation itself. Also check whether `tsconfig.tsbuildinfo` has become stale — deleting it and rebuilding often fixes incremental compilation issues.

---

## 3. `synchronize: true` + Data Loss on Entity Change

**Issue:** Any change to an entity's column definition with `synchronize: true` can cause data loss.

**Example scenario:**
1. You have a `Post` entity with `title: string` (TypeORM defaults to `varchar(255)`)
2. You change it to `@Column({ type: 'text' }) title: string`
3. TypeORM drops and recreates the column during `synchronize`
4. All existing `title` values are lost

**Mitigation:** The project's dev database (`social-scheduler.sqlite`) is seeded on startup. If you lose data, just delete the `.sqlite` file and restart — the seed will repopulate it.

**Lesson:** For development, `synchronize: true` is convenient but dangerous with existing data. Either:
- Delete and re-seed after entity changes
- Use TypeORM migrations even in dev (`synchronize: false`)
- Or accept the data loss as a cost of speed

For this project, the auto-seed makes re-seeding painless, so this is an acceptable trade-off.

---

## 4. Angular Signals + HttpClient Subscription Memory Leaks

**Issue:** `HttpClient` subscriptions in services that use signals don't auto-unsubscribe when the service is destroyed (services are `providedIn: 'root'` singletons, so this is less of an issue). However, subscriptions in components that inject services need to be managed.

**Current pattern:**
```typescript
// In a service — fine because the service is a singleton (never destroyed)
this.http.get<T>('/api/endpoint').subscribe({
  next: (data) => this.mySignal.set(data),
  error: (err) => this.error.set(err.message),
});
```

**What's NOT done (but could be better):**
- No `takeUntilDestroyed()` operator
- No `finalize()` to handle cleanup
- No abort controller for cancelling in-flight requests on rapid navigation

**Lesson:** For a v1 this is acceptable because:
- Services are singletons (never destroyed), so subscriptions live as long as the app
- HTTP requests complete after one emission, so `subscribe()` auto-unsubscribes
- The app has a small number of concurrent requests

**For the next iteration:** Consider using Angular's `httpResource()` function (if available) or adding `takeUntilDestroyed()` with a destroy ref to be more explicit about subscription lifecycle management.

---

## 5. TypeORM Relation Loading: Two Approaches

**Issue:** Inconsistency between how relations are loaded in different service methods — some use `relations` object syntax, some use array syntax.

**Found in codebase:**
```typescript
// Approach 1: Object syntax (TypeORM 0.3+)
relations: { platformProfile: true, user: true, mediaAsset: true }

// Approach 2: Array syntax (older, but works)
relations: ['platformProfile', 'user', 'mediaAsset']
```

Both work, but mixing them creates confusion. The object syntax is type-safe and preferred in newer TypeORM versions.

**Lesson:** Standardize on object syntax (`relations: { relationName: true }`) for consistency. The array syntax is deprecated in TypeORM 0.4+.

---

## 6. Text Search Deduplication

**Issue:** The `QueryPostDto` supports text search via `q` parameter. The service searches both `title LIKE %q%` and `content LIKE %q%` simultaneously using TypeORM's `where: [{...title}, {...content}]` (OR query). A post that matches both conditions appears twice in results.

**Mitigation in code:**
```typescript
// Deduplication in posts.service.ts
if (query.q && data.length > 0) {
  const seen = new Set<number>();
  data = data.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
  total = data.length;
}
```

**Lesson:** TypeORM's `findAndCount` doesn't deduplicate OR queries automatically. The workaround works but has a subtle issue: `total` is adjusted to the deduplicated count, which means pagination metadata is slightly inaccurate (it reports fewer total items than actually exist). A better solution would be to use separate queries for title and content with a UNION, or use a raw query.

---

## 7. `@Column({ select: false })` Gotchas

**Issue:** The `password` field on the `User` entity has `select: false`, meaning it's excluded from SELECT queries by default. When logging in, we need to explicitly include it:

```typescript
const user = await this.userRepository.findOne({
  where: { email: dto.email },
  select: {
    id: true,
    name: true,
    email: true,
    password: true,    // Explicitly opt in
    role: true,
    organizationId: true,
  },
  relations: { organization: true },
});
```

**Gotcha:** If you forget the `select` override, the login always fails because bcrypt compares against `undefined`. The error message is generic `'Invalid credentials'`, which makes debugging harder.

**Lesson:** Always include `password` in the `select` object when loading a user for authentication. Consider adding a comment or a static method on the entity that returns the required select fields for login.

---

## 8. Angular Route Parameter Binding

**Issue:** Components read route parameters using `ActivatedRoute.snapshot.params['id']` in the constructor/effect:

```typescript
constructor() {
  effect(() => {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.postService.loadPost(id);
    }
  });
}
```

This works for initial navigation but does NOT react to parameter changes within the same component (e.g., navigating from `/posts/1` to `/posts/2`). Because `effect()` is set up in the constructor and `route.snapshot` is a one-time value, the effect doesn't re-run when the route changes.

**Current behavior:** If a user clicks from post 1's detail page to post 2's detail page, the component is destroyed and re-created (because the route path differs). This makes the current implementation work, but it's fragile.

**Lesson:** For a more robust solution, use `this.route.paramMap.subscribe()` or `toSignal(this.route.paramMap)` to reactively read route parameters. The snapshot approach is fine for the current routing structure but would break if routes were changed to use parameter reuse.

---

## 9. Tailwind v4: No `tailwind.config.js`

**Issue:** Tailwind CSS v4 replaces the traditional `tailwind.config.js` with CSS-based configuration using `@theme` directives.

**What changed from v3:**
- ❌ `tailwind.config.js` with `content`, `theme.extend`, `darkMode` options
- ✅ `@import "tailwindcss"` in `styles.css`
- ✅ `@theme { ... }` block for custom design tokens
- ✅ `@custom-variant dark (...)` for dark mode
- ✅ `@apply` still works
- ❌ No `@tailwind base/components/utilities` directives — just `@import "tailwindcss"`

**Migration issues encountered:**
1. The `safelist` option doesn't exist in the same way — classes are generated based on usage analysis
2. Platform-specific colors needed to be defined at the `--color-platform-*` level to work with Tailwind utility classes like `bg-platform-twitter`
3. Custom shadows and border radii need explicit `--shadow-*` and `--radius-*` variable definitions

**Lesson:** Tailwind v4 is a significant departure from v3 configuration. The `@theme` approach is cleaner but requires rethinking how design tokens are defined. The official Tailwind v4 upgrade guide is essential reading before making changes.

---

## 10. Auto-Seed Timing

**Issue:** The `SeedService` implements `OnModuleInit`, which runs during module initialization. If the database is empty, seeding happens before the server starts listening. However, if `synchronize: true` has a delay (creating tables takes a moment), there's a race condition where the seed queries might fail.

**Current behavior:** Works reliably because TypeORM creates tables synchronously before `OnModuleInit` fires. The seed check (`orgCount > 0`) also serves as a barrier — if tables aren't ready, the query throws, and the application fails to start with a clear error.

**Lesson:** The `synchronize: true` + `OnModuleInit` seed pattern is safe for development. For production (where `synchronize: false`), migrations run first, and a separate seed script handles data population.
