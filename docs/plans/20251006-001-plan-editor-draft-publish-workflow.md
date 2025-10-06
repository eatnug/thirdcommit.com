# 20251006-001-PLAN: Editor Draft/Publish Workflow Restructuring

**Created**: 2025-10-06
**Status**: PLAN
**Based on**: [docs/specs/20251006-001-spec-editor-draft-publish-workflow.md](../specs/20251006-001-spec-editor-draft-publish-workflow.md)

---

## Architecture Design

### Overview

This implementation restructures the blog post editor to support a robust draft/publish workflow using **stable identifiers (ULID)** and **explicit status management**. The system will transition from title-based file naming to ULID-prefixed naming (`{ulid}-{slug}.md`), enabling post renaming, stable references, and a clear separation between "save" and "publish" actions.

**Core Architectural Principles:**
- **Hexagonal Architecture (Ports & Adapters)**: Maintain TIER separation (Domain → Infrastructure → Application)
- **Stable Identifiers**: ULID for internal operations, slug for public URLs
- **State Machine**: Explicit `status` enum replaces boolean `draft` field
- **Timestamp Tracking**: Track `created_at`, `updated_at`, `published_at` for auditability
- **Backward Compatibility**: Support reading old format (title-based filenames, `draft` boolean)

---

### System Components

#### Domain Layer (TIER 3)

**1. Post Entity** ([src/domain/blog/entities/post.entity.ts](../../src/domain/blog/entities/post.entity.ts))
- Add `id: string` (ULID identifier)
- Add `slug: string` (URL-friendly identifier, derived from title)
- Replace `draft: boolean` with `status: 'draft' | 'published'`
- Add `updated_at: Date` (last modification timestamp)
- Add `published_at: Date | null` (first publish timestamp)
- Keep existing fields: `title`, `created_at`, `tags`, `description`, `content`, `html`, `readingTime`

**2. PostFormData Interface** ([src/domain/blog/entities/post.entity.ts](../../src/domain/blog/entities/post.entity.ts))
- Add `id?: string` (optional for create vs update detection)
- Replace `draft: boolean` with `status: 'draft' | 'published'`
- Keep existing: `title`, `description`, `tags`, `content`

**3. PostVisibilityPolicy** ([src/domain/blog/policies/post-visibility.policy.ts](../../src/domain/blog/policies/post-visibility.policy.ts))
- Update `shouldShowInPublicList()` to check `status === 'published'` instead of `!draft`

**4. Use Cases**
- **New**: `publishPostUseCase(id: string)` - Change status from draft to published
- **New**: `getPostByIdUseCase(id: string)` - Load post by ULID
- **Updated**: `savePostUseCase(input)` - Detect create vs update based on `id` presence
- **Updated**: `getDraftsUseCase()` - Filter by `status === 'draft'`
- **Updated**: `getPostsUseCase()` - Filter by `status === 'published'` in production

---

#### Infrastructure Layer (TIER 2)

**1. IPostRepository Port** ([src/domain/blog/ports/post-repository.port.ts](../../src/domain/blog/ports/post-repository.port.ts))
- Add `getPostById(id: string): Promise<Post | null>`
- Add `updatePost(id: string, data: Partial<Post>): Promise<Post>`
- Keep existing: `getPosts()`, `getPostBySlug()`, `createPost()`, `deletePost()`

**2. FileSystemPostRepository** ([src/infrastructure/blog/repositories/post.filesystem.repository.ts](../../src/infrastructure/blog/repositories/post.filesystem.repository.ts))
- **File Naming Strategy**: Use `{ulid}-{slug}.md` format (e.g., `01ARZ3NDEKTSV4-my-blog-post.md`)
  - ULID prefix ensures uniqueness and stable identification
  - Slug suffix provides human-readable filenames
  - Title changes regenerate slug, ULID remains constant
- **Backward Compatibility**: Support reading old `{title}.md` files
- **Frontmatter**: Store `id`, `slug`, `status`, `updated_at`, `published_at`
- **Operations**:
  - `createPost()`: Generate ULID, slugify title, write to `{ulid}-{slug}.md`
  - `updatePost()`: If title changed, rename file to `{ulid}-{new-slug}.md`, update frontmatter + content
  - `getPostById()`: Scan directory for files starting with `{ulid}-`, direct read
  - `getPostBySlug()`: Parse all frontmatter to find matching slug (fallback lookup)

**3. PostDTO** ([src/infrastructure/blog/dto/post.dto.ts](../../src/infrastructure/blog/dto/post.dto.ts))
- Add `id`, `slug`, `status`, `updated_at`, `published_at` fields
- Support parsing old format: `draft` boolean → `status` enum

---

#### Application Layer (TIER 1)

**1. API Endpoints**

**New Endpoints:**
- `PUT /api/posts/[id]` - Update existing post (draft or published)
- `POST /api/posts/[id]/publish` - Publish a draft post

**Updated Endpoints:**
- `POST /api/posts` - Create new post (always starts as draft, returns `id`)
- `GET /api/drafts` - Filter by `status === 'draft'`, sort by `updated_at` DESC

**2. Editor UI**

**Editor Actions** ([app/editor/_components/editor-actions.tsx](../../app/editor/_components/editor-actions.tsx))
- Remove "Save Post" and "Save Draft" buttons
- Add single "Save" button (preserves current status)
- Add "Publish" button (changes draft → published, disabled if already published)

**Editor ViewModel** ([app/editor/use-editor-view-model.ts](../../app/editor/use-editor-view-model.ts))
- Remove autosave logic (lines 53-87)
- Remove localStorage persistence (lines 44-51, 141-142)
- Add `currentPostId: string | null` state (tracks edit mode)
- Load post by ID when `?id` query param exists
- Update save logic to call `PUT /api/posts/[id]` if `currentPostId` exists, else `POST /api/posts`

**Drafts Dropdown** ([app/editor/_components/drafts-dropdown.tsx](../../app/editor/_components/drafts-dropdown.tsx))
- Filter to show only `status === 'draft'`
- Sort by `updated_at` DESC
- Link to `/editor?id={post.id}` when clicked

**3. Post Detail Page** ([app/(with-nav)/posts/[slug]/page.tsx](../../app/(with-nav)/posts/[slug]/page.tsx))
- Add "Edit" button (top-right corner)
- Only visible when `NODE_ENV === 'development'`
- Link to `/editor?id={post.id}`

