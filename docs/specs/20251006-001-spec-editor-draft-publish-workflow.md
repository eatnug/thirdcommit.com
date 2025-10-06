# 20251006-001-SPEC: Editor Draft/Publish Workflow Restructuring

**Created**: 2025-10-06
**Status**: SPEC
**Based on**: [docs/ideas/20251006-001-idea-editor-draft-publish-workflow.md](../ideas/20251006-001-idea-editor-draft-publish-workflow.md)

## Feature Description

This specification defines the restructuring of the blog post editor to support a robust draft/publish workflow. Currently, the system uses a simple `draft: boolean` flag and only supports creating new posts. This update will introduce:

1. **Unique post identifiers (ULID)** - Enable renaming posts and stable references
2. **Update capability** - Edit existing posts (both drafts and published)
3. **Simplified save workflow** - Single "Save" button that preserves post status
4. **Explicit publish action** - Dedicated "Publish" button to change draft → published
5. **Edit published posts** - Edit button on post detail pages (dev mode only)
6. **Timestamp tracking** - Track created, updated, and published timestamps
7. **Remove autosave** - Eliminate localStorage complexity

**Key Goals:**
- Enable iterative editing of both drafts and published posts
- Provide clear separation between "save" and "publish" actions
- Use stable identifiers instead of title-based file naming
- Maintain hexagonal architecture principles (TIER separation)

---

## Acceptance Criteria

### AC1: Post Entity with Unique Identifiers

**Given** the Post entity needs stable identification
**When** a new post is created
**Then** the system should:

- [ ] Generate a unique ULID for the `id` field (26 characters, sortable, URL-safe)
- [ ] Generate a URL-friendly `slug` from the title using slugify
- [ ] Store both `id` and `slug` in frontmatter
- [ ] Use `id` (ULID) as the filename: `{ulid}.md`
- [ ] Ensure `id` never changes after creation
- [ ] Allow `slug` to be regenerated if title changes

**Validation:**
```typescript
// Post entity structure
interface Post {
  id: string              // ULID: "01ARZ3NDEKTSV4RRFFQ69G5FAV"
  slug: string            // Slugified: "my-blog-post"
  title: string
  status: 'draft' | 'published'
  created_at: Date
  updated_at: Date
  published_at: Date | null
  tags: string[]
  description: string
  content: string
  html: string
  readingTime: string
}
```

**Files to modify:**
- [src/domain/blog/entities/post.entity.ts](../../src/domain/blog/entities/post.entity.ts)

---

### AC2: Status Enum Replaces Draft Boolean

**Given** the system currently uses `draft: boolean`
**When** migrating to a state-based system
**Then** the system should:

- [ ] Replace `draft: boolean` with `status: 'draft' | 'published'`
- [ ] Default new posts to `status: 'draft'`
- [ ] Update PostVisibilityPolicy to check `status === 'published'` instead of `!draft`
- [ ] Filter blog listing to show only `status === 'published'` posts
- [ ] Filter drafts dropdown to show only `status === 'draft'` posts
- [ ] Support backward compatibility: read old `draft` field if `status` is missing

**Validation:**
```typescript
// Old format (backward compatible)
frontmatter.draft === true  → status: 'draft'
frontmatter.draft === false → status: 'published'

// New format
frontmatter.status === 'draft' | 'published'
```

**Files to modify:**
- [src/domain/blog/entities/post.entity.ts](../../src/domain/blog/entities/post.entity.ts)
- [src/domain/blog/policies/post-visibility.policy.ts](../../src/domain/blog/policies/post-visibility.policy.ts)

---

### AC3: Timestamp Management

**Given** the system needs to track post lifecycle
**When** posts are created, updated, or published
**Then** the system should:

- [ ] Set `created_at` once when post is created (never changes)
- [ ] Update `updated_at` on every save operation
- [ ] Set `published_at` when status changes from `draft` to `published` (only if null)
- [ ] Preserve `published_at` when saving already-published posts
- [ ] Store all timestamps in ISO 8601 UTC format in frontmatter
- [ ] Parse timestamps as Date objects in domain layer

