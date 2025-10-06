# Frontend Architecture Documentation

## Overview

**Volatility-based hexagonal architecture** for Next.js applications, combining:
- **Hexagonal architecture** (Ports & Adapters) for technology independence
- **Volatility-based decomposition** for explicit replaceability boundaries
- **Domain-driven design** for clear business logic separation

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
├── (with-nav)/                        # Next.js route groups
│   └── blog/
│       ├── page.tsx                   # Route handlers
│       └── _components/               # Route-specific components
│
├── _adapters/                         # 🔴 TIER 1: Framework adapters
│   ├── _hooks/                        # React hooks & React Query wrappers
│   │   ├── use-query-wrapper.ts       # Generic query wrapper
│   │   ├── use-mutation-wrapper.ts    # Generic mutation wrapper
│   │   ├── use-posts.ts               # Feature-specific hooks
│   │   ├── use-autosave.ts            # React-specific utilities
│   │   ├── use-before-unload.ts
│   │   └── use-local-storage.ts
│   │
│   └── _providers/                    # React providers
│       ├── query-provider.tsx         # React Query provider
│       └── query-client.ts
│
└── _components/                       # 🔴 TIER 1: Shared UI
    ├── button.tsx                     # Design system components
    ├── card.tsx
    └── ...

src/
├── domain/                            # 🟢 TIER 3: STABLE (Business Logic)
│   └── blog/
│       ├── entities/                  # Domain models
│       │   └── post.entity.ts
│       ├── policies/                  # Business rules
│       │   └── post-visibility.policy.ts
│       ├── ports/                     # Contracts/interfaces
│       │   └── post-repository.port.ts
│       ├── use-cases/                 # Business operations
│       │   ├── get-posts.use-case.ts
│       │   └── get-post-by-slug.use-case.ts
│       ├── errors/                    # Domain errors
│       │   └── post.error.ts
│       ├── services/                  # Domain services
│       │   └── markdown.service.ts
│       └── index.ts                   # PUBLIC API (barrel export)
│
├── infrastructure/                    # 🟡 TIER 2: MODERATE (Adapters)
│   └── blog/
│       ├── repositories/              # Data access implementations
│       │   ├── post.repository.ts             # Provider
│       │   └── post.filesystem.repository.ts
│       └── dto/                       # Data transformations
│           └── post.dto.ts
│
└── shared/                            # Cross-cutting concerns
    └── utils/                         # Framework-agnostic utilities
        ├── cn.ts                      # Pure functions (no framework deps)
        ├── debounce.ts
        ├── id.ts
        └── local-storage.ts
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
- Framework-specific adapters (React Query wrappers)
- React providers
- UI styling (CSS, Tailwind)

**Example:**
```typescript
// app/(with-nav)/blog/page.tsx
import { blog } from '@/domain/blog'

export default async function BlogPage() {
  const posts = await blog.getPosts()
  return <PostList posts={posts} />
}

// app/_adapters/_hooks/use-posts.ts
'use client'
import { useQueryWrapper } from './use-query-wrapper'
import { blog } from '@/domain/blog'

export function usePosts() {
  return useQueryWrapper(['posts'], blog.getPosts)
}
```

---

### 🟡 TIER 2: Moderate Volatility (Infrastructure Layer)

**Location:** `src/infrastructure/`

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
// src/infrastructure/blog/repositories/post.filesystem.repository.ts
import type { IPostRepository } from '@/domain/blog/ports'
import type { Post } from '@/domain/blog/entities'

export class FileSystemPostRepository implements IPostRepository {
  async getPosts(): Promise<Post[]> {
    const fs = await import('fs')
    // Read from filesystem, transform to domain entities
  }
}

// src/infrastructure/blog/repositories/post.repository.ts
export const postRepository: IPostRepository = new FileSystemPostRepository()
```

---

### 🟢 TIER 3: Stable Core (Business Logic)

**Location:** `src/domain/`

**Lifespan:** Lifetime of the business

**Change frequency:** Yearly/Multi-year

**Never dump** (this survives all technology changes)

**Contains:**
- Business rules and policies
- Domain entities
- Port interfaces (contracts)
- Use cases
- Domain errors
- Domain services

**Example:**
```typescript
// src/domain/blog/policies/post-visibility.policy.ts
export class PostVisibilityPolicy {
  static shouldShowInPublicList(post: Post, environment: string): boolean {
    return environment === 'production' ? !post.draft : true
  }
}

