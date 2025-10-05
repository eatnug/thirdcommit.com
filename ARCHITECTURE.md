# Architecture Documentation

## Overview

Feature-based clean architecture combining Next.js App Router conventions with domain-driven design principles.

## Directory Structure

```
app/
├── _lib/                          # Shared utilities (excluded from routing)
│   ├── components/ui/             # Common UI components (Button, Card, Badge, etc.)
│   └── hooks/                     # Generic hooks (useLocalStorage, useAutosave, etc.)
│
├── (with-nav)/                    # Route group with navigation
│   ├── blog/
│   │   ├── _components/           # Blog-specific UI components
│   │   │   └── post-card.tsx
│   │   └── page.tsx              # /blog route
│   ├── posts/[slug]/
│   │   └── page.tsx              # /posts/[slug] route
│   └── tags/
│       ├── page.tsx              # /tags route
│       └── [tag]/
│           └── page.tsx          # /tags/[tag] route
│
├── editor/
│   └── page.tsx                  # /editor route
│
└── api/
    └── posts/
        └── route.ts              # POST /api/posts

src/
├── features/                     # Feature modules (framework-agnostic)
│   ├── blog/
│   │   ├── core/                # Business logic
│   │   │   ├── entities/        # Domain models (Post)
│   │   │   ├── use-cases/       # Business operations (getPosts, getPostBySlug, etc.)
│   │   │   └── errors/          # Domain-specific errors
│   │   ├── data/                # Data access layer
│   │   │   ├── models/          # DTOs (data transfer objects)
│   │   │   ├── mappers/         # DTO ↔ Entity conversion
│   │   │   ├── repositories/    # Data access abstraction
│   │   │   └── sources/         # Actual data sources
│   │   │       └── local/       # Local filesystem source
│   │   └── hooks/               # Blog-specific React hooks
│   │       ├── use-posts.ts
│   │       ├── use-post.ts
│   │       ├── use-posts-by-tag.ts
│   │       └── use-all-tags.ts
│   │
│   └── editor/
│       ├── core/                # Editor business logic
│       │   ├── entities/        # Editor domain models
│       │   └── use-cases/       # Editor operations
│       ├── data/                # Editor data access
│       │   └── repositories/
│       └── hooks/               # Editor-specific hooks
│           └── use-editor-state.ts
│
├── shared/                       # Cross-domain utilities
│   ├── services/                # Shared services (markdown, etc.)
│   ├── utils/                   # Utility functions
│   ├── lib/                     # Third-party integrations
│   └── constants/               # Constants
│
└── infrastructure/               # Infrastructure configuration
    └── query-client/            # React Query setup
```

## Architecture Layers

### Dependency Direction

```
app/                             (Presentation - Framework-dependent)
  ↓ depends on
app/_lib/                        (Shared UI - React-dependent)
  ↓ depends on
src/features/[domain]/hooks/     (Domain hooks - React Query)
  ↓ depends on
src/features/[domain]/core/      (Business logic - Framework-agnostic)
  ↓ depends on
src/features/[domain]/data/      (Data access - Framework-agnostic)
  ↓ depends on
src/shared/                      (Pure utilities - No dependencies)
```

### Layer Responsibilities