**Validation:**
```typescript
// On create
created_at = new Date()
updated_at = new Date()
published_at = null

// On save (draft or published)
updated_at = new Date()
published_at = (unchanged)

// On publish
updated_at = new Date()
published_at = published_at ?? new Date()  // Set if null
```

**Files to modify:**
- [src/domain/blog/entities/post.entity.ts](../../src/domain/blog/entities/post.entity.ts)
- [src/infrastructure/blog/repositories/post.filesystem.repository.ts](../../src/infrastructure/blog/repositories/post.filesystem.repository.ts)

---

### AC4: Update Post Capability

**Given** the system currently only supports creating posts
**When** a user saves an existing post
**Then** the system should:

- [ ] Add `updatePost(id: string, data: Partial<Post>)` to IPostRepository interface
- [ ] Implement `updatePost()` in FileSystemPostRepository
- [ ] Create PUT `/api/posts/[id]` endpoint for updates
- [ ] Detect create vs update in savePostUseCase based on presence of `id`
- [ ] Return 404 if trying to update non-existent post
- [ ] Update `updated_at` timestamp on every update
- [ ] Preserve `created_at` and `published_at` on updates
- [ ] Allow updating title, content, description, tags without changing status

**API Contract:**

**PUT /api/posts/[id]**
```typescript
// Request
{
  title: string
  description?: string
  tags: string[]
  content: string
  status: 'draft' | 'published'
}

// Response (200 OK)
{
  id: string
  slug: string
  title: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
  published_at: string | null
  // ... other fields
}

// Errors
404 - Post not found
400 - Validation error
500 - Server error
```

**Files to modify:**
- [src/domain/blog/ports/post-repository.port.ts](../../src/domain/blog/ports/post-repository.port.ts)
- [src/infrastructure/blog/repositories/post.filesystem.repository.ts](../../src/infrastructure/blog/repositories/post.filesystem.repository.ts)
- [src/domain/blog/use-cases/save-post.use-case.ts](../../src/domain/blog/use-cases/save-post.use-case.ts)
- Create: [app/api/posts/[id]/route.ts](../../app/api/posts/[id]/route.ts) (PUT handler)

---

### AC5: Unified Save Button

**Given** the editor currently has "Save Post" and "Save Draft" buttons
**When** consolidating to a single save action
**Then** the system should:

- [ ] Remove "Save Post" and "Save Draft" buttons
- [ ] Add single "Save" button in editor actions
- [ ] Save operation preserves current post status (draft stays draft, published stays published)
- [ ] Update `updated_at` timestamp on save
- [ ] Show loading state while saving
- [ ] Display success message: "✅ Saved: {title}"
- [ ] Display error message: "❌ Failed to save: {error}"
- [ ] Enable save only when `title.trim() !== ""` and content is not empty
- [ ] Support keyboard shortcut Cmd/Ctrl+S for save

**Behavior:**
```
Draft post + Save → Remains draft, updated_at changes
Published post + Save → Remains published, updated_at changes
```

**Files to modify:**
- [app/editor/_components/editor-actions.tsx](../../app/editor/_components/editor-actions.tsx)
- [app/editor/use-editor-view-model.ts](../../app/editor/use-editor-view-model.ts)

---

### AC6: Publish Button and Workflow

**Given** the system needs explicit publish action
**When** a user wants to publish a draft
**Then** the system should:

- [ ] Add "Publish" button next to "Save" button in editor actions
- [ ] Publish button changes post status from `draft` to `published`
- [ ] Set `published_at` timestamp when publishing (if null)
- [ ] Update `updated_at` timestamp when publishing
- [ ] Disable "Publish" button when post is already published
- [ ] Show "Already Published" or similar indicator when published
- [ ] Display success message: "✅ Published: {title}"
- [ ] Display error message: "❌ Failed to publish: {error}"
- [ ] Require title and content before allowing publish

**API Contract:**

**POST /api/posts/[id]/publish**
```typescript
// Request (empty body)
{}

// Response (200 OK)
{
  id: string
  slug: string
  status: 'published'
  published_at: string  // ISO timestamp
  updated_at: string
  // ... other fields
}

// Errors
404 - Post not found
400 - Post is already published
500 - Server error
```