**4. Blog Listing** ([app/(with-nav)/blog/page.tsx](../../app/(with-nav)/blog/page.tsx))
- In production: show only `status === 'published'`
- In development: show all posts (both draft and published)

---

### Data Flow

#### Create New Post Flow
```
User opens /editor
  → Form empty, currentPostId = null
  → User fills title, content
  → User clicks "Save" button
  → Call POST /api/posts
  → Generate ULID, slugify title
  → Write to storage/posts/{ulid}-{slug}.md
  → Frontmatter: status='draft', created_at=now, updated_at=now, published_at=null
  → Return { id, slug, title, status, filename }
  → Update UI: Set currentPostId = id, show success message
```

#### Update Existing Post Flow
```
User clicks draft in dropdown OR "Edit" button on post
  → Navigate to /editor?id={ulid}
  → Load post via GET /api/posts/[id]
  → Populate form, set currentPostId = id
  → User edits content (including title)
  → User clicks "Save" button
  → Call PUT /api/posts/[id]
  → Find file starting with {ulid}-
  → If title changed: rename file from {ulid}-{old-slug}.md to {ulid}-{new-slug}.md
  → Update frontmatter + content, update updated_at = now
  → Preserve created_at, published_at, status
  → Write file, return updated post
  → Show success message
```

#### Publish Post Flow
```
User clicks "Publish" button
  → Call POST /api/posts/[id]/publish
  → publishPostUseCase(id)
  → Read post by ID
  → Validate status === 'draft'
  → Update status = 'published'
  → Set published_at = now (if null)
  → Update updated_at = now
  → Write file
  → Return updated post
  → Update UI: Disable publish button, show "Already Published"
  → Remove from drafts dropdown
```

#### Load Post in Editor Flow
```
Query param ?id={ulid} exists
  → Call GET /api/posts/[id]
  → getPostByIdUseCase(id)
  → repository.getPostById(id)
  → Find file starting with {ulid}- in storage/posts/
  → Read storage/posts/{ulid}-{slug}.md
  → Parse frontmatter + content
  → Return Post entity
  → Populate form with data
  → Set currentPostId = id
  → Show "Editing: {title}" indicator
```

---

### Architecture Diagram (Text)

```
┌──────────────────────────────────────────────────���─────────────┐
│                    Application Layer (TIER 1)                   │
│                                                                  │
│  ┌────────────────────┐        ┌─────────────────────────────┐ │
│  │ Editor Page        │        │ Post Detail Page            │ │
│  │ /editor            │        │ /posts/[slug]               │ │
│  │                    │        │                             │ │
│  │ - Form State       │        │ - "Edit" Button (dev only)  │ │
│  │ - currentPostId    │◄───────┤ - Link: /editor?id={id}     │ │
│  │ - Save/Publish     │        │                             │ │
│  └─────────┬──────────┘        └─────────────────────────────┘ │
│            │                                                     │
│            │ HTTP (REST)                                         │
│            │                                                     │
│  ┌─────────┴──────────────────────────────────────────────────┐│
│  │ API Routes                                                  ││
│  │                                                             ││
│  │ POST   /api/posts           → Create post                  ││
│  │ PUT    /api/posts/[id]      → Update post                  ││
│  │ POST   /api/posts/[id]/publish → Publish post              ││
│  │ GET    /api/posts/[id]      → Get post by ID               ││
│  │ GET    /api/drafts          → Get drafts (status='draft')  ││
│  │ DELETE /api/posts/[slug]    → Delete post                  ││
│  └─────────────────────────────────────────────────────────────┘│
└────────────────────────────────┬───────────────────────────────┘
                                 │
┌────────────────────────────────┴───────────────────────────────┐
│                    Domain Layer (TIER 3)                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Use Cases                                                 │  │
│  │                                                           │  │
│  │ - savePostUseCase(input)    → Create or Update          │  │
│  │ - publishPostUseCase(id)    → Draft → Published         │  │
│  │ - getPostByIdUseCase(id)    → Load by ULID              │  │
│  │ - getDraftsUseCase()        → Filter by status='draft'  │  │
│  │ - getPostsUseCase()         → Filter by status='pub...' │  │
│  └───────────────────┬──────────────────────────────────────┘  │
│                      │                                          │
│  ┌───────────────────┴──────────────────────────────────────┐  │
│  │ Post Entity                                              │  │
│  │                                                           │  │
│  │ - id: string (ULID)                                      │  │
│  │ - slug: string (URL-friendly)                            │  │
│  │ - status: 'draft' | 'published'                          │  │
│  │ - created_at, updated_at, published_at                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PostVisibilityPolicy                                      │  │
│  │                                                           │  │
│  │ - shouldShowInPublicList(post)                           │  │
│  │   → Check status === 'published' && NODE_ENV              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ IPostRepository (Port)                                    │  │
│  │                                                           │  │
│  │ - getPostById(id)                                         │  │
│  │ - updatePost(id, data)                                    │  │
│  │ - createPost(data)                                        │  │
│  │ - getPosts()                                              │  │
│  └───────────────────┬──────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────┘
                         │
┌────────────────────────┴───────────────────────────────────────┐
│                 Infrastructure Layer (TIER 2)                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ FileSystemPostRepository (Adapter)                        │  │
│  │                                                           │  │
│  │ - createPost(): Generate ULID, write {ulid}-{slug}.md    │  │
│  │ - updatePost(): Find by {ulid}-, rename if title changed │  │
│  │ - getPostById(): Scan for {ulid}- prefix                 │  │
│  │ - getPostBySlug(): Scan frontmatter for matching slug    │  │
│  │ - Backward compat: Read old {title}.md files             │  │
│  └───────────────────┬──────────────────────────────────────┘  │
│                      │                                          │
│                      ▼                                          │
│  ┌────────────────────────────────────────────��─────────────┐  │
│  │ File System: storage/posts/                              │  │
│  │                                                           │  │
│  │ - 01ARZ3NDEKTSV4-my-blog-post.md                         │  │
│  │ - 01ARZ4NDEKTSV4-another-post.md                         │  │
│  │                                                           │  │
│  │ Frontmatter Example (01ARZ3NDEKTSV4-my-blog-post.md):    │  │
│  │   id: "01ARZ3NDEKTSV4RRFFQ69G5FAV"                        │  │
│  │   slug: "my-blog-post"                                    │  │
│  │   title: "My Blog Post"                                   │  │
│  │   status: "draft"                                         │  │
│  │   created_at: "2025-10-06T12:00:00.000Z"                 │  │
│  │   updated_at: "2025-10-06T13:30:00.000Z"                 │  │
│  │   published_at: null                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Contract

### REST Endpoints

#### 1. Create Post
**POST /api/posts**

**Description**: Create a new post (always starts as draft)

**Auth**: Development mode only (`NODE_ENV === 'development'`)

**Request**:
```typescript
{
  title: string          // Required, max 200 chars
  description?: string   // Optional, max 160 chars
  tags: string[]         // Array of tag strings
  content: string        // Markdown content
}
```

**Response** (201 Created):
```typescript
{
  id: string              // Generated ULID: "01ARZ3NDEKTSV4RRFFQ69G5FAV"
  slug: string            // Generated from title: "my-blog-post"
  title: string
  status: 'draft'         // Always draft on create
  created_at: string      // ISO timestamp
  updated_at: string      // ISO timestamp (same as created_at)
  published_at: null
  filename: string        // "{ulid}-{slug}.md"
}
```

**Errors**:
- `400 Bad Request`: Missing title or content
- `404 Not Found`: Not in development mode
- `500 Internal Server Error`: File system error

---

#### 2. Update Post
**PUT /api/posts/[id]**

**Description**: Update existing post (draft or published)

**Auth**: Development mode only

**Request**:
```typescript
{
  title: string          // Can change title (regenerates slug)
  description?: string
  tags: string[]
  content: string
}
```

**Response** (200 OK):
```typescript
{
  id: string              // Unchanged
  slug: string            // Regenerated if title changed
  title: string
  status: 'draft' | 'published'  // Unchanged
  created_at: string      // Unchanged
  updated_at: string      // Updated to now
  published_at: string | null  // Unchanged
}
```

**Errors**:
- `400 Bad Request`: Invalid input
- `404 Not Found`: Post not found OR not in dev mode
- `500 Internal Server Error`: File system error

---

#### 3. Publish Post
**POST /api/posts/[id]/publish**

**Description**: Change post status from draft to published

**Auth**: Development mode only

**Request**: Empty body `{}`

**Response** (200 OK):
```typescript
{
  id: string
  slug: string
  title: string
  status: 'published'     // Changed from 'draft'
  created_at: string      // Unchanged
  updated_at: string      // Updated to now
  published_at: string    // Set to now if was null
}
```

**Errors**:
- `400 Bad Request`: Post is already published
- `404 Not Found`: Post not found OR not in dev mode
- `500 Internal Server Error`: File system error

---

#### 4. Get Post by ID
**GET /api/posts/[id]**

**Description**: Retrieve post by ULID

**Auth**: Development mode only

**Response** (200 OK):
```typescript
{
  id: string
  slug: string
  title: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
  published_at: string | null
  tags: string[]
  description: string
  content: string          // Raw markdown
  html: string             // Rendered HTML
  readingTime: string      // "5 min read"
}
```

**Errors**:
- `404 Not Found`: Post not found OR not in dev mode

---

#### 5. Get Drafts
**GET /api/drafts**

**Description**: List all draft posts

**Auth**: Development mode only

**Response** (200 OK):
```typescript
{
  drafts: Array<{
    id: string
    slug: string
    title: string
    status: 'draft'        // Always 'draft'
    updated_at: string     // For sorting (DESC)
    tags: string[]
    description: string
  }>
}
```

**Errors**:
- `404 Not Found`: Not in development mode

---

### Data Models

#### Post Entity (Domain)

```typescript
// src/domain/blog/entities/post.entity.ts
export interface Post {
  id: string              // ULID identifier (26 chars)
  slug: string            // URL-friendly slug (derived from title)
  title: string
  status: 'draft' | 'published'  // Replaces draft: boolean
  created_at: Date
  updated_at: Date        // Last modification time
  published_at: Date | null  // First publish time (null if never published)
  tags: string[]
  description: string
  content: string         // Raw markdown
  html: string            // Rendered HTML
  readingTime: string     // "5 min read"
}

