# 20251007-002: Next.js to Vite Clean Architecture Migration

**Created**: 2025-10-07
**Status**: IDEA
**Branch**: vite

---

## User Request

> 지금 기능이랑 화면은 그대로 유지하되 https://github.com/eatnug/thirdcommit/blob/main/documents/FE_CLEAN_ARCHITECTURE.md 이 문서랑 https://github.com/eatnug/thirdcommit/tree/main/todo-app 이 프로젝트 맞춰서 스택, 아키텍쳐 업데이트 하고싶어

Translation: "I want to update the stack and architecture to match the FE_CLEAN_ARCHITECTURE.md document and the todo-app project, while keeping the current features and UI the same."

---

## Current System Overview

### Tech Stack (Current)
- **Framework**: Next.js 15.5.3 (App Router, React Server Components)
- **React**: 19.1.0
- **Build Tool**: Next.js built-in (Webpack-based)
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack Query v5
- **Content**: Markdown with gray-matter, marked, shiki
- **Deployment**: GitHub Pages (static export)

### Architecture (Current)
**Volatility-Based Hexagonal Architecture** with 3 tiers:

```
🟢 TIER 3 (Stable) - Domain Layer
  └── src/domain/
      ├── blog/
      │   ├── entities/       # Post entity
      │   ├── use-cases/      # 9 business operations
      │   ├── ports/          # IPostRepository interface
      │   ├── policies/       # PostVisibilityPolicy
      │   ├── services/       # MarkdownService
      │   └── index.ts        # Public API with factory
      └── projects/
          ├── entities/
          ├── use-cases/
          └── ports/

🟡 TIER 2 (Moderate) - Infrastructure Layer
  └── src/infrastructure/
      ├── blog/
      │   ├── repositories/
      │   │   ├── post.filesystem.repository.ts  # Server
      │   │   ├── post.api.repository.ts         # Client
      │   │   └── post.repository.ts             # IOC container
      │   └── dto/
      └── projects/
          └── repositories/

🔴 TIER 1 (Volatile) - Presentation Layer
  └── app/                  # Next.js App Router
      ├── _adapters/        # Framework adapters
      │   ├── _hooks/       # React Query wrappers
      │   └── _providers/   # Query provider
      ├── _components/      # Shared UI
      ├── (with-nav)/       # Route group
      ├── editor/           # Dev-only editor
      ├── api/              # Dev-only API routes
      └── layout.tsx
```

### Core Features
1. **Blog System**: Markdown posts with draft/publish workflow
2. **Post Editor**: Live preview, auto-save, draft management (dev only)
3. **Projects Portfolio**: Static projects list
4. **Tab Navigation**: Blog ↔ About tabs with URL state
5. **Static Export**: GitHub Pages deployment

### Business Logic
- **Post Visibility**: Only published posts shown publicly
- **ULID-based IDs**: Stable identifiers for posts
- **Slug-based URLs**: `/posts/{slug}` for SEO
- **File Storage**: `storage/posts/{ulid}-{slug}.md`
- **Draft Workflow**: Save → Publish (two-step)

---

## Target Architecture & Stack

### Target Tech Stack
- **Framework**: React 19.1.0 (no Next.js)
- **Build Tool**: Vite (from todo-app reference)
- **TypeScript**: 5.x (maintain)
- **Styling**: Tailwind CSS (maintain)
- **State Management**: TanStack Query (maintain)
- **Deployment**: GitHub Pages static export (maintain)

### Target Architecture
**Five-Layer Clean Architecture** (from FE_CLEAN_ARCHITECTURE.md):

```
🟦 Domain Layer (Most Pure)
  └── Business entities, DTOs, validators
  └── No external dependencies

🟩 Application Layer
  └── Use cases (business operations)
  └── Ports (interfaces)
  └── Depends only on Domain

🟨 Infrastructure Layer
  └── Generic technical tools
  └── Library wrappers
  └── Reusable across domains

🟧 Adapters Layer
  └── Port implementations
  └── Domain-specific adapters
  └── Uses Infrastructure

🟥 Presentation Layer
  └── React components
  └── Depends on Application + Domain
```

### Key Architectural Changes