**Files to modify:**
- [app/editor/_components/editor-actions.tsx](../../app/editor/_components/editor-actions.tsx)
- [app/editor/use-editor-view-model.ts](../../app/editor/use-editor-view-model.ts)
- Create: [app/api/posts/[id]/publish/route.ts](../../app/api/posts/[id]/publish/route.ts)
- Create: [src/domain/blog/use-cases/publish-post.use-case.ts](../../src/domain/blog/use-cases/publish-post.use-case.ts)

---

### AC7: Draft Dropdown Filtering

**Given** the drafts dropdown shows all drafts
**When** filtering by status
**Then** the system should:

- [ ] Show only posts where `status === 'draft'`
- [ ] Hide posts where `status === 'published'`
- [ ] Display draft title, date, and preview (first 100 chars)
- [ ] Load draft into editor when clicked
- [ ] Sort drafts by `updated_at` DESC (most recent first)
- [ ] Show "No drafts" message when empty
- [ ] Refresh draft list after saving new draft
- [ ] Remove draft from list after publishing

**Files to modify:**
- [app/editor/_components/drafts-dropdown.tsx](../../app/editor/_components/drafts-dropdown.tsx)
- [app/api/drafts/route.ts](../../app/api/drafts/route.ts)

---

### AC8: Published Post Editing (Dev Mode Only)

**Given** published posts need to be editable
**When** viewing a published post in development mode
**Then** the system should:

- [ ] Add "Edit" button to post detail page (top-right corner)
- [ ] Only show "Edit" button when `NODE_ENV === 'development'`
- [ ] Link to `/editor?id={post.id}` when clicked
- [ ] Load post by ID in editor when `?id` query param exists
- [ ] Populate editor form with post data
- [ ] Set `currentPostId` state to enable update mode
- [ ] Show "Editing: {title}" indicator in editor header
- [ ] Allow saving changes to published post without unpublishing

**Files to modify:**
- [app/(with-nav)/posts/[slug]/page.tsx](../../app/(with-nav)/posts/[slug]/page.tsx)
- [app/editor/page.tsx](../../app/editor/page.tsx)
- [app/editor/use-editor-view-model.ts](../../app/editor/use-editor-view-model.ts)
- [src/domain/blog/use-cases/load-post-as-form.use-case.ts](../../src/domain/blog/use-cases/load-post-as-form.use-case.ts)

---

### AC9: Remove Autosave and localStorage

**Given** autosave adds unnecessary complexity
**When** simplifying editor state management
**Then** the system should:

- [ ] Remove autosave interval timer from use-editor-view-model.ts (lines 53-87)
- [ ] Remove localStorage save logic
- [ ] Remove localStorage restore logic on mount (lines 44-51)
- [ ] Remove `lastAutosave` state variable
- [ ] Remove `AUTOSAVE_KEY` constant
- [ ] Remove autosave-related UI indicators
- [ ] Keep only manual save via "Save" button or Cmd/Ctrl+S
- [ ] Simplify state management (no autosave timestamps)

**Files to modify:**
- [app/editor/use-editor-view-model.ts](../../app/editor/use-editor-view-model.ts)

---

### AC10: Blog Listing Filters Published Posts

**Given** the blog listing shows all posts
**When** filtering by publication status
**Then** the system should:

- [ ] In production: show only posts where `status === 'published'`
- [ ] In development: show all posts (both draft and published)
- [ ] Use PostVisibilityPolicy.shouldShowInPublicList() for filtering
- [ ] Sort by `created_at` DESC (or `published_at` if available)
- [ ] Display post title, description, tags, and reading time
- [ ] Link to `/posts/{slug}` for post detail page

**Files to modify:**
- [app/(with-nav)/blog/page.tsx](../../app/(with-nav)/blog/page.tsx)
- [src/domain/blog/use-cases/get-posts.use-case.ts](../../src/domain/blog/use-cases/get-posts.use-case.ts)

---

### AC11: Post Repository Updates

**Given** the repository needs to support new operations
**When** implementing CRUD operations
**Then** the system should:

- [ ] Update IPostRepository interface with new methods:
  - `getPostById(id: string): Promise<Post | null>`
  - `updatePost(post: Post): Promise<Post>`
- [ ] Implement file naming strategy: `{ulid}.md`
- [ ] Store `id` and `slug` in frontmatter
- [ ] Support reading old title-based files for backward compatibility
- [ ] Ensure directory exists before writing files
- [ ] Handle file not found errors gracefully
- [ ] Use async file operations (migrate from sync to async)

**Files to modify:**
- [src/domain/blog/ports/post-repository.port.ts](../../src/domain/blog/ports/post-repository.port.ts)
- [src/infrastructure/blog/repositories/post.filesystem.repository.ts](../../src/infrastructure/blog/repositories/post.filesystem.repository.ts)

---

### AC12: Migration of Existing Posts

**Given** existing posts use old format
**When** migrating to new system
**Then** the system should:

- [ ] Create migration script: `scripts/migrate-posts.ts`
- [ ] Read all existing `.md` files from `storage/posts/`
- [ ] For each post:
  - Generate ULID for `id` field
  - Generate slug from title
  - Add `status: 'draft' | 'published'` based on `draft` boolean
  - Add `updated_at = created_at` initially
  - Add `published_at = created_at` if status is published
  - Rename file from `{title}.md` to `{ulid}.md`
  - Write updated frontmatter
- [ ] Create backup of `storage/posts/` before migration
- [ ] Log all changes to migration log file
- [ ] Support dry-run mode to preview changes
- [ ] Handle errors gracefully (skip and log failed migrations)

**Migration script location:**
- Create: `scripts/migrate-posts.ts`

---

## Non-Functional Requirements

### Performance

- [ ] Save operation completes in < 1 second for posts up to 50KB
- [ ] Editor loads existing post in < 500ms
- [ ] Draft dropdown loads in < 300ms
- [ ] No blocking I/O operations (migrate to async fs methods)
- [ ] File operations use streaming for large files (> 1MB)

### Security

- [ ] Editor endpoints only accessible in development mode (`NODE_ENV === 'development'`)
- [ ] Validate all user input (title, content, tags, description)
- [ ] Sanitize markdown content before rendering HTML
- [ ] Prevent directory traversal attacks in file paths
- [ ] Validate ULID format before using as filename

### Data Integrity

- [ ] Ensure `id` uniqueness (ULID collision probability: ~1 in 10^24)
- [ ] Validate frontmatter structure before saving
- [ ] Preserve `created_at` timestamp (never overwrite)
- [ ] Preserve `published_at` timestamp after first publish
- [ ] Handle concurrent edits gracefully (last-write-wins acceptable for MVP)

### Developer Experience

- [ ] Clear error messages for validation failures
- [ ] Keyboard shortcuts work reliably (Cmd/Ctrl+S)
- [ ] Loading states provide clear feedback
- [ ] Success/error messages auto-dismiss after 3 seconds
- [ ] Maintain hexagonal architecture patterns (TIER separation)

### Backward Compatibility

- [ ] Support reading posts with old format (`draft` boolean, title-based filename)
- [ ] Migration script preserves all existing post data
- [ ] Old URLs redirect to new slug-based URLs (if titles change)

---

## Technical Requirements

### Data Model Changes

**Post Entity** (`src/domain/blog/entities/post.entity.ts`):
```typescript
export interface Post {
  id: string              // NEW: ULID identifier
  slug: string            // NEW: URL-friendly identifier
  title: string
  status: 'draft' | 'published'  // NEW: replaces draft: boolean
  created_at: Date
  updated_at: Date        // NEW: last modification time
  published_at: Date | null  // NEW: first publish time
  tags: string[]
  description: string
  content: string
  html: string
  readingTime: string
}

export interface PostFormData {
  id?: string             // NEW: optional for create vs update
  title: string
  description: string
  tags: string            // Comma-separated
  content: string
}
```

**Frontmatter Format**:
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
description: "A description"
---

