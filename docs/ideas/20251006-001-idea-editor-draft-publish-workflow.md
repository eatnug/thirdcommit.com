# 20251006-001: Editor Draft/Publish Workflow Restructuring

**Created**: 2025-10-06
**Status**: IDEA

## User Request

에디터쪽을 구조화하고싶어. editor 화면에서 메모리에 폼이 react state로 생성되고, save 를 하게되면 post 가 생성돼 이때 이건 draft야 그래서 draft 드랍다운에 보여야해. 이 상태에서 여러번 save 할 수 있어. 그리고 여기서 publish 를 하면 얘는 이제 draft가 아니게 되고, post list 에 노출되고 draft dropdown 에는 안보여.

**Translation**: Restructure the editor workflow. When you save in the editor screen, a draft post is created and shows in the draft dropdown. You can save multiple times. When you publish, it becomes a published post, appears in the post list, and disappears from the draft dropdown.

## Current System Overview

### Data Flow
```
Editor UI (TIER 1)
  → useEditorViewModel hook
    → blog.savePost() use case
      → API route /api/posts (POST)
        → Filesystem write operation
          → File created at storage/posts/[title].md
```

### Current Post Entity
```typescript
interface Post {
  title: string           // Used as unique identifier (problematic)
  created_at: Date
  tags: string[]
  description: string
  content: string
  html: string
  readingTime: string
  draft: boolean         // Only status field
}
```

### Current Editor Behavior
- **Two separate buttons**: "Save Post" (draft: false) and "Save Draft" (draft: true)
- **Auto-save**: Saves to localStorage every 30 seconds
- **Title as identifier**: Can't rename posts, duplicate title causes errors
- **No update mechanism**: Must delete and recreate to edit
- **No publish workflow**: Direct save with boolean flag
- **Development-only**: Editor disabled in production

### Current Limitations
- ❌ No unique post ID (uses title as identifier)
- ❌ No update/PATCH endpoint
- ❌ No publish action (only save with draft flag)
- ❌ Can't edit published posts
- ❌ No transition tracking (draft → published)
- ❌ No `publishedAt` timestamp
- ❌ Auto-save adds unnecessary complexity

## Related Code

