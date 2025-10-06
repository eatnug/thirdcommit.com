# Frontend Architecture Documentation

## Overview

**Volatility-based hexagonal architecture** for Next.js applications, combining:
- **Hexagonal architecture** (Ports & Adapters) for technology independence
- **Volatility-based decomposition** for explicit replaceability boundaries
- **Feature-first organization** for scalability and "screaming architecture"

### Core Principle

Code is organized by **change frequency** and **replaceability**, not just technical layers:

```
🔴 TIER 1 (Volatile)   → Dump when changing frameworks (React → Vue)
🟡 TIER 2 (Moderate)   → Replace when changing infrastructure (FS → API)
🟢 TIER 3 (Stable)     → Never dump - your business logic
```

---

## Directory Structure

```
app/                                    # 🔴 TIER 1: VOLATILE (Framework Layer)
├── (routes)/                          # Next.js route groups
│   └── [feature]/
│       ├── page.tsx                   # Route handlers
│       └── _ui/                       # Route-specific components
│
├── _adapters/                         # 🔴 TIER 1: Framework adapters
│   └── hooks/                         # React Query wrappers
│       ├── use-query-wrapper.ts       # Generic query wrapper
│       ├── use-mutation-wrapper.ts    # Generic mutation wrapper
│       └── use-posts.ts               # Feature-specific (optional)
│
└── _components/                       # 🔴 TIER 1: Shared UI
    └── ui/                            # Design system components

src/
└── features/                          # Feature-first organization
    ├── blog/
    │   ├── core/                      # 🟢 TIER 3: STABLE (Business Logic)
    │   │   ├── entities/              # Domain models
    │   │   │   └── post.entity.ts
    │   │   ├── policies/              # Business rules (NEW!)
    │   │   │   └── post-visibility.policy.ts
    │   │   ├── ports/                 # Contracts/interfaces
    │   │   │   └── post-repository.port.ts
    │   │   ├── use-cases/             # Business operations
    │   │   │   ├── get-posts.use-case.ts
    │   │   │   └── get-post-by-slug.use-case.ts
    │   │   └── errors/                # Domain errors
    │   │       └── post.error.ts
    │   │
    │   ├── infrastructure/            # 🟡 TIER 2: MODERATE (Adapters)
    │   │   ├── repositories/          # Data access implementations
    │   │   │   ├── post.repository.ts           # Provider
    │   │   │   ├── post.filesystem.repository.ts
    │   │   │   ├── post.api.repository.ts       # (future)
    │   │   │   └── post.cache.repository.ts     # (future)
    │   │   └── dto/                   # Data transformations
    │   │       └── post.dto.ts
    │   │
    │   └── index.ts                   # PUBLIC API (barrel export)
    │
    └── shared/                        # Cross-feature code
        ├── core/                      # 🟢 TIER 3: Shared business logic
        ├── infrastructure/            # 🟡 TIER 2: Shared adapters
        └── utils/                     # 🔴 TIER 1: Helper functions
```

---

## The Three Tiers (Volatility Model)

### 🔴 TIER 1: Highly Volatile (Framework Layer)

**Location:** `app/`

**Lifespan:** Until framework migration

**Change frequency:** Weekly/Monthly

**Dump when:**
- Migrating React → Vue/Svelte
- Switching Next.js → Remix/Vite
- Complete UI redesign

**Contains:**
- Next.js routes and pages
- React components and hooks
- Framework-specific adapters
- UI styling (CSS, Tailwind)

**Example:**
```typescript
// app/(routes)/blog/page.tsx
import { blog } from '@/features/blog'

export default async function BlogPage() {
  const posts = await blog.getPosts()
  return <PostList posts={posts} />
}
```

---

### 🟡 TIER 2: Moderate Volatility (Infrastructure Layer)

**Location:** `src/features/[domain]/infrastructure/`

**Lifespan:** Until infrastructure change

**Change frequency:** Quarterly/Bi-annually

**Replace when:**
- Switching data sources (filesystem → CMS → API)
- Changing databases
- Adding caching layers

**Contains:**
- Repository implementations
- Data transformation (DTOs)
- External service wrappers