Post content here...
```

### File Storage Strategy

**Directory Structure:**
```
storage/posts/
  01ARZ3NDEKTSV4RRFFQ69G5FAV.md  # ULID-based filename
  01ARZ4NDEKTSV4RRFFQ69G5FAW.md
  ...
```

**Filename:** Use ULID as filename for stability
**Slug:** Stored in frontmatter, used for URL routing
**Lookup:** By ID (fast, direct file access) or by slug (requires parsing frontmatter)

### API Endpoints

#### 1. Create Post
**POST /api/posts**
```typescript
Request: {
  title: string
  description?: string
  tags: string[]
  content: string
}

Response (201): {
  id: string              // Generated ULID
  slug: string            // Generated from title
  title: string
  status: 'draft'         // Always draft on create
  created_at: string
  updated_at: string
  published_at: null
  filename: string        // "{ulid}.md"
}
```

#### 2. Update Post
**PUT /api/posts/[id]**
```typescript
Request: {
  title: string
  description?: string
  tags: string[]
  content: string
  status: 'draft' | 'published'  // Can update status directly
}

Response (200): {
  id: string
  slug: string            // Regenerated if title changed
  title: string
  status: 'draft' | 'published'
  created_at: string      // Unchanged
  updated_at: string      // Updated
  published_at: string | null  // Unchanged
}
```

#### 3. Publish Post
**POST /api/posts/[id]/publish**
```typescript
Request: {}