export interface PostFormData {
  id?: string             // Optional: presence indicates update vs create
  title: string
  description: string
  tags: string            // Comma-separated string (UI format)
  content: string
  status: 'draft' | 'published'
}
```

---

#### Frontmatter Format

```yaml
---
id: "01ARZ3NDEKTSV4RRFFQ69G5FAV"
slug: "my-blog-post"
title: "My Blog Post"
status: "draft"
created_at: "2025-10-06T12:00:00.000Z"
updated_at: "2025-10-06T13:30:00.000Z"
published_at: null
tags: ["typescript", "nextjs"]
description: "A description of my blog post"
---

Post content here in markdown...
```

**Backward Compatibility:**
- If `status` field is missing, derive from `draft: boolean`
  - `draft: true` → `status: 'draft'`
  - `draft: false` → `status: 'published'`
- If `id` field is missing, treat as legacy post (read-only or migrate)
- If `updated_at` missing, use `created_at`
- If `published_at` missing and status is published, use `created_at`

---

## Task Breakdown

### Phase 1: Domain Layer (TIER 3) - Foundation

#### Task 1.1: Install ULID Package
**ID**: `20251006-001-T01`
**Complexity**: S (15 min)
**Dependencies**: None

**Description**: Install `ulid` package for ULID generation

**Steps**:
- Run `npm install ulid`
- Verify package in `package.json`

**Acceptance Criteria**:
- `ulid` package installed and listed in dependencies

---

#### Task 1.2: Update Post Entity
**ID**: `20251006-001-T02`
**Complexity**: S (30 min)
**Dependencies**: None

**Description**: Add new fields to Post and PostFormData interfaces

**Files to modify**:
- [src/domain/blog/entities/post.entity.ts](../../src/domain/blog/entities/post.entity.ts)

**Steps**:
- Add `id: string` field
- Add `slug: string` field
- Replace `draft: boolean` with `status: 'draft' | 'published'`
- Add `updated_at: Date` field
- Add `published_at: Date | null` field
- Update `PostFormData` interface similarly (keep `id` optional)

**Acceptance Criteria**:
- AC1: Post entity has `id`, `slug`, `status`, `updated_at`, `published_at`
- AC2: `status` is enum type, not boolean

---

#### Task 1.3: Update PostVisibilityPolicy
**ID**: `20251006-001-T03`
**Complexity**: S (15 min)
**Dependencies**: T02

**Description**: Update visibility policy to use `status` instead of `draft`

**Files to modify**:
- [src/domain/blog/policies/post-visibility.policy.ts](../../src/domain/blog/policies/post-visibility.policy.ts)

**Steps**:
- Update `shouldShowInPublicList()` to check `status === 'published'`
- Remove checks for `draft` boolean

**Acceptance Criteria**:
- AC2: Policy filters by `status === 'published'`

---

#### Task 1.4: Update IPostRepository Port
**ID**: `20251006-001-T04`
**Complexity**: S (20 min)
**Dependencies**: T02

**Description**: Add new methods to repository interface

**Files to modify**:
- [src/domain/blog/ports/post-repository.port.ts](../../src/domain/blog/ports/post-repository.port.ts)

**Steps**:
- Add `getPostById(id: string): Promise<Post | null>`
- Add `updatePost(id: string, data: Partial<Post>): Promise<Post>`
- Update `createPost()` return type to include `id`

**Acceptance Criteria**:
- AC11: IPostRepository has `getPostById()` and `updatePost()`

---

#### Task 1.5: Create Publish Post Use Case
**ID**: `20251006-001-T05`
**Complexity**: M (1 hour)
**Dependencies**: T04

**Description**: Create use case to publish a draft post

**Files to create**:
- [src/domain/blog/use-cases/publish-post.use-case.ts](../../src/domain/blog/use-cases/publish-post.use-case.ts)

**Steps**:
- Create `publishPostUseCase(id: string)` function
- Load post by ID
- Validate `status === 'draft'` (error if already published)
- Update `status = 'published'`
- Set `published_at = new Date()` if null
- Update `updated_at = new Date()`
- Save post via repository
- Return updated post

**Acceptance Criteria**:
- AC6: Publish use case changes draft to published
- AC3: Sets `published_at` timestamp on first publish

---

#### Task 1.6: Create Get Post by ID Use Case
**ID**: `20251006-001-T06`
**Complexity**: S (30 min)
**Dependencies**: T04

**Description**: Create use case to load post by ULID

**Files to create**:
- [src/domain/blog/use-cases/get-post-by-id.use-case.ts](../../src/domain/blog/use-cases/get-post-by-id.use-case.ts)

**Steps**:
- Create `getPostByIdUseCase(id: string)` function
- Call `repository.getPostById(id)`
- Return post or null
- Handle errors gracefully

**Acceptance Criteria**:
- AC4: Can retrieve post by ULID

---

#### Task 1.7: Update Save Post Use Case
**ID**: `20251006-001-T07`
**Complexity**: M (1 hour)
**Dependencies**: T04

**Description**: Update save use case to detect create vs update

**Files to modify**:
- [src/domain/blog/use-cases/save-post.use-case.ts](../../src/domain/blog/use-cases/save-post.use-case.ts)

**Steps**:
- Check if `input.id` exists
- If `id` exists: call `repository.updatePost(id, data)`
- If no `id`: call `repository.createPost(data)`
- Update timestamp logic (preserve `created_at`, update `updated_at`)
- Return created/updated post

**Acceptance Criteria**:
- AC4: Save use case handles both create and update
- AC3: Timestamps managed correctly

---

#### Task 1.8: Update Get Drafts Use Case
**ID**: `20251006-001-T08`
**Complexity**: S (20 min)
**Dependencies**: T02

**Description**: Filter drafts by status enum

**Files to modify**:
- [src/domain/blog/use-cases/get-drafts.use-case.ts](../../src/domain/blog/use-cases/get-drafts.use-case.ts)

**Steps**:
- Update filter to check `status === 'draft'`
- Remove checks for `draft` boolean
- Sort by `updated_at` DESC

**Acceptance Criteria**:
- AC7: Drafts filtered by `status === 'draft'`

---

#### Task 1.9: Update Get Posts Use Case
**ID**: `20251006-001-T09`
**Complexity**: S (20 min)
**Dependencies**: T03

**Description**: Use visibility policy for filtering

**Files to modify**:
- [src/domain/blog/use-cases/get-posts.use-case.ts](../../src/domain/blog/use-cases/get-posts.use-case.ts)

**Steps**:
- Apply `PostVisibilityPolicy.shouldShowInPublicList()` filter
- Ensure production shows only published posts

**Acceptance Criteria**:
- AC10: Blog listing filters by status

---

### Phase 2: Infrastructure Layer (TIER 2) - Repository

#### Task 2.1: Update PostDTO
**ID**: `20251006-001-T10`
**Complexity**: S (30 min)
**Dependencies**: T02

**Description**: Add new fields to DTO and mapping logic

**Files to modify**:
- [src/infrastructure/blog/dto/post.dto.ts](../../src/infrastructure/blog/dto/post.dto.ts)

**Steps**:
- Add `id`, `slug`, `status`, `updated_at`, `published_at` to PostDto
- Update `postDtoToDomain()` mapping function
- Add backward compatibility: map `draft` boolean to `status` if `status` missing

**Acceptance Criteria**:
- AC2: DTO supports status enum
- AC2: Backward compatible with `draft` boolean

---

#### Task 2.2: Implement Create Post with ULID
**ID**: `20251006-001-T11`
**Complexity**: M (1.5 hours)
**Dependencies**: T01, T10

**Description**: Update createPost to generate ULID and slug

**Files to modify**:
- [src/infrastructure/blog/repositories/post.filesystem.repository.ts](../../src/infrastructure/blog/repositories/post.filesystem.repository.ts)

**Steps**:
- Import `ulid` package
- Generate ULID: `const id = ulid()`
- Generate slug from title using slugify logic
- Create filename: `${id}-${slug}.md`
- Add `id`, `slug`, `status`, `updated_at`, `published_at` to frontmatter
- Write file with new format
- Return `{ id, slug, title, status, filename }`

**Acceptance Criteria**:
- AC1: Generate ULID for new posts
- AC1: Use ULID-slug format for filename
- AC3: Set timestamps on creation

---

#### Task 2.3: Implement Get Post by ID
**ID**: `20251006-001-T12`
**Complexity**: M (1 hour)
**Dependencies**: T11

**Description**: Implement getPostById() in repository

**Files to modify**:
- [src/infrastructure/blog/repositories/post.filesystem.repository.ts](../../src/infrastructure/blog/repositories/post.filesystem.repository.ts)

**Steps**:
- Implement `getPostById(id: string)` method
- Scan `storage/posts/` directory for files starting with `${id}-`
- If found, read file and parse frontmatter
- Map to Post entity
- Return null if not found

**Acceptance Criteria**:
- AC11: Repository can get post by ID
- Finds file by ULID prefix
- Handle missing files gracefully

---

#### Task 2.4: Implement Update Post
**ID**: `20251006-001-T13`
**Complexity**: L (2 hours)
**Dependencies**: T12

**Description**: Implement updatePost() in repository

**Files to modify**:
- [src/infrastructure/blog/repositories/post.filesystem.repository.ts](../../src/infrastructure/blog/repositories/post.filesystem.repository.ts)

**Steps**:
- Implement `updatePost(id: string, data: Partial<Post>)` method
- Find existing file by scanning for `${id}-` prefix
- Return 404 if not found
- Parse existing frontmatter
- Merge new data with existing
- If title changed: regenerate slug
- If slug changed: rename file from `${id}-${oldSlug}.md` to `${id}-${newSlug}.md`
- Update `updated_at` timestamp
- Preserve `created_at` and `published_at`
- Write updated frontmatter + content
- Return updated post

**Acceptance Criteria**:
- AC4: Repository can update existing posts
- AC3: Preserves created_at and published_at
- Renames file when title changes

---

#### Task 2.5: Add Backward Compatibility for Old Files
**ID**: `20251006-001-T14`
**Complexity**: M (1 hour)
**Dependencies**: T13

**Description**: Support reading old title-based filenames

**Files to modify**:
- [src/infrastructure/blog/repositories/post.filesystem.repository.ts](../../src/infrastructure/blog/repositories/post.filesystem.repository.ts)

**Steps**:
- In `getPosts()`: Handle both `{ulid}-{slug}.md` and `{title}.md` files
- Detect legacy files (no `-` separator in filename)
- In frontmatter parsing: Map `draft` boolean to `status` if `status` missing
- Default missing timestamps: `updated_at = created_at`, `published_at = null`
- Generate temporary ID/slug for legacy files (for reading only)
- Log warning for legacy files

**Acceptance Criteria**:
- AC2: Read old posts with `draft` boolean
- AC11: Support old title-based filenames
- Legacy files readable but flagged for migration

---

### Phase 3: Application Layer (TIER 1) - API Endpoints

#### Task 3.1: Update POST /api/posts
**ID**: `20251006-001-T15`
**Complexity**: M (1 hour)
**Dependencies**: T07, T11

**Description**: Update create endpoint to return ULID

**Files to modify**:
- [app/api/posts/route.ts](../../app/api/posts/route.ts)

**Steps**:
- Update to call `savePostUseCase` (which calls createPost internally)
- Return `id`, `slug`, `status`, timestamps in response
- Set status to `'draft'` by default
- Validate input (title, content required)

**Acceptance Criteria**:
- AC1: Create endpoint generates ULID
- Returns all new fields in response

---

#### Task 3.2: Create PUT /api/posts/[id]
**ID**: `20251006-001-T16`
**Complexity**: M (1 hour)
**Dependencies**: T07, T13

**Description**: Create update endpoint

**Files to create**:
- [app/api/posts/[id]/route.ts](../../app/api/posts/[id]/route.ts)

**Steps**:
- Create `PUT` handler
- Extract `id` from URL params
- Validate input (title, content, tags, description)
- Call `savePostUseCase` with `id` in input
- Return updated post with 200 status
- Handle 404 if post not found

**Acceptance Criteria**:
- AC4: Update endpoint works for drafts and published posts
- Returns updated timestamps

---

#### Task 3.3: Create POST /api/posts/[id]/publish
**ID**: `20251006-001-T17`
**Complexity**: M (45 min)
**Dependencies**: T05

**Description**: Create publish endpoint

**Files to create**:
- [app/api/posts/[id]/publish/route.ts](../../app/api/posts/[id]/publish/route.ts)

**Steps**:
- Create `POST` handler
- Extract `id` from URL params
- Call `publishPostUseCase(id)`
- Return updated post with 200 status
- Handle 400 if already published
- Handle 404 if post not found

**Acceptance Criteria**:
- AC6: Publish endpoint changes status to published
- Returns `published_at` timestamp

---

#### Task 3.4: Update GET /api/drafts
**ID**: `20251006-001-T18`
**Complexity**: S (30 min)
**Dependencies**: T08

**Description**: Update drafts endpoint to filter by status

**Files to modify**:
- [app/api/drafts/route.ts](../../app/api/drafts/route.ts)

**Steps**:
- Call updated `getDraftsUseCase()` (already filters by status)
- Return drafts array with `id`, `slug`, `status`, `updated_at`
- Sort by `updated_at` DESC

**Acceptance Criteria**:
- AC7: Drafts endpoint returns only status='draft'
- Sorted by update time

---

#### Task 3.5: Create GET /api/posts/[id]
**ID**: `20251006-001-T19`
**Complexity**: S (30 min)
**Dependencies**: T06, T12

**Description**: Create endpoint to get post by ID

**Files to modify**:
- [app/api/posts/[id]/route.ts](../../app/api/posts/[id]/route.ts) (add GET handler)

**Steps**:
- Create `GET` handler
- Extract `id` from URL params
- Call `getPostByIdUseCase(id)`
- Return post with 200 status
- Handle 404 if post not found
- Only allow in dev mode

**Acceptance Criteria**:
- Can retrieve post by ULID via API
- Returns full post data

---

### Phase 4: Application Layer (TIER 1) - Editor UI

#### Task 4.1: Remove Autosave from ViewModel
**ID**: `20251006-001-T20`
**Complexity**: S (30 min)
**Dependencies**: None

**Description**: Remove autosave and localStorage logic

**Files to modify**:
- [app/editor/use-editor-view-model.ts](../../app/editor/use-editor-view-model.ts)

**Steps**:
- Remove `AUTOSAVE_KEY` constant (line 10)
- Remove `AUTOSAVE_INTERVAL` constant (line 11)
- Remove `lastAutosave` state (line 35)
- Remove autosave restoration effect (lines 53-71)
- Remove autosave interval effect (lines 74-87)
- Remove localStorage calls in `handleSave` (lines 141-142)
- Keep `hasUnsavedChanges` for beforeunload warning

**Acceptance Criteria**:
- AC9: No autosave logic remains
- AC9: No localStorage usage

---

#### Task 4.2: Add Current Post ID State
**ID**: `20251006-001-T21`
**Complexity**: S (20 min)
**Dependencies**: T20

**Description**: Add state to track edit mode

**Files to modify**:
- [app/editor/use-editor-view-model.ts](../../app/editor/use-editor-view-model.ts)

**Steps**:
- Add `currentPostId: string | null` state
- Add `setCurrentPostId` setter
- Update `handleNewDraft` to reset `currentPostId = null`

**Acceptance Criteria**:
- State tracks currently editing post ID

---

#### Task 4.3: Load Post by ID in Editor
**ID**: `20251006-001-T22`
**Complexity**: M (1.5 hours)
**Dependencies**: T21, T19

**Description**: Load post when `?id` query param exists

**Files to modify**:
- [app/editor/page.tsx](../../app/editor/page.tsx)
- [app/editor/use-editor-view-model.ts](../../app/editor/use-editor-view-model.ts)

**Steps**:
- In `page.tsx`: Extract `id` from `searchParams`
- Pass `id` to ViewModel
- In ViewModel: Add `useEffect` to load post if `id` provided
- Fetch post via `GET /api/posts/[id]`
- Populate form data with post fields
- Set `currentPostId = id`
- Show "Editing: {title}" indicator in UI

**Acceptance Criteria**:
- AC8: Editor loads post when `?id` query param exists
- Form populated with existing data

---

#### Task 4.4: Update Save Logic
**ID**: `20251006-001-T23`
**Complexity**: M (1 hour)
**Dependencies**: T22, T16

**Description**: Update save to call create or update endpoint

**Files to modify**:
- [app/editor/use-editor-view-model.ts](../../app/editor/use-editor-view-model.ts)

**Steps**:
- Update `handleSave()` function
- If `currentPostId` exists: call `PUT /api/posts/[id]`
- If no `currentPostId`: call `POST /api/posts`
- After successful create: set `currentPostId = response.id`
- Preserve post status (draft stays draft, published stays published)

**Acceptance Criteria**:
- AC5: Save button preserves post status
- AC4: Can update existing posts

---

#### Task 4.5: Update Editor Actions Component
**ID**: `20251006-001-T24`
**Complexity**: M (1 hour)
**Dependencies**: T23, T17

**Description**: Replace save buttons with Save + Publish

**Files to modify**:
- [app/editor/_components/editor-actions.tsx](../../app/editor/_components/editor-actions.tsx)

**Steps**:
- Remove "Save Post" and "Save Draft" buttons (lines 21-38)
- Add single "Save" button (calls `onSave()` without draft parameter)
- Add "Publish" button (calls `onPublish()`)
- Disable "Publish" if `status === 'published'`
- Update button labels and ARIA labels

**Acceptance Criteria**:
- AC5: Single "Save" button exists
- AC6: "Publish" button exists and is disabled when published

---

#### Task 4.6: Add Publish Handler to ViewModel
**ID**: `20251006-001-T25`
**Complexity**: M (45 min)
**Dependencies**: T23, T17

**Description**: Add publish functionality to ViewModel

**Files to modify**:
- [app/editor/use-editor-view-model.ts](../../app/editor/use-editor-view-model.ts)

**Steps**:
- Add `handlePublish()` function
- Call `POST /api/posts/[id]/publish` with `currentPostId`
- Update form data status to `'published'`
- Show success message
- Handle errors (400 if already published)

**Acceptance Criteria**:
- AC6: Can publish draft posts
- Shows appropriate success/error messages

---

#### Task 4.7: Update Drafts Dropdown
**ID**: `20251006-001-T26`
**Complexity**: S (30 min)
**Dependencies**: T18, T22

**Description**: Update dropdown to link to editor with ID

**Files to modify**:
- [app/editor/_components/drafts-dropdown.tsx](../../app/editor/_components/drafts-dropdown.tsx)

**Steps**:
- Update draft items to link to `/editor?id={draft.id}`
- Remove old `handleLoadDraft` calls (use navigation instead)
- Display `updated_at` instead of `created_at`
- Filter to show only `status === 'draft'` (API already does this)

**Acceptance Criteria**:
- AC7: Drafts link to editor with ID query param
- Sorted by `updated_at`

---

### Phase 5: Application Layer (TIER 1) - Post Detail Page

#### Task 5.1: Add Edit Button to Post Detail Page
**ID**: `20251006-001-T27`
**Complexity**: S (30 min)
**Dependencies**: T22

**Description**: Add edit button for published posts (dev only)

**Files to modify**:
- [app/(with-nav)/posts/[slug]/page.tsx](../../app/(with-nav)/posts/[slug]/page.tsx)

**Steps**:
- Add "Edit" button in top-right corner of post layout
- Only render if `NODE_ENV === 'development'`
- Link to `/editor?id={post.id}`
- Style as secondary/outline button

**Acceptance Criteria**:
- AC8: Edit button visible in dev mode
- AC8: Links to editor with post ID

---

### Phase 6: Migration

#### Task 6.1: Create Migration Script
**ID**: `20251006-001-T28`
**Complexity**: L (2-3 hours)
**Dependencies**: T11, T13

**Description**: Create script to migrate existing posts to new format

**Files to create**:
- [scripts/migrate-posts.ts](../../scripts/migrate-posts.ts)

**Steps**:
- Read all `.md` files from `storage/posts/`
- For each file:
  - Parse frontmatter
  - Generate ULID for `id`
  - Generate slug from title
  - Map `draft` boolean to `status`
  - Add `updated_at = created_at`
  - Add `published_at = created_at` if published, else null
  - Rename file from `{title}.md` to `{ulid}-{slug}.md`
  - Write updated frontmatter (include id, slug, status)
- Create backup before migration
- Log all changes to `migration.log`
- Support `--dry-run` flag

**Acceptance Criteria**:
- AC12: Migration script converts all posts
- AC12: Files renamed to `{ulid}-{slug}.md` format
- AC12: Backup created before migration
- AC12: Dry-run mode available

---

#### Task 6.2: Test Migration on Sample Data
**ID**: `20251006-001-T29`
**Complexity**: M (1 hour)
**Dependencies**: T28

**Description**: Test migration script on sample posts

**Steps**:
- Create `storage/posts-test/` directory
- Copy 3-5 sample posts (mix of draft and published)
- Run migration in dry-run mode
- Verify output logs
- Run actual migration
- Verify files renamed correctly
- Verify frontmatter updated correctly
- Test loading posts in editor

**Acceptance Criteria**:
- Migration script works without errors
- Old posts readable with new system

---

#### Task 6.3: Run Production Migration
**ID**: `20251006-001-T30`
**Complexity**: S (30 min)
**Dependencies**: T29

**Description**: Migrate production posts

**Steps**:
- Backup `storage/posts/` directory
- Run migration script on production data
- Verify all posts migrated
- Test editor workflows (load, edit, save, publish)
- Test blog listing shows published posts
- Test drafts dropdown shows drafts

**Acceptance Criteria**:
- All existing posts migrated successfully
- No data loss
- All workflows functional

---

### Phase 7: Testing & Documentation

#### Task 7.1: Manual End-to-End Testing
**ID**: `20251006-001-T31`
**Complexity**: M (1 hour)
**Dependencies**: All previous tasks

**Description**: Manually test all workflows

**Test Scenarios**:
1. Create new draft → Save → Edit → Publish
2. Load draft from dropdown → Edit → Save
3. Edit published post from detail page → Save
4. Verify published posts visible on blog listing
5. Verify drafts only in dropdown
6. Test backward compatibility (load old format post)

**Acceptance Criteria**:
- All workflows work as expected
- No console errors
- Messages display correctly

---

#### Task 7.2: Update Documentation
**ID**: `20251006-001-T32`
**Complexity**: S (30 min)
**Dependencies**: T31

**Description**: Update architecture documentation

**Files to modify**:
- [docs/kb/ARCHITECTURE.md](../../docs/kb/ARCHITECTURE.md) (if exists)

**Steps**:
- Document new Post entity fields
- Document ULID-based file naming
- Document status enum usage
- Document API endpoints
- Add migration notes

**Acceptance Criteria**:
- Documentation reflects new architecture

---

## Task Dependencies & Execution Plan

### Dependency Graph

```
Phase 1: Domain Layer (TIER 3)
T01 (Install ULID) → T11 (Create with ULID)
T02 (Update Entity) → T03 (Update Policy)
                    → T04 (Update Port)
                    → T08 (Update Get Drafts)
                    → T09 (Update Get Posts)
                    → T10 (Update DTO)