| Aspect | Current (Next.js) | Target (Vite) |
|--------|------------------|---------------|
| **Layers** | 3 tiers (Volatility-based) | 5 layers (Concentric purity) |
| **Build** | Next.js/Webpack | Vite |
| **Routing** | Next.js App Router (RSC) | React Router (client-side) |
| **SSR** | Server Components | Client-only (static pre-render) |
| **API Routes** | Next.js API routes | Backend service or static JSON |
| **Data Fetching** | Server Components + React Query | React Query only |
| **File Structure** | `app/` directory | `src/` directory |
| **Static Export** | `next export` | Vite build → static HTML |

---

## Related Code

### Domain Layer (PRESERVE - TIER 3)
**Core business logic - Zero changes needed**

- [src/domain/blog/entities/post.entity.ts](../src/domain/blog/entities/post.entity.ts) - Post entity definition
- [src/domain/blog/use-cases/](../src/domain/blog/use-cases/) - 9 use cases (getPostsUseCase, savePostUseCase, etc.)
- [src/domain/blog/policies/post-visibility.policy.ts](../src/domain/blog/policies/post-visibility.policy.ts) - Visibility rules
- [src/domain/blog/services/markdown.service.ts](../src/domain/blog/services/markdown.service.ts) - Markdown processing
- [src/domain/blog/ports/post.repository.port.ts](../src/domain/blog/ports/post.repository.port.ts) - Repository interface
- [src/domain/projects/](../src/domain/projects/) - Projects domain

**Status**: ✅ Already pure TypeScript, framework-agnostic

---

### Infrastructure Layer (REFACTOR - TIER 2)
**External adapters - Need updates for Vite**

#### Current Repositories
- [src/infrastructure/blog/repositories/post.filesystem.repository.ts](../src/infrastructure/blog/repositories/post.filesystem.repository.ts:1) - **REMOVE** (Server-side only)
- [src/infrastructure/blog/repositories/post.api.repository.ts](../src/infrastructure/blog/repositories/post.api.repository.ts:1) - **REFACTOR** (No Next.js API routes)
- [src/infrastructure/blog/repositories/post.repository.ts](../src/infrastructure/blog/repositories/post.repository.ts:1) - **REFACTOR** (IOC container)

#### Migration Strategy
1. **Remove**: FileSystemPostRepository (no server-side in Vite)
2. **Replace**: ApiPostRepository → StaticJsonRepository (pre-built JSON files)
3. **Alternative**: ApiPostRepository → BackendServiceRepository (if adding backend)
4. **Update**: IOC container to provide client-only repository

---

### Presentation Layer (REPLACE - TIER 1)
**Framework-specific code - Complete rewrite**

#### Next.js-Specific (DELETE)
- [app/layout.tsx](../app/layout.tsx) - Next.js root layout
- [app/page.tsx](../app/page.tsx) - Server Component
- [app/(with-nav)/](../app/(with-nav)/) - Route groups (Next.js feature)
- [app/api/](../app/api/) - API routes (Next.js feature)
- [next.config.ts](../next.config.ts) - Next.js config