**app/** - Next.js pages and routing
- Route definitions (page.tsx, layout.tsx)
- Server/Client components
- Route-specific UI components (_components/)

**app/_lib/** - Shared presentation utilities
- Common UI components (Button, Card, Badge, etc.)
- Generic React hooks (useLocalStorage, useAutosave, etc.)
- Not domain-specific, reusable across features

**src/features/[domain]/core/** - Business logic
- **Entities**: Domain models (pure TypeScript types/interfaces)
- **Use Cases**: Business operations (orchestrate repositories)
- **Errors**: Domain-specific error classes
- Framework-agnostic, testable without UI

**src/features/[domain]/data/** - Data access
- **Models**: DTOs matching external data formats
- **Mappers**: Convert DTOs ↔ Entities
- **Repositories**: Abstract data access (interface + implementation)
- **Sources**: Actual data sources (filesystem, API, cache, etc.)

**src/features/[domain]/hooks/** - Domain-specific React hooks
- Wrap use-cases with React Query
- Domain logic + state management
- Example: usePosts calls getPostsUseCase

**src/shared/** - Cross-cutting concerns
- Services (markdown rendering, analytics, etc.)
- Utility functions (date formatting, string manipulation, etc.)
- Constants and configuration

## Key Design Patterns

### 1. Dynamic Imports in Repositories

```typescript
// Why: Prevent bundling server-only code (fs, path) in client bundles
async getPosts(): Promise<Post[]> {
  // Dynamic import - only loaded at runtime on server
  const { postFileSystem } = await import('@/features/blog/data/sources/local/post-filesystem')
  const dtos = await postFileSystem.getAllPosts()
  return PostMapper.toDomainList(dtos)
}
```

### 2. Multiple Data Sources

```typescript
// Repository can switch between multiple sources
data/sources/
  ├── local/              # Filesystem (current)
  │   └── post-filesystem.ts
  └── remote/             # API (future)
      └── post-api.ts

// Repository decides which source to use
if (process.env.USE_API) {
  const { postApi } = await import('./sources/remote/post-api')
  return postApi.fetchPosts()
} else {
  const { postFileSystem } = await import('./sources/local/post-filesystem')
  return postFileSystem.getAllPosts()
}
```

### 3. Next.js Routing Exclusion

Files/folders starting with `_` are excluded from routing:
- `app/_lib/` - Not a route, safe to use for code organization
- `app/blog/_components/` - Not a route, components only

## Import Patterns

```typescript
// ✅ Pages import from _lib and features
import { Button } from '@/app/_lib/components/ui/button'
import { useLocalStorage } from '@/app/_lib/hooks'
import { usePosts } from '@/features/blog/hooks/use-posts'

// ✅ Domain hooks import use-cases
import { getPostsUseCase } from '@/features/blog/core/use-cases/get-posts.use-case'

// ✅ Use-cases import repositories
import { postRepository } from '@/features/blog/data/repositories/post.repository'

// ✅ Repositories import mappers and sources
import { PostMapper } from '@/features/blog/data/mappers/post.mapper'
import { postFileSystem } from '@/features/blog/data/sources/local/post-filesystem'

// ✅ Anyone can import from shared
import { cn } from '@/shared/utils/cn'
import { markdownService } from '@/shared/services/markdown.service'
```

## Path Aliases (tsconfig.json)

```json
{
  "paths": {
    "@/*": ["./*"],
    "@/features/*": ["./src/features/*"],
    "@/shared/*": ["./src/shared/*"],
    "@/infrastructure/*": ["./src/infrastructure/*"],
    "@/app/*": ["./app/*"]
  }
}
```

## Benefits

✅ **Clear separation of concerns** - Each layer has one responsibility
✅ **Framework independence** - Core and data layers are React/Next.js agnostic
✅ **Testability** - Business logic can be tested without UI
✅ **Scalability** - Add new features by following the same pattern
✅ **Flexibility** - Swap data sources without changing business logic
✅ **Type safety** - DTOs ↔ Entities conversion ensures data consistency
✅ **Next.js optimized** - Dynamic imports prevent client bundle bloat
✅ **Developer experience** - Clear structure, easy to navigate

## Adding a New Feature

1. **Create feature directory**: `src/features/[feature-name]/`
2. **Define entities**: `core/entities/`
3. **Create use cases**: `core/use-cases/`
4. **Implement data layer**:
   - Models: `data/models/`
   - Mappers: `data/mappers/`
   - Repository: `data/repositories/`
   - Sources: `data/sources/`
5. **Create React hooks**: `hooks/`
6. **Add pages**: `app/[feature-name]/page.tsx`
7. **Add UI components**: `app/[feature-name]/_components/`

## Migration Notes

**From:** Flat structure with `src/core/`, `src/data/`, `src/presentation/`
**To:** Feature-based with `src/features/[domain]/`

**Key changes:**
- Presentation hooks moved from `src/presentation/hooks/` → `app/_lib/hooks/` (generic) or `src/features/[domain]/hooks/` (domain-specific)
- UI components moved from `src/presentation/components/` → `app/_lib/components/ui/`
- Domain code organized by feature rather than by layer

**Build status:** ✅ 22 pages successfully generated, no routing conflicts

## References

- [CLEAN_ARCHITECTURE.md](./CLEAN_ARCHITECTURE.md) - Original clean architecture documentation
- [Next.js App Router](https://nextjs.org/docs/app)
- [Feature-Sliced Design](https://feature-sliced.design/)