T04 (Update Port) → T05 (Publish Use Case)
                  → T06 (Get By ID Use Case)
                  → T07 (Update Save Use Case)

Phase 2: Infrastructure (TIER 2)
T01 + T10 → T11 (Create Post with ULID)
T11 → T12 (Get Post By ID)
T12 → T13 (Update Post)
T13 → T14 (Backward Compat)

Phase 3: API Endpoints (TIER 1)
T07 + T11 → T15 (Update POST /api/posts)
T07 + T13 → T16 (Create PUT /api/posts/[id])
T05 → T17 (Create POST /api/posts/[id]/publish)
T08 → T18 (Update GET /api/drafts)
T06 + T12 → T19 (Create GET /api/posts/[id])

Phase 4: Editor UI (TIER 1)
T20 (Remove Autosave) → T21 (Add Post ID State)
T21 + T19 → T22 (Load Post by ID)
T22 + T16 → T23 (Update Save Logic)
T23 + T17 → T24 (Update Actions Component)
              → T25 (Add Publish Handler)
T18 + T22 → T26 (Update Drafts Dropdown)

Phase 5: Post Detail Page (TIER 1)
T22 → T27 (Add Edit Button)

Phase 6: Migration
T11 + T13 → T28 (Create Migration Script)
T28 → T29 (Test Migration)
T29 → T30 (Run Production Migration)