**Example:**
```typescript
// src/features/blog/infrastructure/repositories/post.filesystem.repository.ts
export class FileSystemPostRepository implements IPostRepository {
  async getPosts(): Promise<Post[]> {
    const fs = await import('fs')
    // Read from filesystem, transform to domain entities
  }
}
```

---

### 🟢 TIER 3: Stable Core (Business Logic)

**Location:** `src/features/[domain]/core/`

**Lifespan:** Lifetime of the business

**Change frequency:** Yearly/Multi-year

**Never dump** (this survives all technology changes)

**Contains:**
- Business rules and policies
- Domain entities
- Port interfaces (contracts)
- Use cases
- Domain errors

**Example:**
```typescript
// src/features/blog/core/policies/post-visibility.policy.ts
export class PostVisibilityPolicy {
  static shouldShowInPublicList(post: Post, environment: string): boolean {
    return environment === 'production' ? !post.draft : true
  }
}
```

---

## Hexagonal Architecture (Ports & Adapters)

### The Hexagon

```
                    PRIMARY ADAPTERS
                  (Driving the Application)
                           ↓
    ┌─────────────────────────────────────────┐
    │                                         │
    │         APPLICATION CORE                │
    │        (Business Logic)                 │
    │                                         │
    │  ┌──────────────────────────────────┐  │
    │  │  Entities                        │  │
    │  │  Policies (Business Rules)       │  │
    │  │  Use Cases                       │  │
    │  │  Ports (Interfaces)              │  │
    │  └──────────────────────────────────┘  │
    │                                         │
    └─────────────────────────────────────────┘
                           ↓
                   SECONDARY ADAPTERS
                  (Driven by Application)
```

### Dependency Direction

**INWARD DEPENDENCY RULE**: All dependencies point towards the core

```
PRIMARY ADAPTERS → CORE ← SECONDARY ADAPTERS
   (UI, API)              (Database, External APIs)
```

Detailed flow:
```
app/                                  (🔴 TIER 1 - UI)
  ↓ depends on
src/features/[domain]/index.ts        (Public API)
  ↓ depends on
src/features/[domain]/core/           (🟢 TIER 3 - Business Logic)
  ↓ depends on (interfaces only)
src/features/[domain]/core/ports/     (🟢 TIER 3 - Contracts)
  ↑ implemented by
src/features/[domain]/infrastructure/ (🟡 TIER 2 - Adapters)
```

---

## Key Patterns

### 1. Business Policies (NEW!)

Extract business rules into reusable policy classes:

**Before:**
```typescript
// ❌ Business logic scattered in use-cases
export async function getPostsUseCase(repo: IPostRepository): Promise<Post[]> {
  const posts = await repo.getPosts()
  if (process.env.NODE_ENV === 'production') {
    return posts.filter(post => !post.draft)
  }
  return posts
}
```

**After:**
```typescript
// ✅ Business logic in reusable policy
// core/policies/post-visibility.policy.ts
export class PostVisibilityPolicy {
  static shouldShowInPublicList(post: Post, env: string): boolean {
    return env === 'production' ? !post.draft : true
  }
}

// core/use-cases/get-posts.use-case.ts
export async function getPostsUseCase(
  repo: IPostRepository,
  env: string = process.env.NODE_ENV
): Promise<Post[]> {
  const posts = await repo.getPosts()
  return posts.filter(post => PostVisibilityPolicy.shouldShowInPublicList(post, env))
}
```

**Benefits:**
- ✅ Reusable across multiple use-cases
- ✅ Testable in isolation
- ✅ Clear naming communicates intent
- ✅ Domain experts can review
- ✅ Very stable (TIER 3)

---

### 2. Feature Barrel Exports

Each feature exposes a public API via `index.ts`:

```typescript
// src/features/blog/index.ts

// Re-export core (TIER 3)
export type { Post } from './core/entities/post.entity'
export { PostVisibilityPolicy } from './core/policies/post-visibility.policy'
export { getPostsUseCase, getPostBySlugUseCase } from './core/use-cases'

// Re-export infrastructure (TIER 2 - for testing)
export { postRepository } from './infrastructure/repositories/post.repository'
export type { IPostRepository } from './core/ports/post-repository.port'

// Convenience API (pre-wired)
import { postRepository } from './infrastructure/repositories/post.repository'
import { getPostsUseCase } from './core/use-cases/get-posts.use-case'

export const blog = {
  getPosts: (env?: string) => getPostsUseCase(postRepository, env),
  // ... other methods
}
```