Response (200): {
  id: string
  status: 'published'
  published_at: string    // Set if was null
  updated_at: string      // Updated
}
```

#### 4. Get Post by ID
**GET /api/posts/[id]**
```typescript
Response (200): {
  id: string
  slug: string
  title: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
  published_at: string | null
  tags: string[]
  description: string
  content: string
}
```

#### 5. Get Drafts
**GET /api/drafts**
```typescript
Response (200): {
  drafts: Array<{
    id: string
    slug: string
    title: string
    status: 'draft'       // Always draft
    updated_at: string    // For sorting
    tags: string[]
    description: string
    contentPreview: string  // First 100 chars
  }>
}
```

#### 6. Delete Post
**DELETE /api/posts/[id]**
```typescript
Response (200): {
  success: true
  id: string
  title: string
}
```

### Use Cases

**New Use Cases:**
- `publishPostUseCase(id: string)` - Change status to published
- `getPostByIdUseCase(id: string)` - Load post by ID

**Updated Use Cases:**
- `savePostUseCase(input)` - Detect create vs update based on `id` presence
- `getDraftsUseCase()` - Filter by `status === 'draft'`
- `getPostsUseCase()` - Filter by `status === 'published'` in production

**Deprecated Use Cases:**
- `getPostBySlug()` - Keep for public routing, but prefer `getPostById()`

### Dependencies

**New Dependencies:**
```json
{
  "ulid": "^2.3.0"
}
```

**Existing Dependencies (no changes):**
- `marked` - Markdown to HTML
- `gray-matter` - Frontmatter parsing
- `@tanstack/react-query` - Server state management
- `next` - Framework
- `react` - UI library

### Testing Strategy

**Unit Tests:**
- Post entity timestamp logic
- Status transitions (draft → published)
- ULID generation and validation
- Slug generation from title

**Integration Tests:**
- Create post flow
- Update post flow (draft and published)
- Publish post flow
- Load post by ID in editor
- Migration script

**E2E Tests:**
- Create draft → Save → Publish workflow
- Edit published post from detail page
- Load draft from dropdown

---

## Edge Cases & Failure Scenarios

### Edge Case 1: Concurrent Edits

**Scenario:** Two users edit the same post simultaneously
**Current Behavior:** Last write wins (no conflict detection)
**Mitigation:** Acceptable for MVP (single-user blog, dev mode only)
**Future Enhancement:** Add version field and optimistic locking

### Edge Case 2: Title Changes After Publishing

**Scenario:** User changes title of published post
**Behavior:**
- `slug` is regenerated from new title
- Old URL (`/posts/old-slug`) breaks
- Mitigation: Add 301 redirect from old slug to new slug (out of scope for MVP)

### Edge Case 3: Special Characters in Title

**Scenario:** Title contains special characters: `"My Post! @#$%"`
**Behavior:**
- Slug generation removes/replaces special chars: `"my-post"`
- ULID filename is always valid
- File operations safe from injection

### Edge Case 4: Very Long Titles

**Scenario:** Title exceeds 200 characters
**Mitigation:**
- Validate max title length in API
- Truncate slug to 100 characters
- Full title stored in frontmatter

### Edge Case 5: Duplicate Slugs

**Scenario:** Two posts have same title → same slug
**Behavior:**
- Second post gets slug: `"my-post-2"`
- ID-based lookup always works
- Slug uniqueness enforced (out of scope for MVP)

### Edge Case 6: Missing Frontmatter Fields

**Scenario:** Old post missing `status` or `updated_at`
**Mitigation:**
- Repository provides defaults:
  - `status = draft ? 'draft' : 'published'`
  - `updated_at = created_at`
  - `published_at = status === 'published' ? created_at : null`

### Edge Case 7: Filesystem Errors

**Scenario:** Disk full, permission denied, file locked
**Behavior:**
- API returns 500 with error message
- Editor displays error to user
- No partial writes (atomic operations)

### Edge Case 8: Invalid ULID in URL

**Scenario:** User accesses `/editor?id=invalid-ulid`
**Behavior:**
- API returns 404 "Post not found"
- Editor shows error message
- Redirect to editor home (create new post)

### Edge Case 9: Network Failure During Save

**Scenario:** Request timeout or connection lost
**Behavior:**
- Editor shows error: "❌ Failed to save: Network error"
- User can retry save
- No data loss (changes still in form state)

### Edge Case 10: Migration Conflicts

**Scenario:** Migration script runs while editor is open
**Mitigation:**
- Run migration manually when editor is closed
- Backup posts directory before migration
- Support rollback by restoring backup

---

## Best Practices Applied

### From Industry Research

1. **ULID for IDs** (vs UUID v4 or nanoid)
   - Sortable by creation time
   - URL-friendly (26 chars)
   - Collision-resistant

2. **Status Enum** (vs boolean flags)
   - Clear state machine
   - Easy to extend (add 'archived', 'scheduled')
   - Self-documenting code

3. **Separate Save and Publish** (vs single action)
   - User control over visibility
   - Iterative editing workflow
   - Common in CMS systems (WordPress, Ghost)

4. **Timestamp Tracking** (created, updated, published)
   - Auditability
   - Sorting and filtering
   - Analytics and reporting

5. **ID-based URLs for Internal Operations** (vs slug)
   - Stable references
   - Support renaming
   - Common in REST APIs

6. **Slug for Public URLs** (vs ID)
   - SEO-friendly
   - Human-readable
   - Bookmarkable

### From Codebase Patterns

1. **Hexagonal Architecture** (TIER separation)
   - Domain entities in TIER 3
   - Use cases in TIER 3
   - Repository implementation in TIER 2
   - API routes in TIER 2
   - UI components in TIER 1

2. **Port/Adapter Pattern**
   - IPostRepository interface (port)
   - FileSystemPostRepository (adapter)
   - Easy to swap storage backend

3. **PostVisibilityPolicy**
   - Business rules isolated in policy class
   - Reusable across use cases
   - Testable independently

4. **Use Case Pattern**
   - Single responsibility
   - Composable
   - Isomorphic (client + server)

---

## Success Metrics

### Functional Success

- [ ] All acceptance criteria pass
- [ ] Migration script successfully converts existing posts
- [ ] Editor supports create, update, publish workflows
- [ ] Published posts remain visible on blog listing
- [ ] Drafts only visible in editor dropdown

### Technical Success

- [ ] Zero breaking changes to published post URLs
- [ ] Save operation < 1 second
- [ ] No file system errors or data loss
- [ ] Backward compatible with old post format

### User Experience Success

- [ ] Clear feedback on save/publish actions
- [ ] Intuitive "Save" vs "Publish" distinction
- [ ] Easy to edit published posts from detail page
- [ ] Draft management via dropdown works smoothly

---

## Out of Scope

The following features are explicitly excluded from this specification:

- ❌ **Unpublish Action** - Reverting published → draft (future feature)
- ❌ **Post Versioning/Revisions** - History of changes (future feature)
- ❌ **Optimistic Locking** - Conflict detection with version field (future feature)
- ❌ **Scheduled Publishing** - Auto-publish at future date (future feature)
- ❌ **Authentication/Authorization** - Editor stays dev-only
- ❌ **Multi-User Collaboration** - Single-user system
- ❌ **Approval Workflow** - No review/approval process
- ❌ **Database Migration** - Keep filesystem storage
- ❌ **Production Editor Access** - Remains development-only
- ❌ **Slug Editing** - Auto-generated only (no manual override)
- ❌ **URL Redirects** - 301 redirects for changed slugs (future feature)

---

## Implementation Plan

### Phase 1: Data Model & Infrastructure (TIER 3 + TIER 2)

**Priority:** High
**Estimated Effort:** 2-3 hours

1. [ ] Add `id`, `slug`, `status`, `updated_at`, `published_at` to Post entity
2. [ ] Install `ulid` package
3. [ ] Update PostFormData interface
4. [ ] Add `getPostById()` and `updatePost()` to IPostRepository
5. [ ] Implement ID generation (ULID) in repository
6. [ ] Implement `updatePost()` in FileSystemPostRepository
7. [ ] Update filename strategy: `{ulid}.md`
8. [ ] Update PostVisibilityPolicy to use `status` instead of `draft`

### Phase 2: API Endpoints (TIER 2)

**Priority:** High
**Estimated Effort:** 2 hours

1. [ ] Update POST `/api/posts` to generate ID and return it
2. [ ] Create PUT `/api/posts/[id]/route.ts` for updates
3. [ ] Create POST `/api/posts/[id]/publish/route.ts` for publishing
4. [ ] Update GET `/api/drafts` to filter by `status === 'draft'`
5. [ ] Update GET `/api/posts/[id]` to support ID-based lookup

### Phase 3: Use Cases (TIER 3)

**Priority:** High
**Estimated Effort:** 1-2 hours

1. [ ] Create `publishPostUseCase(id: string)`
2. [ ] Update `savePostUseCase` to handle create vs update
3. [ ] Update `getDraftsUseCase` to filter by status
4. [ ] Update `getPostsUseCase` to filter by status
5. [ ] Create `getPostByIdUseCase(id: string)`

### Phase 4: Editor UI (TIER 1)

**Priority:** High
**Estimated Effort:** 2-3 hours

1. [ ] Remove autosave logic from use-editor-view-model.ts
2. [ ] Remove localStorage persistence
3. [ ] Consolidate save buttons into single "Save" button
4. [ ] Add "Publish" button to editor-actions.tsx
5. [ ] Disable "Publish" when already published
6. [ ] Update drafts-dropdown to filter by status
7. [ ] Add `currentPostId` state to track edit mode
8. [ ] Load post by ID when `?id` query param exists

### Phase 5: Post Detail Page (TIER 1)

**Priority:** Medium
**Estimated Effort:** 1 hour

1. [ ] Add "Edit" button to post detail page
2. [ ] Conditional rendering: only in development mode
3. [ ] Link to `/editor?id={post.id}`
4. [ ] Pass post ID to editor via query param

### Phase 6: Migration & Testing

**Priority:** High
**Estimated Effort:** 2-3 hours

1. [ ] Create migration script `scripts/migrate-posts.ts`
2. [ ] Test migration on sample posts
3. [ ] Backup existing posts
4. [ ] Run migration on production data
5. [ ] Verify all workflows (create, save, publish, edit)
6. [ ] Update documentation

**Total Estimated Effort:** 10-14 hours

---

## Open Questions

### Q1: Slug Uniqueness Enforcement

**Question:** Should we enforce unique slugs across all posts?
**Options:**
- A) Allow duplicate slugs, handle conflicts at routing layer (404 if multiple)
- B) Append `-2`, `-3` suffix for duplicates
- C) Prevent saving with duplicate slug (validation error)

**Recommendation:** Option B (append suffix) - Common in CMS systems
**Decision:** TBD in PLAN phase

### Q2: Slug Regeneration on Title Change

**Question:** Should slug auto-update when title changes?
**Options:**
- A) Always regenerate (breaks old URLs)
- B) Never regenerate (keep original slug)
- C) Regenerate for drafts only, preserve for published

**Recommendation:** Option C (regenerate drafts only)
**Decision:** TBD in PLAN phase

### Q3: Handling Old Title-Based URLs

**Question:** What happens to existing `/posts/{title}` URLs?
**Options:**
- A) Break old URLs (acceptable for personal blog)
- B) Add 301 redirects (requires redirect mapping)
- C) Support both ID and slug lookup (complexity)

**Recommendation:** Option A for MVP, Option B for production
**Decision:** TBD

### Q4: Editor Access Control

**Question:** Should editor be password-protected even in dev mode?
**Options:**
- A) No protection (current behavior)
- B) Basic auth (simple, good enough)
- C) Full auth system (overkill for personal blog)

**Recommendation:** Option A for MVP, Option B if deploying staging environment
**Decision:** TBD

---

## Dependencies & Prerequisites

### Prerequisites

- [ ] Node.js 18+ installed
- [ ] Next.js 15+ configured
- [ ] Existing blog system functional
- [ ] `storage/posts/` directory accessible

### Package Dependencies

```json
{
  "dependencies": {
    "ulid": "^2.3.0"
  }
}
```

### File System Access

- Read/write permissions on `storage/posts/` directory
- Sufficient disk space for post storage

### Environment Variables

No new environment variables required. Existing:
- `NODE_ENV` - Controls editor access (development only)

---

## Rollback Plan

### If Migration Fails

1. Restore `storage/posts/` from backup
2. Revert code changes via git
3. Redeploy previous version

### Backup Strategy

Before migration:
```bash
cp -r storage/posts storage/posts.backup.$(date +%Y%m%d-%H%M%S)
```

### Rollback Migration

```bash
rm -rf storage/posts
mv storage/posts.backup.YYYYMMDD-HHMMSS storage/posts
```

---

## Security Considerations

### Input Validation

- Validate ULID format: `/^[0-9A-HJKMNP-TV-Z]{26}$/`
- Sanitize title, description, content before save
- Validate file paths to prevent directory traversal
- Limit file size to prevent DOS attacks (max 10MB)

### File System Security

- Ensure posts directory is outside web root
- Validate all file operations are within `storage/posts/`
- Use path normalization to prevent path traversal: `path.resolve()`

### Development-Only Access

- All editor endpoints check `NODE_ENV === 'development'`
- Return 404 in production mode
- Consider adding IP whitelist for staging environments

---

## Monitoring & Observability

### Logging

Log the following events:
- Post creation (id, title, status)
- Post updates (id, title, changes)
- Post publishing (id, title, published_at)
- Migration events (start, success, errors)
- File system errors (permission denied, disk full)

### Error Tracking

Track the following errors:
- Failed save operations
- Failed publish operations
- File system errors
- Invalid input validation errors
- ULID generation failures (collision)

### Metrics (Optional)

- Number of drafts created per day
- Number of posts published per day
- Average time from draft creation to publish
- Average post length (words)

---

## Next Steps

1. [ ] Review and approve this SPEC document
2. [ ] Clarify open questions (slug uniqueness, regeneration)
3. [ ] Create PLAN document with detailed task breakdown
4. [ ] Implement Phase 1 (data model changes)
5. [ ] Run migration script on development data
6. [ ] Test all workflows
7. [ ] Deploy to production

---

## References

### Related Documents

- [IDEA Document](../ideas/20251006-001-idea-editor-draft-publish-workflow.md)
- [Architecture Documentation](../kb/ARCHITECTURE.md)

### External Resources

- [ULID Specification](https://github.com/ulid/spec)
- [Next.js File System API](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [React Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)

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
- Initial SPEC document created
- Based on IDEA document 20251006-001
- Research completed on ULID, state machines, and CMS patterns
- Acceptance criteria defined
- Edge cases identified
- Implementation plan outlined