Phase 7: Testing
All tasks → T31 (E2E Testing)
T31 → T32 (Update Documentation)
```

---

### Execution Sequence (Optimized for Parallel Work)

**Session 1** (1.5 hours):
- T01: Install ULID (15 min)
- T02: Update Post Entity (30 min)
- T03: Update PostVisibilityPolicy (15 min)
- T04: Update IPostRepository Port (20 min)

**Session 2** (2 hours):
- T05: Create Publish Post Use Case (1 hour)
- T06: Create Get Post by ID Use Case (30 min)
- T08: Update Get Drafts Use Case (20 min)

**Session 3** (2 hours):
- T07: Update Save Post Use Case (1 hour)
- T09: Update Get Posts Use Case (20 min)
- T10: Update PostDTO (30 min)

**Session 4** (2.5 hours):
- T11: Implement Create Post with ULID (1.5 hours)
- T12: Implement Get Post by ID (1 hour)

**Session 5** (3 hours):
- T13: Implement Update Post (2 hours)
- T14: Add Backward Compatibility (1 hour)

**Session 6** (2 hours):
- T15: Update POST /api/posts (1 hour)
- T16: Create PUT /api/posts/[id] (1 hour)

**Session 7** (2 hours):
- T17: Create POST /api/posts/[id]/publish (45 min)
- T18: Update GET /api/drafts (30 min)
- T19: Create GET /api/posts/[id] (30 min)

**Session 8** (2 hours):
- T20: Remove Autosave from ViewModel (30 min)
- T21: Add Current Post ID State (20 min)
- T22: Load Post by ID in Editor (1.5 hours)

**Session 9** (2.5 hours):
- T23: Update Save Logic (1 hour)
- T24: Update Editor Actions Component (1 hour)
- T25: Add Publish Handler to ViewModel (45 min)

**Session 10** (1.5 hours):
- T26: Update Drafts Dropdown (30 min)
- T27: Add Edit Button to Post Detail Page (30 min)

**Session 11** (3 hours):
- T28: Create Migration Script (2-3 hours)

**Session 12** (1.5 hours):
- T29: Test Migration on Sample Data (1 hour)
- T30: Run Production Migration (30 min)

**Session 13** (1.5 hours):
- T31: Manual End-to-End Testing (1 hour)
- T32: Update Documentation (30 min)

---

### Parallel Opportunities

**Domain Layer** (Sessions 1-3):
- T05, T06, T08 can run in parallel after T04 completes
- T07, T09, T10 can run in parallel after T02 completes

**Infrastructure** (Sessions 4-5):
- T12 depends on T11, must be sequential
- T13 depends on T12, must be sequential

**API Endpoints** (Sessions 6-7):
- T15, T16, T17, T18, T19 can all run in parallel (independent endpoints)

**Editor UI** (Sessions 8-10):
- T20, T21 are sequential
- T24, T25, T26, T27 can run in parallel after T23 completes

---

### Critical Path

**Longest dependency chain**:
T01 → T11 → T12 → T13 → T16 → T23 → T24

**Estimated Duration**: ~13 hours critical path work

**Total Estimated Effort**: 30-35 hours (including all parallel tasks)

**With 1-2 developers working in parallel**: 15-20 hours total calendar time

---

## Technology Stack Additions

**New Dependencies:**
```json
{
  "dependencies": {
    "ulid": "^2.3.0"
  }
}
```

**Existing Dependencies (no changes):**
- `marked` - Markdown to HTML rendering
- `gray-matter` - Frontmatter parsing
- `reading-time` - Reading time calculation
- `next` - Framework
- `react` - UI library

---

## Risks & Mitigations

### Risk 1: ULID Collisions
**Likelihood**: Very low (~1 in 10^24)
**Impact**: High (duplicate IDs)
**Mitigation**: ULID uses cryptographically strong randomness, collision probability negligible for this use case

---

### Risk 2: Migration Data Loss
**Likelihood**: Low
**Impact**: Critical
**Mitigation**:
- Create backup before migration (Task T29)
- Test on sample data first (Task T29)
- Support rollback via backup restore
- Log all migration changes

---

### Risk 3: Breaking Old URLs
**Likelihood**: High
**Impact**: Medium (SEO, bookmarks)
**Mitigation**:
- Slug remains same after migration (derived from title)
- Public URLs still use `/posts/{slug}`, not `/posts/{id}`
- Backward compatibility for old title-based files (Task T14)
- Future enhancement: 301 redirects if slugs change

---

### Risk 4: File System Errors During Save
**Likelihood**: Low
**Impact**: Medium (lost work)
**Mitigation**:
- Validate directory exists before write
- Handle errors gracefully with user-facing messages
- Keep `hasUnsavedChanges` warning for navigation

---

### Risk 5: Concurrent Edits (Future Multi-User)
**Likelihood**: Very low (single-user dev mode)
**Impact**: Low (last-write-wins)
**Mitigation**:
- Acceptable for MVP (single-user blog)
- Future enhancement: Add version field, optimistic locking

---

## Success Metrics

### Functional Success
- ✅ All 12 acceptance criteria from spec pass
- ✅ Migration script successfully converts existing posts
- ✅ Editor supports create, update, publish workflows
- ✅ Published posts visible on blog listing
- ✅ Drafts only visible in editor dropdown

### Technical Success
- ✅ Zero breaking changes to published post URLs
- ✅ Save operation completes in < 1 second
- ✅ No file system errors or data loss during migration
- ✅ Backward compatible with old post format

### User Experience Success
- ✅ Clear feedback on save/publish actions (success/error messages)
- ✅ Intuitive "Save" vs "Publish" distinction
- ✅ Easy to edit published posts from detail page (dev mode)
- ✅ Draft management via dropdown works smoothly

---

## Open Questions & Decisions

### Q1: Slug Regeneration on Title Change
**Question**: Should slug auto-update when title changes?
**Options**:
- A) Always regenerate (breaks old URLs)
- B) Never regenerate (keep original slug)
- C) Regenerate for drafts only, preserve for published

**Recommendation**: **Option C** (regenerate drafts only)
**Decision**: Implement Option C in Task T13 (updatePost)

---

### Q2: Slug Uniqueness Enforcement
**Question**: Should we enforce unique slugs across all posts?
**Options**:
- A) Allow duplicate slugs, handle conflicts at routing layer
- B) Append `-2`, `-3` suffix for duplicates
- C) Prevent saving with duplicate slug (validation error)

**Recommendation**: **Option B** (append suffix) - Common in CMS systems
**Decision**: Out of scope for MVP, defer to future enhancement

---

### Q3: Handling Old URLs After Title Change
**Question**: What happens to existing `/posts/{old-slug}` URLs?
**Options**:
- A) Break old URLs (acceptable for personal blog)
- B) Add 301 redirects (requires redirect mapping)

**Recommendation**: **Option A** for MVP, **Option B** for production
**Decision**: Implement Option A (accept broken URLs), document for future

---

## Out of Scope (Deferred)

The following features are explicitly excluded from this implementation:

- ❌ **Unpublish Action**: Reverting published → draft
- ❌ **Post Versioning/Revisions**: History of changes
- ❌ **Optimistic Locking**: Conflict detection with version field
- ❌ **Scheduled Publishing**: Auto-publish at future date
- ❌ **Authentication/Authorization**: Editor stays dev-only
- ❌ **Multi-User Collaboration**: Single-user system
- ❌ **Database Migration**: Keep filesystem storage
- ❌ **Production Editor Access**: Remains development-only
- ❌ **Slug Editing**: Auto-generated only (no manual override)
- ❌ **URL Redirects**: 301 redirects for changed slugs

---

## Next Steps

1. ✅ Review and approve this PLAN document
2. ✅ Clarify open questions (slug regeneration → **Option C**)
3. ⏭️ Begin implementation with **Session 1** (Tasks T01-T04)
4. ⏭️ Continue through sessions sequentially
5. ⏭️ Run migration script on development data (Session 11)
6. ⏭️ Test all workflows (Session 13)
7. ⏭️ Deploy to production

---

## References

### Related Documents
- [SPEC Document](../specs/20251006-001-spec-editor-draft-publish-workflow.md)
- [IDEA Document](../ideas/20251006-001-idea-editor-draft-publish-workflow.md)

### External Resources
- [ULID Specification](https://github.com/ulid/spec)
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)

### Code References

**Domain Layer:**
- [Post Entity](../../src/domain/blog/entities/post.entity.ts)
- [Post Repository Port](../../src/domain/blog/ports/post-repository.port.ts)
- [Post Visibility Policy](../../src/domain/blog/policies/post-visibility.policy.ts)

**Infrastructure Layer:**
- [FileSystem Repository](../../src/infrastructure/blog/repositories/post.filesystem.repository.ts)

**API Layer:**
- [POST /api/posts](../../app/api/posts/route.ts)
- [GET/DELETE /api/posts/[slug]](../../app/api/posts/[slug]/route.ts)
- [GET /api/drafts](../../app/api/drafts/route.ts)

**Editor UI:**
- [Editor Page](../../app/editor/page.tsx)
- [Editor ViewModel](../../app/editor/use-editor-view-model.ts)
- [Editor Actions](../../app/editor/_components/editor-actions.tsx)
- [Drafts Dropdown](../../app/editor/_components/drafts-dropdown.tsx)

**Blog Display:**
- [Blog Listing](../../app/(with-nav)/blog/page.tsx)
- [Post Detail](../../app/(with-nav)/posts/[slug]/page.tsx)

---

## Changelog

**2025-10-06**
- Initial PLAN document created
- Based on SPEC document 20251006-001
- 32 tasks identified across 7 phases
- Dependency graph and execution sequence defined
- Architecture design completed
- API contracts specified
- Estimated 30-35 hours total effort