**Usage:**
```typescript
// Simple - use pre-wired API
import { blog } from '@/features/blog'
const posts = await blog.getPosts()

// Advanced - import individual pieces
import { getPostsUseCase, postRepository } from '@/features/blog'
const posts = await getPostsUseCase(postRepository)

// Testing - inject mocks
import { getPostsUseCase, type IPostRepository } from '@/features/blog'
const mockRepo: IPostRepository = { ... }
const posts = await getPostsUseCase(mockRepo)
```

---

### 3. Generic React Query Wrappers

Instead of feature-specific hooks everywhere, use generic wrappers:

```typescript
// app/_adapters/hooks/use-query-wrapper.ts
export function useQueryWrapper<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseQueryOptions<TData>
) {
  return useQuery({ queryKey, queryFn, ...options })
}

// Usage in components
import { useQueryWrapper } from '@/app/_adapters/hooks'
import { blog } from '@/features/blog'

function BlogList() {
  const { data: posts } = useQueryWrapper(['posts'], blog.getPosts)
  return <div>{posts?.map(...)}</div>
}
```

**Optional:** Create feature-specific hooks if needed:
```typescript
// app/_adapters/hooks/use-posts.ts
export function usePosts() {
  return useQueryWrapper(['posts'], blog.getPosts)
}
```

---

### 4. Port Interfaces & Dependency Injection

Use-cases depend on interfaces, not implementations:

```typescript
// core/ports/post-repository.port.ts (TIER 3)
export interface IPostRepository {
  getPosts(): Promise<Post[]>
  getPostBySlug(slug: string): Promise<Post | null>
}

// core/use-cases/get-posts.use-case.ts (TIER 3)
export async function getPostsUseCase(
  repository: IPostRepository = postRepository  // Default for convenience
): Promise<Post[]> {
  return repository.getPosts()
}

// infrastructure/repositories/post.filesystem.repository.ts (TIER 2)
export class FileSystemPostRepository implements IPostRepository {
  async getPosts(): Promise<Post[]> { /* ... */ }
}

// infrastructure/repositories/post.repository.ts (TIER 2 - Provider)
export const postRepository: IPostRepository = new FileSystemPostRepository()
```

**Switch implementations easily:**
```typescript
// Change this one line to swap all implementations
export const postRepository: IPostRepository = process.env.USE_API
  ? new ApiPostRepository()
  : new FileSystemPostRepository()
```

---

### 5. Dynamic Imports for Server-Only Code

Prevent server code from bundling in client:

```typescript
export class FileSystemPostRepository implements IPostRepository {
  async getPosts(): Promise<Post[]> {
    // Dynamic import - prevents bundling in client
    const fs = await import('fs')
    const path = await import('path')

    const files = fs.readdirSync(postsDirectory)
    // ... implementation
  }
}
```

---

## Dependency Rules

### ✅ Allowed Dependencies

```typescript
// ✅ TIER 1 (Volatile) depends on TIER 3 (Stable)
// app/blog/page.tsx
import { blog } from '@/features/blog'

// ✅ TIER 2 (Moderate) depends on TIER 3 (Stable)
// infrastructure/repositories/post.filesystem.repository.ts
import type { IPostRepository } from '@/features/blog/core/ports'

// ✅ TIER 3 (Stable) depends on TIER 3 (Stable)
// core/use-cases/get-posts.use-case.ts
import { PostVisibilityPolicy } from '../policies/post-visibility.policy'
```

### ❌ Forbidden Dependencies

```typescript
// ❌ TIER 3 (Stable) depends on TIER 1 (Volatile)
// core/use-cases/get-posts.use-case.ts
import { useQuery } from '@tanstack/react-query' // NEVER!

// ❌ TIER 3 (Stable) depends on TIER 2 (Moderate)
// core/use-cases/get-posts.use-case.ts
import { FileSystemPostRepository } from '../../infrastructure/repositories' // NEVER!

// ❌ TIER 2 (Moderate) depends on TIER 1 (Volatile)
// infrastructure/repositories/post.filesystem.repository.ts
import { Button } from '@/app/_components/ui/button' // NEVER!
```

