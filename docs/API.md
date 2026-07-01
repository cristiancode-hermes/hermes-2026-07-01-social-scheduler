# API Reference

Base URL: `http://localhost:3000/api`  
Swagger UI: `http://localhost:3000/api/docs`  
Auth: Bearer token in `Authorization` header (except register/login)

---

## Table of Contents

- [Auth](#auth)
- [Posts](#posts)
- [Platforms](#platforms)
- [Media](#media)
- [Analytics](#analytics)
- [Search](#search)
- [Dashboard](#dashboard)

---

## Auth

### POST /api/auth/register

Creates a new organization and admin user, returns a JWT token.

**Request Body:**
```json
{
  "name": "Ana Martínez",
  "email": "ana@techcorp.com",
  "password": "password123",
  "organizationName": "TechCorp"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Ana Martínez",
    "email": "ana@techcorp.com",
    "role": "admin",
    "organizationId": 1,
    "organizationName": "TechCorp"
  }
}
```

**Errors:**
| Status | Condition |
|---|---|
| 409 | Email already registered |

---

### POST /api/auth/login

Authenticates with email and password, returns a JWT token.

**Request Body:**
```json
{
  "email": "ana@techcorp.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Ana Martínez",
    "email": "ana@techcorp.com",
    "role": "admin",
    "organizationId": 1,
    "organizationName": "TechCorp"
  }
}
```

**Errors:**
| Status | Condition |
|---|---|
| 401 | Invalid credentials |

---

### GET /api/auth/me

Returns the currently authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "name": "Ana Martínez",
  "email": "ana@techcorp.com",
  "role": "admin",
  "organizationId": 1,
  "organizationName": "TechCorp",
  "createdAt": "2026-07-01T00:00:00.000Z"
}
```

---

## Posts

All endpoints require `Authorization: Bearer <token>`.

### GET /api/posts

List posts with optional filters. Supports pagination and search.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page |
| `platform` | string | — | Filter by platform (`twitter`, `linkedin`, `instagram`, `facebook`) |
| `status` | string | — | Filter by status (`draft`, `scheduled`, `published`, `failed`) |
| `q` | string | — | Search text (matches title and content) |
| `month` | integer | — | Filter by month (1-12, requires `year`) |
| `year` | integer | — | Filter by year (requires `month`) |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "🚀 We are launching!",
      "content": "Big news! TechCorp is launching...",
      "status": "published",
      "characterCount": 87,
      "scheduledAt": null,
      "publishedAt": "2026-06-26T00:00:00.000Z",
      "createdAt": "2026-07-01T00:00:00.000Z",
      "updatedAt": "2026-07-01T00:00:00.000Z",
      "platformProfile": {
        "id": 1,
        "platform": "twitter",
        "handle": "techcorp",
        "displayName": "TechCorp Twitter",
        "isActive": true
      },
      "user": { "id": 1, "name": "Ana Martínez" },
      "mediaAsset": null
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

When `q` (text search) is provided, the query searches both `title LIKE %q%` and `content LIKE %q%`. Results are deduplicated client-side (via posts service).

---

### GET /api/posts/calendar?month=&year=

Returns posts grouped by date for a given month/year.

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `month` | integer | yes | Month (1-12) |
| `year` | integer | yes | Year (e.g., 2026) |

**Response (200):**
```json
{
  "2026-07-03": [
    {
      "id": 2,
      "title": "Tech Tuesday Thread",
      "status": "scheduled",
      "scheduledAt": "2026-07-03T00:00:00.000Z",
      "platformProfile": {
        "id": 1,
        "platform": "twitter",
        "handle": "techcorp"
      }
    }
  ],
  "2026-07-08": [
    {
      "id": 6,
      "title": "Product Sneak Peek",
      "status": "scheduled",
      "scheduledAt": "2026-07-08T00:00:00.000Z",
      "platformProfile": {
        "id": 3,
        "platform": "instagram",
        "handle": "techcorp_ig"
      }
    }
  ]
}
```

The response is a JSON object where keys are date strings (`YYYY-MM-DD`) and values are arrays of posts scheduled for that day.

---

### GET /api/posts/:id

Get a single post by ID, including full relations and version history.

**Response (200):**
```json
{
  "id": 1,
  "title": "🚀 We are launching!",
  "content": "Big news! TechCorp is launching...",
  "status": "published",
  "characterCount": 87,
  "scheduledAt": null,
  "publishedAt": "2026-06-26T00:00:00.000Z",
  "createdAt": "2026-07-01T00:00:00.000Z",
  "updatedAt": "2026-07-01T00:00:00.000Z",
  "platformProfile": { "id": 1, "platform": "twitter", "handle": "techcorp", "displayName": "TechCorp Twitter", "isActive": true },
  "user": { "id": 1, "name": "Ana Martínez" },
  "mediaAsset": null,
  "versions": [
    {
      "id": 2,
      "versionNumber": 2,
      "content": "Big news! TechCorp is launching...\n\n[Edited: Added final call to action]",
      "changeDescription": "Added call to action",
      "createdAt": "2026-07-01T00:00:00.000Z",
      "user": { "id": 1, "name": "Ana Martínez" }
    },
    {
      "id": 1,
      "versionNumber": 1,
      "content": "Big news! TechCorp is launching...",
      "changeDescription": "Initial version",
      "createdAt": "2026-07-01T00:00:01.000Z",
      "user": { "id": 1, "name": "Ana Martínez" }
    }
  ]
}
```

**Errors:** 404 if post not found or belongs to another organization.

---

### POST /api/posts

Create a new post. Automatically creates version v1.

**Request Body:**
```json
{
  "title": "New Product Launch",
  "content": "Check out our amazing new product!",
  "platformProfileId": 1,
  "mediaAssetId": null,
  "status": "draft",
  "scheduledAt": "2026-07-15T10:00:00Z"
}
```

**Fields:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `title` | string | yes | — | Post title (max 255 chars) |
| `content` | string | yes | — | Post body text |
| `platformProfileId` | integer | yes | — | ID of target platform profile |
| `mediaAssetId` | integer | no | null | ID of attached media |
| `status` | string | no | `draft` | `draft`, `scheduled`, `published` |
| `scheduledAt` | string (ISO) | no | null | Publication datetime |

**Response (201):** Full post object with relations (same structure as GET /:id).

---

### PATCH /api/posts/:id

Update a post. If `content` changes, creates a new PostVersion with incremented version number.

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "content": "Updated content here",
  "status": "published",
  "mediaAssetId": 2,
  "platformProfileId": 2,
  "scheduledAt": "2026-07-20T10:00:00Z"
}
```

**Response (200):** Full updated post object with versions.

---

### PATCH /api/posts/:id/reschedule

Quick reschedule endpoint (designed for drag-and-drop from the calendar view). If the post is in `draft` status, it auto-promotes to `scheduled`.

**Request Body:**
```json
{
  "scheduledAt": "2026-07-20T15:00:00Z"
}
```

**Response (200):** Full updated post object.

---

### DELETE /api/posts/:id

Deletes a post and all its versions.

**Response (200):**
```json
{
  "deleted": true,
  "id": 1
}
```

**Errors:** 404 if post not found.

---

## Platforms

All endpoints require `Authorization: Bearer <token>`.

### GET /api/platforms

List all platform profiles for the current organization.

**Response (200):**
```json
[
  {
    "id": 1,
    "platform": "twitter",
    "handle": "techcorp",
    "displayName": "TechCorp Twitter",
    "avatarUrl": null,
    "isActive": true,
    "createdAt": "2026-07-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "platform": "linkedin",
    "handle": "techcorp",
    "displayName": "TechCorp LinkedIn",
    "isActive": true,
    "createdAt": "2026-07-01T00:00:00.000Z"
  }
]
```

### GET /api/platforms/:id

Get a single platform profile.

**Response (200):** Single platform profile object.  
**Errors:** 404 if not found.

### POST /api/platforms

Create a new platform profile.

**Request Body:**
```json
{
  "platform": "twitter",
  "handle": "techcorp",
  "displayName": "TechCorp Official",
  "avatarUrl": null,
  "isActive": true
}
```

**Response (201):** Created platform profile.

**Errors:**
| Status | Condition |
|---|---|
| 409 | Profile with same platform + handle already exists |

### PATCH /api/platforms/:id

Update platform profile fields.

**Request Body:** (all fields optional)
```json
{
  "handle": "techcorp_new",
  "displayName": "TechCorp Rebranded"
}
```

**Response (200):** Updated platform profile.

### DELETE /api/platforms/:id

**Response (200):**
```json
{ "deleted": true, "id": 1 }
```

---

## Media

All endpoints require `Authorization: Bearer <token>`.

### GET /api/media

List media assets with optional pagination and type filter.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page |
| `type` | string | — | Filter by MIME type substring (e.g., `image`) |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "filename": "1688000000-a1b2c3de-banner-producto.jpg",
      "originalName": "banner-producto.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 245000,
      "width": 1200,
      "height": 630,
      "url": "/uploads/1688000000-a1b2c3de-banner-producto.jpg",
      "createdAt": "2026-07-01T00:00:00.000Z"
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### GET /api/media/:id

Get a single media asset.

### POST /api/media/upload

Upload a file (multipart form-data).

**Form Data:**
| Field | Type | Description |
|---|---|---|
| `file` | file | The image file to upload |

**Response (201):** Created MediaAsset object.  
The file is saved to `uploads/<timestamp>-<random>_<originalName>` and served at `/uploads/<filename>`.

### DELETE /api/media/:id

Deletes the media asset record and the file from the filesystem.

**Response (200):**
```json
{ "deleted": true, "id": 1 }
```

---

## Analytics

All endpoints require `Authorization: Bearer <token>`.

### GET /api/analytics/kpi

Dashboard KPIs for the organization.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `days` | integer | 30 | Lookback period |

**Response (200):**
```json
{
  "totalPosts": 8,
  "publishedThisMonth": 4,
  "scheduled": 2,
  "engagementRate": 80
}
```

`engagementRate` = `(publishedThisMonth / nonDraftPosts) * 100`, where non-draft = total posts excluding drafts.

### GET /api/analytics/by-platform

Post counts broken down by platform profile.

**Query Parameters:**

| Param | Type | Default |
|---|---|---|
| `days` | integer | 30 |

**Response (200):**
```json
[
  {
    "platform": "twitter",
    "handle": "techcorp",
    "displayName": "TechCorp Twitter",
    "total": 2,
    "published": 1,
    "scheduled": 1
  },
  {
    "platform": "linkedin",
    "handle": "techcorp",
    "displayName": "TechCorp LinkedIn",
    "total": 2,
    "published": 1,
    "scheduled": 0
  }
]
```

### GET /api/analytics/recent

Most recently published posts.

**Query Parameters:**

| Param | Type | Default |
|---|---|---|
| `limit` | integer | 5 |

**Response (200):**
```json
[
  {
    "id": 3,
    "title": "Behind the Scenes",
    "content": "A sneak peek at our new office space!",
    "status": "published",
    "publishedAt": "2026-06-30T00:00:00.000Z",
    "platformProfile": { "id": 3, "platform": "instagram", "handle": "techcorp_ig" },
    "user": { "id": 1, "name": "Ana Martínez" }
  }
]
```

---

## Search

All endpoints require `Authorization: Bearer <token>`.

### GET /api/search?q=

Global search across posts (by title and content) and platform profiles (by handle and display name).

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | — | Search query (required) |
| `limit` | integer | 10 | Max results |

**Response (200):**
```json
[
  {
    "type": "post",
    "id": 1,
    "title": "🚀 We are launching!",
    "content": "Big news! TechCorp is launching our new AI-powered platform next week...",
    "platform": "twitter",
    "status": "published",
    "scheduledAt": null
  },
  {
    "type": "platform",
    "id": 1,
    "platform": "twitter",
    "handle": "techcorp",
    "displayName": "TechCorp Twitter",
    "isActive": true
  }
]
```

Search is performed in priority order:
1. Posts matching by title (up to limit)
2. Posts matching by content, deduplicated (filling remaining)
3. Platforms matching by handle or displayName (filling remaining)

---

## Dashboard

All endpoints require `Authorization: Bearer <token>`.

### GET /api/dashboard/summary

Complete dashboard summary combining KPIs, platform breakdown, and recent posts.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `days` | integer | 30 | Lookback period |

**Response (200):**
```json
{
  "kpi": {
    "totalPosts": 8,
    "publishedThisPeriod": 4,
    "scheduled": 2,
    "drafts": 2,
    "failed": 0
  },
  "byPlatform": [
    {
      "platform": "twitter",
      "handle": "techcorp",
      "displayName": "TechCorp Twitter",
      "total": 2
    }
  ],
  "recentPosts": [
    {
      "id": 5,
      "title": "Behind the Scenes",
      "status": "published",
      "publishedAt": "2026-06-30T00:00:00.000Z",
      "platformProfile": { "id": 3, "platform": "instagram" }
    }
  ],
  "periodDays": 30
}
```

---

## Error Response Format

All errors follow a consistent structure:

```json
{
  "statusCode": 404,
  "message": "Post not found",
  "timestamp": "2026-07-01T12:00:00.000Z"
}
```

- **Validation errors**: `message` may contain a semicolon-joined string of validation failures
- **Auth errors**: 401 with `"Invalid credentials"` message
- **Conflict errors**: 409 with descriptive message
- **Server errors**: 500 with `"Internal server error"` (stack trace logged server-side only)