// src/domain/blog/use-cases/get-posts.use-case.ts
export async function getPostsUseCase(
  repository: IPostRepository,
  env: string = process.env.NODE_ENV
): Promise<Post[]> {
  const posts = await repository.getPosts()
  return posts.filter(post =>
    PostVisibilityPolicy.shouldShowInPublicList(post, env)
  )
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
src/domain/[domain]/index.ts          (Public API)
  ↓ depends on
src/domain/[domain]/                  (🟢 TIER 3 - Business Logic)
  ↓ depends on (interfaces only)
src/domain/[domain]/ports/            (🟢 TIER 3 - Contracts)
  ↑ implemented by
src/infrastructure/[domain]/          (🟡 TIER 2 - Adapters)
```

---

## Key Patterns

### 1. Business Policies

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
// domain/blog/policies/post-visibility.policy.ts
export class PostVisibilityPolicy {
  static shouldShowInPublicList(post: Post, env: string): boolean {
    return env === 'production' ? !post.draft : true
  }
}

// domain/blog/use-cases/get-posts.use-case.ts
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

### 2. Domain Barrel Exports

Each domain exposes a public API via `index.ts`:

```typescript
// src/domain/blog/index.ts

// Re-export core (TIER 3)
export type { Post } from './entities/post.entity'
export { PostVisibilityPolicy } from './policies/post-visibility.policy'
export { getPostsUseCase, getPostBySlugUseCase } from './use-cases'

// Re-export infrastructure (TIER 2 - for testing)
export { postRepository } from '@/infrastructure/blog/repositories/post.repository'
export type { IPostRepository } from './ports/post-repository.port'

// Convenience API (pre-wired)
import { postRepository } from '@/infrastructure/blog/repositories/post.repository'
import { getPostsUseCase } from './use-cases/get-posts.use-case'

export const blog = {
  getPosts: (env?: string) => getPostsUseCase(postRepository, env),
  // ... other methods
}
```

**Usage:**
```typescript
// Simple - use pre-wired API
import { blog } from '@/domain/blog'
const posts = await blog.getPosts()

// Advanced - import individual pieces
import { getPostsUseCase, postRepository } from '@/domain/blog'
const posts = await getPostsUseCase(postRepository)

// Testing - inject mocks
import { getPostsUseCase, type IPostRepository } from '@/domain/blog'
const mockRepo: IPostRepository = { ... }
const posts = await getPostsUseCase(mockRepo)
```

---

### 3. Generic React Query Wrappers

Instead of feature-specific hooks everywhere, use generic wrappers:

```typescript
// app/_adapters/_hooks/use-query-wrapper.ts
export function useQueryWrapper<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseQueryOptions<TData>
) {
  return useQuery({ queryKey, queryFn, ...options })
}

// Usage in components
import { useQueryWrapper } from '@/app/_adapters/_hooks'
import { blog } from '@/domain/blog'

function BlogList() {
  const { data: posts } = useQueryWrapper(['posts'], blog.getPosts)
  return <div>{posts?.map(...)}</div>
}
```

**Optional:** Create feature-specific hooks if needed:
```typescript
// app/_adapters/_hooks/use-posts.ts
export function usePosts() {
  return useQueryWrapper(['posts'], blog.getPosts)
}
```

---

### 4. Port Interfaces & Dependency Injection

Use-cases depend on interfaces, not implementations:

```typescript
// domain/blog/ports/post-repository.port.ts (TIER 3)
export interface IPostRepository {
  getPosts(): Promise<Post[]>
  getPostBySlug(slug: string): Promise<Post | null>
}

// domain/blog/use-cases/get-posts.use-case.ts (TIER 3)
export async function getPostsUseCase(
  repository: IPostRepository
): Promise<Post[]> {
  return repository.getPosts()
}

// infrastructure/blog/repositories/post.filesystem.repository.ts (TIER 2)
export class FileSystemPostRepository implements IPostRepository {
  async getPosts(): Promise<Post[]> { /* ... */ }
}

// infrastructure/blog/repositories/post.repository.ts (TIER 2 - Provider)
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

### 5. Framework-Agnostic Utilities

Pure utilities with no framework dependencies go in `src/shared/utils/`:

```typescript
// src/shared/utils/debounce.ts
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  // Pure JavaScript, no React/Next.js
}

// src/shared/utils/local-storage.ts
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  // Browser API wrapper, no framework dependency
}
```

**React-specific wrappers stay in `app/_adapters/`:**
```typescript
// app/_adapters/_hooks/use-local-storage.ts
'use client'
import { useState, useEffect } from 'react'
import { getLocalStorage, setLocalStorage } from '@/src/shared/utils'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  // React hook wrapping the pure utility
}
```