---

## Path Aliases

```json
{
  "paths": {
    "@/*": ["./*"],
    "@/features/*": ["./src/features/*"],
    "@/app/*": ["./app/*"]
  }
}
```

---

## Adding a New Feature

### Step 1: Define the Core (TIER 3 - Stable)

```
src/features/[feature-name]/core/
├── entities/           # Domain models (pure TypeScript)
├── policies/           # Business rules (NEW!)
├── ports/              # Contracts/interfaces
├── use-cases/          # Business operations
└── errors/             # Domain errors
```

**Example:**
```typescript
// entities/comment.entity.ts
export interface Comment {
  id: string
  author: string
  content: string
  createdAt: Date
}

// policies/comment-moderation.policy.ts
export class CommentModerationPolicy {
  static requiresApproval(comment: Comment): boolean {
    return comment.content.length > 1000 // Example rule
  }
}

// ports/comment-repository.port.ts
export interface ICommentRepository {
  getComments(postId: string): Promise<Comment[]>
  addComment(comment: Comment): Promise<void>
}

// use-cases/get-comments.use-case.ts
export async function getCommentsUseCase(
  postId: string,
  repository: ICommentRepository
): Promise<Comment[]> {
  return repository.getComments(postId)
}
```

### Step 2: Implement Infrastructure (TIER 2 - Moderate)

```
src/features/[feature-name]/infrastructure/
├── repositories/       # Adapter implementations
│   ├── [name].repository.ts          # Provider
│   └── [name].api.repository.ts      # Implementation
└── dto/                # Data transformations
    └── [name].dto.ts
```

**Example:**
```typescript
// dto/comment.dto.ts
export interface CommentDto {
  id: string
  author: string
  content: string
  created_at: string  // Note: snake_case from API
}

export function commentDtoToDomain(dto: CommentDto): Comment {
  return {
    id: dto.id,
    author: dto.author,
    content: dto.content,
    createdAt: new Date(dto.created_at), // Transform
  }
}

// repositories/comment.api.repository.ts
export class ApiCommentRepository implements ICommentRepository {
  async getComments(postId: string): Promise<Comment[]> {
    const response = await fetch(`/api/posts/${postId}/comments`)
    const dtos: CommentDto[] = await response.json()
    return dtos.map(commentDtoToDomain)
  }
}

// repositories/comment.repository.ts (Provider)
export const commentRepository: ICommentRepository = new ApiCommentRepository()
```

### Step 3: Create Public API

```typescript
// src/features/[feature-name]/index.ts
export type { Comment } from './core/entities/comment.entity'
export { CommentModerationPolicy } from './core/policies/comment-moderation.policy'
export { getCommentsUseCase } from './core/use-cases/get-comments.use-case'
export { commentRepository } from './infrastructure/repositories/comment.repository'

import { commentRepository } from './infrastructure/repositories/comment.repository'
import { getCommentsUseCase } from './core/use-cases/get-comments.use-case'

export const comments = {
  getComments: (postId: string) => getCommentsUseCase(postId, commentRepository),
}
```

### Step 4: Use in UI (TIER 1 - Volatile)

```typescript
// Server Component
// app/(routes)/posts/[id]/page.tsx
import { comments } from '@/features/comments'

export default async function PostPage({ params }: { params: { id: string } }) {
  const commentList = await comments.getComments(params.id)
  return <CommentList comments={commentList} />
}

// Client Component
// app/(routes)/posts/[id]/comments-section.tsx
'use client'
import { useQueryWrapper } from '@/app/_adapters/hooks'
import { comments } from '@/features/comments'

export function CommentsSection({ postId }: { postId: string }) {
  const { data } = useQueryWrapper(['comments', postId], () =>
    comments.getComments(postId)
  )
  return <CommentList comments={data} />
}
```

---

## Testing Strategy

### Unit Testing (TIER 3 - Business Logic)