### Editor Components
- [app/editor/page.tsx:1-102](app/editor/page.tsx#L1-L102) - Main editor page
- [app/editor/use-editor-view-model.ts:25-281](app/editor/use-editor-view-model.ts#L25-L281) - Editor state management
  - Lines 53-87: Auto-save to localStorage (TO BE REMOVED)
  - Lines 137-150: Save post mutation
  - Lines 163-175: Keyboard shortcuts (Cmd/Ctrl + S)
- [app/editor/_components/editor-actions.tsx:11-69](app/editor/_components/editor-actions.tsx#L11-L69) - Save buttons (needs consolidation)
- [app/editor/_components/drafts-dropdown.tsx:15-102](app/editor/_components/drafts-dropdown.tsx#L15-L102) - Draft list UI

### Domain Layer
- [src/domain/blog/entities/post.entity.ts:1-18](src/domain/blog/entities/post.entity.ts#L1-L18) - Post model (needs ID + status + publishedAt)
- [src/domain/blog/policies/post-visibility.policy.ts:14-103](src/domain/blog/policies/post-visibility.policy.ts#L14-L103) - Visibility rules
- [src/domain/blog/use-cases/save-post.use-case.ts:9-35](src/domain/blog/use-cases/save-post.use-case.ts#L9-L35) - Save logic (needs update capability)

### Infrastructure Layer
- [src/infrastructure/blog/repositories/post.filesystem.repository.ts:15-153](src/infrastructure/blog/repositories/post.filesystem.repository.ts#L15-L153) - Filesystem repo
  - Lines 91-136: createPost() - needs ID generation
  - Missing: updatePost() method
- [app/api/posts/route.ts:16-95](app/api/posts/route.ts#L16-L95) - POST endpoint (needs UPDATE support)
- [app/api/posts/[slug]/route.ts:8-101](app/api/posts/[slug]/route.ts#L8-L101) - GET/DELETE endpoints (needs PATCH)

### Post Display
- [app/(with-nav)/blog/page.tsx:4-17](app/(with-nav)/blog/page.tsx#L4-L17) - Blog listing (filters published posts)
- [app/(with-nav)/posts/[slug]/page.tsx](app/(with-nav)/posts/[slug]/page.tsx) - Post detail page (needs "Edit" button in dev mode)

## Related Knowledge Base

- [docs/kb/ARCHITECTURE.md](docs/kb/ARCHITECTURE.md) - Hexagonal architecture patterns
  - Volatility-based decomposition (TIER 1-3)
  - PostVisibilityPolicy pattern for business rules
  - Port/Adapter pattern for repository abstraction
  - Domain barrel exports for public APIs

## Requirements Clarification

### Q1: 저장(Save) 워크플로우 변경
**A**: Save Post와 Save Draft는 하나의 "Save" 버튼으로 통합. Save는 post의 상태(draft/published)를 변경하지 않고, 현재 상태 그대로 저장만 수행.

### Q2: Publish 액션 위치
**A**: "Save" 버튼 옆 빈 공간에 "Publish" 버튼 추가 (editor-actions.tsx 수정)

### Q3: 같은 제목(title) 처리
**A**: Post에 내부 ID 추가. Title이 바뀌어도 unique하게 식별 가능하도록 변경.

### Q4: Published post 편집
**A**: 옵션 A 선택 - Local 환경에서 post 상세 화면에 "Edit" 버튼 추가. Published post도 수정 가능하며, Save하면 그대로 수정 반영. 이미 published된 경우 Publish 버튼 비활성화.

### Q5: Draft 드롭다운과 Post 리스트
**A**:
- Draft dropdown: `status === 'draft'`인 post만 표시
- Blog page: `status === 'published'`인 post만 표시
- Published post는 상세 화면에서 "Edit" 버튼으로 editor 진입

### Q6: Autosave와 localStorage
**A**: Auto-save와 localStorage는 불필요한 복잡도를 추가하므로 전부 제거.

### Q7: 데이터 모델 변경
**A**:
- `id: string` 필드 추가 (UUID 또는 nanoid)
- `status: 'draft' | 'published'` enum 추가 (draft: boolean 대체)
- `publishedAt: Date | null` 추가
- `draft: boolean` 필드는 deprecated 처리 후 제거

## Initial Scope

### 1. Data Model Changes (TIER 3 - Domain)
- [ ] Add `id` field to Post entity (UUID/nanoid)
- [ ] Replace `draft: boolean` with `status: 'draft' | 'published'`
- [ ] Add `publishedAt: Date | null` field
- [ ] Update PostFormData interface accordingly
- [ ] Update PostVisibilityPolicy to use status instead of draft

### 2. Repository Layer Updates (TIER 2 - Infrastructure)
- [ ] Implement ID generation in createPost()
- [ ] Add `updatePost(id, updates)` method to IPostRepository port
- [ ] Implement updatePost() in FileSystemPostRepository
- [ ] Update filename strategy (use id or title+id)
- [ ] Add PATCH `/api/posts/[id]` endpoint

### 3. Use Cases (TIER 3 - Domain)
- [ ] Update savePostUseCase to handle create vs update
- [ ] Create publishPostUseCase(id) - changes status to 'published', sets publishedAt
- [ ] Update getPostsUseCase to filter by status
- [ ] Update getDraftsUseCase to filter by status === 'draft'

### 4. Editor UI Changes (TIER 1)
- [ ] Remove auto-save logic from use-editor-view-model.ts (lines 53-87)
- [ ] Remove localStorage persistence (lines 44-51, 95)
- [ ] Consolidate "Save Post" and "Save Draft" into single "Save" button
- [ ] Add "Publish" button in editor-actions.tsx
- [ ] Disable "Publish" button when post.status === 'published'
- [ ] Update drafts-dropdown to filter by status === 'draft'
- [ ] Track currentPostId in editor state (for update vs create)

### 5. Post Detail Page Enhancement (TIER 1)
- [ ] Add "Edit" button to post detail page (conditional: development mode only)
- [ ] Link "Edit" button to `/editor?id={postId}`
- [ ] Load post by ID in editor when ?id query param exists

### 6. API Routes Updates (TIER 2)
- [ ] Update POST `/api/posts` to generate ID and return it
- [ ] Add PATCH `/api/posts/[id]` for updates
- [ ] Add POST `/api/posts/[id]/publish` for publishing action
- [ ] Update GET `/api/drafts` to filter by status

### 7. Migration & Cleanup
- [ ] Add migration script to add IDs to existing posts
- [ ] Update existing posts with status field
- [ ] Remove auto-save related code and dependencies
- [ ] Update tests to use new data model

## Out of Scope

- ❌ Authentication/authorization system
- ❌ Multi-user collaboration
- ❌ Version history / revisions
- ❌ Scheduled publishing
- ❌ Approval workflow
- ❌ Database migration (keep filesystem storage)
- ❌ Production editor access (stays development-only)

## Technical Considerations

### ID Generation Strategy
**Options:**
1. UUID v4 - Standard, but long (36 chars)
2. nanoid - Shorter (21 chars), URL-safe
3. ULID - Sortable by time

**Recommendation**: Use `nanoid` for shorter, URL-friendly IDs

### File Naming Strategy
**Options:**
1. Keep title-based: `{title}.md` (store ID in frontmatter)
2. ID-based: `{id}.md` (less human-readable)
3. Hybrid: `{id}-{slug}.md` (best of both)

**Recommendation**: Keep `{title}.md` for now, store ID in frontmatter. Migrate to ID-based later if needed.

### Update Strategy
**Options:**
1. Delete + Recreate (current approach)
2. Read → Modify → Write (simple update)
3. Atomic write with temp file (safer)

**Recommendation**: Use #2 for simplicity, upgrade to #3 if concurrency becomes an issue

### Status Transition Rules
```typescript
// Allowed transitions
'draft' → 'draft'      // Save draft (update)
'draft' → 'published'  // Publish (sets publishedAt)
'published' → 'published'  // Save published (update, keeps publishedAt)

// Disallowed transitions
'published' → 'draft'  // No unpublish (out of scope)
```

## Implementation Plan

### Phase 1: Data Model & Infrastructure (TIER 3 + TIER 2)
1. Update Post entity with id, status, publishedAt
2. Add updatePost() to repository port & implementation
3. Implement ID generation in createPost()
4. Add PATCH API endpoint

### Phase 2: Use Cases & Policies (TIER 3)
1. Create publishPostUseCase
2. Update savePostUseCase for create/update logic
3. Update visibility policies to use status
4. Update all existing use cases

### Phase 3: Editor UI (TIER 1)
1. Remove auto-save and localStorage logic
2. Consolidate Save buttons
3. Add Publish button with disabled state logic
4. Add currentPostId tracking for updates
5. Update drafts dropdown filtering

### Phase 4: Post Detail Page (TIER 1)
1. Add "Edit" button (dev mode only)
2. Implement ?id query param handling in editor
3. Load post by ID logic

### Phase 5: Migration & Testing
1. Create migration script for existing posts
2. Test all workflows (create, save, publish, edit)
3. Update documentation

## Success Criteria

✅ Post entity has unique `id` field
✅ Status enum replaces boolean draft flag
✅ Single "Save" button updates without changing status
✅ "Publish" button changes status and sets publishedAt
✅ Published posts can be edited from post detail page
✅ Drafts dropdown shows only draft posts
✅ Blog listing shows only published posts
✅ Auto-save and localStorage removed
✅ No duplicate title errors (ID-based identification)
✅ Existing posts migrated successfully

## Next Steps

1. [ ] Review and approve this IDEA document
2. [ ] Create detailed SPEC document with acceptance criteria
3. [ ] Design API contracts for update and publish endpoints
4. [ ] Write migration script for existing posts
5. [ ] Implement Phase 1 (data model changes)

## Notes

- This restructuring maintains the hexagonal architecture pattern
- Changes are organized by TIER to respect volatility boundaries
- Auto-save removal significantly reduces complexity
- ID-based system enables future features (rename, version history)
- Filesystem storage retained for simplicity (can migrate to DB later)