---

## Dependency Rules

### ✅ Allowed Dependencies

```typescript
// ✅ TIER 1 (Volatile) depends on TIER 3 (Stable)
// app/blog/page.tsx
import { blog } from '@/domain/blog'

// ✅ TIER 1 (Volatile) depends on shared utilities
// app/_components/button.tsx
import { cn } from '@/src/shared/utils'

// ✅ TIER 2 (Moderate) depends on TIER 3 (Stable)
// infrastructure/blog/repositories/post.filesystem.repository.ts
import type { IPostRepository } from '@/domain/blog/ports'

// ✅ TIER 3 (Stable) depends on TIER 3 (Stable)
// domain/blog/use-cases/get-posts.use-case.ts
import { PostVisibilityPolicy } from '../policies/post-visibility.policy'
```

### ❌ Forbidden Dependencies

```typescript
// ❌ TIER 3 (Stable) depends on TIER 1 (Volatile)
// domain/blog/use-cases/get-posts.use-case.ts
import { useQuery } from '@tanstack/react-query' // NEVER!

// ❌ TIER 3 (Stable) depends on TIER 2 (Moderate)
// domain/blog/use-cases/get-posts.use-case.ts
import { FileSystemPostRepository } from '@/infrastructure/blog' // NEVER!

// ❌ TIER 2 (Moderate) depends on TIER 1 (Volatile)
// infrastructure/blog/repositories/post.filesystem.repository.ts
import { Button } from '@/app/_components/button' // NEVER!
```

---

## Path Aliases

```json
{
  "paths": {
    "@/*": ["./*"],
    "@/domain/*": ["./src/domain/*"],
    "@/infrastructure/*": ["./src/infrastructure/*"],
    "@/app/*": ["./app/*"]
  }
}
```

---

## Adding a New Feature

### Step 1: Define the Domain (TIER 3 - Stable)

```
src/domain/[feature-name]/
├── entities/           # Domain models (pure TypeScript)
├── policies/           # Business rules
├── ports/              # Contracts/interfaces
├── use-cases/          # Business operations
├── errors/             # Domain errors
└── index.ts            # Public API
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
    return comment.content.length > 1000
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
src/infrastructure/[feature-name]/
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
    createdAt: new Date(dto.created_at),
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
// src/domain/[feature-name]/index.ts
export type { Comment } from './entities/comment.entity'
export { CommentModerationPolicy } from './policies/comment-moderation.policy'
export { getCommentsUseCase } from './use-cases/get-comments.use-case'
export { commentRepository } from '@/infrastructure/[feature-name]/repositories/comment.repository'

import { commentRepository } from '@/infrastructure/[feature-name]/repositories/comment.repository'
import { getCommentsUseCase } from './use-cases/get-comments.use-case'

export const comments = {
  getComments: (postId: string) => getCommentsUseCase(postId, commentRepository),
}
```

### Step 4: Use in UI (TIER 1 - Volatile)

```typescript
// Server Component
// app/(with-nav)/posts/[id]/page.tsx
import { comments } from '@/domain/comments'

export default async function PostPage({ params }: { params: { id: string } }) {
  const commentList = await comments.getComments(params.id)
  return <CommentList comments={commentList} />
}

// Client Component
// app/(with-nav)/posts/[id]/_components/comments-section.tsx
'use client'
import { useQueryWrapper } from '@/app/_adapters/_hooks'
import { comments } from '@/domain/comments'

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
import { getPostsUseCase } from '@/domain/blog'
import type { IPostRepository } from '@/domain/blog'

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

## Quick Reference

| Tier | Location | Change Frequency | Dump When |
|------|----------|------------------|-----------|
| 🔴 **TIER 1** | `app/` | Weekly/Monthly | Framework migration |
| 🟡 **TIER 2** | `src/infrastructure/` | Quarterly | Infrastructure change |
| 🟢 **TIER 3** | `src/domain/` | Yearly | Never (business logic) |
| ⚪ **Shared** | `src/shared/` | Varies | Framework-agnostic utilities |

---

## Additional Resources

- [Hexagonal Architecture (Alistair Cockburn)](https://alistair.cockburn.us/hexagonal-architecture)
- [Screaming Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)
- [Volatility-Based Decomposition](https://dmitripavlutin.com/frontend-architecture-stable-and-volatile-dependencies/)
- [Next.js App Router](https://nextjs.org/docs/app)