```typescript
import { getPostsUseCase } from '@/features/blog'
import type { IPostRepository } from '@/features/blog'

const mockRepository: IPostRepository = {
  getPosts: jest.fn().mockResolvedValue([
    { title: 'Test', draft: false, /* ... */ }
  ]),
  // ... other methods
}

test('filters drafts in production', async () => {
  const posts = await getPostsUseCase(mockRepository, 'production')
  expect(posts.every(p => !p.draft)).toBe(true)
})
```

### Integration Testing (TIER 2 - Adapters)

```typescript
test('FileSystemPostRepository reads from disk', async () => {
  const repository = new FileSystemPostRepository()
  const posts = await repository.getPosts()
  expect(posts).toHaveLength(expectedCount)
})
```

### E2E Testing (TIER 1 - UI)

```typescript
test('user can view blog posts', async () => {
  render(<BlogPage />)
  await waitFor(() => {
    expect(screen.getByText('My Post Title')).toBeInTheDocument()
  })
})
```

---

## Benefits

### 🎯 Clear Boundaries
Know exactly what to throw away during migrations:
- **React → Vue:** Dump TIER 1, keep TIER 2 & 3
- **Filesystem → CMS:** Replace TIER 2, keep TIER 1 & 3
- **New feature:** Add to TIER 3, wire in TIER 2, expose in TIER 1

### 🧪 Testability
- **TIER 3:** Unit tests (business logic in isolation)
- **TIER 2:** Integration tests (real adapters)
- **TIER 1:** E2E tests (user flows)

### 🚀 Technology Independence
- Business logic (TIER 3) has zero framework dependencies
- Can migrate frameworks without rewriting business rules
- Repository pattern allows swapping data sources

### 📊 Technical Debt Visibility
- Changes in TIER 3 = high cost (business logic)
- Changes in TIER 1 = low cost (UI tweaks)
- Changes in TIER 2 = medium cost (infrastructure)

### 🔄 Migration Confidence
- TIER 1 changes don't affect business logic
- TIER 2 changes don't affect UI or business rules
- Each tier can evolve independently

---

## Real-World Scenarios

### Scenario 1: Migrate React to Vue

**What changes:**
- 🔴 TIER 1: Complete rewrite (40% of codebase)

**What stays:**
- 🟢 TIER 3: Zero changes (business logic)
- 🟡 TIER 2: Zero changes (repositories)

### Scenario 2: Switch Filesystem to Headless CMS

**What changes:**
- 🟡 TIER 2: Replace one adapter (5% of codebase)

**What stays:**
- 🟢 TIER 3: Zero changes (use-cases)
- 🔴 TIER 1: Zero changes (UI)

### Scenario 3: Add New Business Feature

**What changes:**
- 🟢 TIER 3: Add policy + use-case
- 🟡 TIER 2: Add repository method
- 🔴 TIER 1: Add UI component

---

## Migration Notes

**From:** Traditional hexagonal architecture

**To:** Volatility-based hexagonal architecture

**Key changes:**
1. ✅ Added **business policies** (`core/policies/`)
2. ✅ Added **feature barrel exports** (`features/[domain]/index.ts`)
3. ✅ Simplified **adapters folder** (no `_react/` vs `_nextjs/` separation)
4. ✅ Explicit **volatility tiers** in documentation
5. ✅ Pre-wired **convenience API** in barrel exports

---

## Quick Reference

| Tier | Location | Change Frequency | Dump When |
|------|----------|------------------|-----------|
| 🔴 **TIER 1** | `app/` | Weekly/Monthly | Framework migration |
| 🟡 **TIER 2** | `src/features/*/infrastructure/` | Quarterly | Infrastructure change |
| 🟢 **TIER 3** | `src/features/*/core/` | Yearly | Never (business logic) |

---

## Additional Resources

- [VOLATILITY-TIERS.md](./VOLATILITY-TIERS.md) - Detailed volatility model explanation
- [Hexagonal Architecture (Alistair Cockburn)](https://alistair.cockburn.us/hexagonal-architecture)
- [Screaming Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)
- [Volatility-Based Decomposition](https://dmitripavlutin.com/frontend-architecture-stable-and-volatile-dependencies/)
- [Next.js App Router](https://nextjs.org/docs/app)