#### React Components (MIGRATE)
- [app/_components/](../app/_components/) - Shared UI components → **Keep, move to src/presentation/**
- [app/_components/blog/blog-list.tsx](../app/_components/blog/blog-list.tsx) - **Migrate to Vite**
- [app/_components/tabs/](../app/_components/tabs/) - Tab system → **Keep logic, update imports**
- [app/editor/](../app/editor/) - Post editor → **Migrate, add routing**

#### Adapters (REFACTOR)
- [app/_adapters/_hooks/](../app/_adapters/_hooks/) - React Query wrappers → **Move to src/adapters/**
- [app/_adapters/_providers/query-provider.tsx](../app/_adapters/_providers/query-provider.tsx) - **Update for Vite**

---

### Build & Config (REPLACE)
- [package.json](../package.json:1) - **Update**: Remove Next.js, add Vite
- [tsconfig.json](../tsconfig.json:1) - **Update**: Vite path aliases
- [next.config.ts](../next.config.ts:1) - **DELETE**: Replace with vite.config.ts
- [eslint.config.mjs](../eslint.config.mjs:1) - **Review**: May need Vite-specific rules
- [.eslintrc.architecture.json](../.eslintrc.architecture.json:1) - **Update**: Layer boundaries for 5-layer arch

---

### Content & Data
- [storage/posts/](../storage/posts/) - Markdown files → **PRESERVE** (no changes)
- [scripts/generate-redirects.ts](../scripts/generate-redirects.ts:1) - **Review**: May need updates for Vite
- [scripts/migrate-posts.ts](../scripts/migrate-posts.ts:1) - **Preserve** (data migration tool)

---

## Related Knowledge Base

### Architecture Foundation
- [docs/kb/ARCHITECTURE.md](../docs/kb/ARCHITECTURE.md) - Current volatility-based architecture
  - **Key Learning**: Three-tier separation (Stable → Moderate → Volatile)
  - **Relevance**: Target architecture expands to 5 layers with same principles

### Recent Refactors
- [docs/plans/20251007-001-plan-ioc-architecture-refactor.md](../docs/plans/20251007-001-plan-ioc-architecture-refactor.md) - IOC container pattern (COMPLETED)
  - **Key Learning**: Explicit dependency injection via factory pattern
  - **Relevance**: Must preserve `createBlogApi(repository)` pattern
  - **Migration Impact**: IOC container needs update for client-only repositories

- [docs/plans/20251006-001-plan-editor-draft-publish-workflow.md](../docs/plans/20251006-001-plan-editor-draft-publish-workflow.md) - Draft/publish workflow
  - **Key Learning**: ULID-based IDs, explicit status enum
  - **Relevance**: Must preserve exact same workflow in Vite
  - **Migration Impact**: Editor component logic stays identical

- [docs/plans/20251007-001-plan-unified-tabbed-interface.md](../docs/plans/20251007-001-plan-unified-tabbed-interface.md) - Tab navigation
  - **Key Learning**: URL-based state with query parameters
  - **Relevance**: Must implement same pattern with React Router
  - **Migration Impact**: Router setup needs URL state sync

---

## Requirements Clarification

### Q1: What specific changes are you looking for?
**A**: Both stack migration (Next.js → Vite) and architecture refinement (3-tier → 5-layer clean architecture)

### Q2: From the todo-app reference, what key differences should I adopt?
**A**: Everything - Vite build tool, folder structure, configuration patterns

### Q3: Should features and UI remain the same?
**A**:
- ✅ Zero visual changes (exact same HTML/CSS)
- ✅ Same user-facing features (blog, editor, projects)
- ✅ Same URLs and routing structure
- ✅ OK to change: internal code structure, build process, dependencies

### Q4: Should the migration include editor/API in production?
**A**: Keep current approach (dev-only editor, static export for production)

### Q5: Preferred migration approach?
**A**: Big bang rewrite (working in separate `vite` branch)

### Q6: Testing requirements?
**A**: No existing tests - manual testing acceptable

### Q7: Deployment constraints?
**A**: Yes, must continue deploying to GitHub Pages as static site

### Q8: Development workflow?
**A**: Keep current (local filesystem for editor, static export for production)

---

## Initial Scope

### Phase 1: Project Setup
- [ ] Create Vite project structure
- [ ] Install dependencies (React, TypeScript, Tailwind, TanStack Query)
- [ ] Configure Vite build for static export
- [ ] Set up ESLint for 5-layer architecture enforcement
- [ ] Configure path aliases (@domain, @application, @infrastructure, @adapters, @presentation)

### Phase 2: Domain Layer (Copy as-is)
- [ ] Copy `src/domain/` directory unchanged
- [ ] Verify zero external dependencies
- [ ] Update exports/imports if needed for new path aliases

### Phase 3: Application Layer (Refactor from Domain)
- [ ] Extract use cases from `src/domain/blog/use-cases/` → `src/application/blog/use-cases/`
- [ ] Extract ports from `src/domain/blog/ports/` → `src/application/blog/ports/`
- [ ] Ensure Application layer depends only on Domain

### Phase 4: Infrastructure Layer
- [ ] Move shared utilities to `src/infrastructure/`
- [ ] Wrap external libraries (marked, shiki, date-fns, etc.)
- [ ] Make infrastructure domain-agnostic and reusable

### Phase 5: Adapters Layer
- [ ] Create `StaticJsonRepository` to replace `ApiPostRepository`
  - Pre-build posts.json during Vite build
  - Read from static JSON in client
- [ ] Update IOC container for client-only repository
- [ ] Migrate React Query wrappers to `src/adapters/react-query/`
- [ ] Create router adapter for URL state management

### Phase 6: Presentation Layer
- [ ] Set up React Router with routes:
  - `/` - Home (tabs)
  - `/posts/:slug` - Post detail
  - `/editor` - Editor (dev only)
- [ ] Migrate all components from `app/_components/` to `src/presentation/components/`
- [ ] Migrate editor to `src/presentation/pages/editor/`
- [ ] Implement tab navigation with URL state
- [ ] Recreate layouts (header, navigation)

### Phase 7: Build & Deployment
- [ ] Configure Vite build for static export
- [ ] Generate static JSON from markdown files during build
- [ ] Set up GitHub Pages deployment script
- [ ] Generate redirects file (if needed)
- [ ] Test static export locally

### Phase 8: Styling
- [ ] Migrate Tailwind CSS v4 config
- [ ] Copy global styles
- [ ] Ensure exact same visual output

### Phase 9: Dev Features
- [ ] Conditionally render editor only in dev mode
- [ ] Implement file save logic (local filesystem via electron/tauri or backend service?)
  - **Decision needed**: How to save files without Next.js API routes?
  - Option A: Electron wrapper for filesystem access
  - Option B: Simple Node.js backend for dev
  - Option C: Browser-only (no save, copy/paste workflow)

### Phase 10: Testing & Validation
- [ ] Manual smoke test all features
- [ ] Verify all existing URLs work
- [ ] Compare visual output (side-by-side)
- [ ] Test static export and deployment
- [ ] Performance check (Lighthouse)

---

## Out of Scope

### Explicitly NOT Changing
- ❌ Visual design or UI/UX
- ❌ URL structure or routing paths
- ❌ Post content or data format
- ❌ Business logic or workflows
- ❌ Markdown rendering output
- ❌ GitHub Pages deployment target

### Future Considerations (Not in This Migration)
- Automated testing suite
- CMS integration
- Backend service for editor
- Database migration (away from markdown files)
- Mobile app
- Authentication/authorization

---

## Key Decisions Required

### Decision 1: Editor File Saving
**Problem**: Current editor uses Next.js API routes to save to filesystem. Vite has no server-side runtime.

**Options**:
1. **Electron/Tauri wrapper** (desktop app)
   - ✅ Native filesystem access
   - ✅ No backend needed
   - ❌ Adds complexity
   - ❌ Different dev environment

2. **Simple Node.js backend** (dev only)
   - ✅ Minimal - just file CRUD endpoints
   - ✅ Similar to current workflow
   - ❌ Need to run separate server

3. **Browser-only workflow**
   - ✅ Simplest implementation
   - ✅ Pure Vite SPA
   - ❌ No auto-save to disk
   - ❌ Manual copy/paste workflow

**Recommendation**: Option 2 (Node.js backend for dev) - closest to current workflow

### Decision 2: Static Data Generation
**Problem**: Need to convert markdown files to JSON during build

**Options**:
1. **Vite plugin** (custom)
   - Process markdown files during build
   - Generate posts.json in public/
   - ✅ Integrated with Vite
   - ❌ Need to write plugin

2. **Pre-build script**
   - Run before `vite build`
   - ✅ Simple, separate concern
   - ❌ Extra build step

**Recommendation**: Option 2 (pre-build script) - simpler, clearer separation

### Decision 3: Layer Reorganization
**Problem**: Current 3-tier vs target 5-layer architecture

**Mapping**:
```
Current                    Target
─────────────────────────────────────────────
src/domain/entities/    → src/domain/
src/domain/policies/    → src/domain/

src/domain/use-cases/   → src/application/use-cases/
src/domain/ports/       → src/application/ports/

src/shared/utils/       → src/infrastructure/

src/infrastructure/     → src/adapters/
repositories/

app/_adapters/          → src/adapters/

app/_components/        → src/presentation/
```

---

## Migration Risks & Mitigations

### Risk 1: URL Breakage
- **Risk**: Different router might change URL structure
- **Impact**: SEO loss, broken links
- **Mitigation**:
  - Test all existing URLs manually
  - Generate sitemap comparison
  - Add redirects if needed

### Risk 2: Markdown Rendering Changes
- **Risk**: Different build process might affect HTML output
- **Impact**: Visual regressions, broken formatting
- **Mitigation**:
  - Keep exact same libraries (marked, shiki)
  - Visual comparison of rendered posts
  - Test with all existing posts

### Risk 3: Static Export Failure
- **Risk**: Vite static build might not work like Next.js export
- **Impact**: Cannot deploy to GitHub Pages
- **Mitigation**:
  - Test static build early in process
  - Ensure all routes pre-render correctly
  - Test deployment to staging branch

### Risk 4: Data Loss During Migration
- **Risk**: Accidentally delete or corrupt markdown files
- **Impact**: Content loss
- **Mitigation**:
  - ✅ Working in separate branch
  - Full backup of storage/ directory
  - Git history preservation

### Risk 5: Performance Regression
- **Risk**: Client-only rendering might be slower than SSR
- **Impact**: Worse user experience, SEO
- **Mitigation**:
  - Pre-render all routes during build
  - Lighthouse score comparison
  - Bundle size monitoring

---

## Success Criteria

### Functional Requirements
- ✅ All existing posts load correctly
- ✅ All URLs work identically
- ✅ Editor works in dev mode
- ✅ Draft/publish workflow unchanged
- ✅ Tab navigation works
- ✅ Static export generates deployable site
- ✅ GitHub Pages deployment succeeds

### Non-Functional Requirements
- ✅ Zero visual differences (pixel-perfect)
- ✅ Same or better performance (Lighthouse 90+)
- ✅ All Markdown renders identically
- ✅ No console errors
- ✅ TypeScript strict mode passes
- ✅ ESLint clean (5-layer architecture rules)

### Architecture Requirements
- ✅ 5-layer clean architecture implemented
- ✅ Domain layer has zero external dependencies
- ✅ Application layer depends only on Domain
- ✅ Infrastructure is domain-agnostic
- ✅ Presentation depends on Application + Domain
- ✅ No circular dependencies
- ✅ ESLint enforces layer boundaries

---

## Next Steps

1. **Review & Approve**: User confirms scope and approach
2. **Create SPEC**: Detailed technical specification with acceptance criteria
3. **Prototype**: Spike on key decisions (editor file saving, static data generation)
4. **Implementation**: Follow phased migration plan
5. **Testing**: Manual validation of all features
6. **Deployment**: Merge to main and deploy

---

## Estimated Effort

**Complexity**: High
**Risk**: Medium-High
**Time Estimate**: 2-3 days (full-time)

### Breakdown
- Setup (Vite + deps): 2-4 hours
- Layer reorganization: 4-6 hours
- Component migration: 6-8 hours
- Routing setup: 2-3 hours
- Build & deployment: 3-4 hours
- Testing & fixes: 4-6 hours

**Total**: 21-31 hours

---

## Open Questions

1. Should we use Electron/Tauri for editor or keep it simple with Node.js backend?
2. Do we need any new libraries for the migration?
3. Should we add automated tests during this migration or defer?
4. Any specific Vite plugins needed (markdown, etc.)?
5. Should we maintain backward compatibility with Next.js or clean break?

---

## References

- [FE_CLEAN_ARCHITECTURE.md](https://github.com/eatnug/thirdcommit/blob/main/documents/FE_CLEAN_ARCHITECTURE.md) - Target architecture
- [todo-app](https://github.com/eatnug/thirdcommit/tree/main/todo-app) - Reference Vite setup
- [Current ARCHITECTURE.md](../docs/kb/ARCHITECTURE.md) - Current volatility-based architecture
- [Vite Documentation](https://vitejs.dev/) - Build tool docs
- [React Router](https://reactrouter.com/) - Client-side routing
