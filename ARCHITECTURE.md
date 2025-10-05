# Architecture Documentation

## Overview

Feature-based hexagonal architecture (Ports & Adapters) combining Next.js App Router conventions with domain-driven design principles.

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
        └── route.ts              # POST /api/posts (PRIMARY ADAPTER)

src/
├── features/                     # Feature modules (framework-agnostic)
│   ├── blog/
│   │   ├── core/                # Business logic (INSIDE THE HEXAGON)
│   │   │   ├── entities/        # Domain models (Post)
│   │   │   ├── ports/           # Port interfaces (IPostRepository)
│   │   │   ├── use-cases/       # Business operations (getPosts, getPostBySlug, etc.)
│   │   │   └── errors/          # Domain-specific errors
│   │   └── data/                # Data access layer (SECONDARY ADAPTERS)
│   │       ├── models/          # DTOs with transformation methods
│   │       └── repositories/    # Adapter implementations
│   │           ├── post.repository.ts              # Provider (exports postRepository)
│   │           ├── post.filesystem.repository.ts  # FileSystem implementation
│   │           └── post.api.repository.ts         # API implementation (future)
│   │
│   └── editor/
│       ├── core/                # Editor business logic
│       │   ├── entities/        # Editor domain models (AutosaveDraft, EditorVersion)
│       │   ├── ports/           # Port interfaces (IEditorRepository)
│       │   ├── use-cases/       # Editor operations (save-autosave, restore-autosave, etc.)
│       │   └── form/            # Form controller (framework-agnostic logic)
│       │       └── editor-form.controller.ts  # Pure form validation & update logic
│       ├── data/                # Editor data access (SECONDARY ADAPTERS)
│       │   └── repositories/
│       │       ├── editor.repository.ts                  # Provider (exports editorRepository)
│       │       └── editor.localstorage.repository.ts    # LocalStorage implementation
│       └── hooks/               # Editor-specific React hooks (PRIMARY ADAPTERS)
│           └── use-editor-state.ts  # React adapter wrapping form controller
│
├── shared/                       # Cross-domain utilities
│   ├── hooks/                   # Generic React Query wrappers
│   │   ├── use-query-wrapper.ts
│   │   └── use-mutation-wrapper.ts
│   ├── services/                # Shared services (markdown, etc.)
│   ├── utils/                   # Utility functions
│   ├── lib/                     # Third-party integrations
│   └── constants/               # Constants
│
└── infrastructure/               # Infrastructure configuration
    └── query-client/            # React Query setup
```

## Hexagonal Architecture (Ports & Adapters)

### Core Principles

**The Hexagon** represents the application's business logic, isolated from external concerns:

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
app/                             (PRIMARY ADAPTERS - UI)
  ↓ depends on
src/features/[domain]/hooks/     (PRIMARY ADAPTERS - React Query)
  ↓ depends on
src/features/[domain]/core/      (CORE - Business Logic)
  ↓ depends on (interfaces only)
src/features/[domain]/core/ports/   (CORE - Port Interfaces)
  ↑ implemented by
src/features/[domain]/data/      (SECONDARY ADAPTERS - Data Access)
```

### Layer Responsibilities

#### PRIMARY ADAPTERS (Driving)
**Purpose**: Trigger application functionality

**app/** - Next.js routes and pages
- Route definitions (page.tsx, layout.tsx)
- Server/Client components
- Route-specific UI components (_components/)
- **Role**: UI adapter that drives use cases

**app/api/** - API routes
- HTTP request handlers
- **Role**: API adapter that drives use cases
- Example: `POST /api/posts` → `createPost` use case

**src/features/[domain]/hooks/** - React hooks
- Wrap use-cases with React Query
- Domain logic + state management
- **Role**: React adapter that drives use cases
- Example: `usePosts` calls `getPostsUseCase`

#### THE HEXAGON (Core Business Logic)
**Purpose**: Contains pure business logic, isolated from external concerns

**src/features/[domain]/core/** - Application core
- **Entities**: Domain models (pure TypeScript types/interfaces)
- **Ports**: Interfaces defining contracts (e.g., `IPostRepository`)
  - Primary ports: For driving adapters (input)
  - Secondary ports: For driven adapters (output)
- **Use Cases**: Business operations
  - Depend on port interfaces, NOT implementations
  - Framework-agnostic, testable without UI
- **Errors**: Domain-specific error classes

#### SECONDARY ADAPTERS (Driven)
**Purpose**: Provide supporting services to the application

**src/features/[domain]/data/** - Data access adapters
- **Models**: DTOs with transformation methods (namespace pattern)
  - Example: `PostDto` interface + `PostDto.toDomain()` method
  - Combines data structure and transformation logic in one file
- **Repositories**: Concrete implementations of port interfaces
  - Each repository is a complete adapter implementation
  - Example: `FileSystemPostRepository implements IPostRepository`
  - Multiple adapters can coexist: `ApiPostRepository`, `CachePostRepository`
  - No need for separate "sources" layer - the repository IS the adapter

#### SHARED UTILITIES
**src/shared/** - Cross-cutting concerns
- Services (markdown rendering, analytics, etc.)
- Utility functions (date formatting, string manipulation, etc.)
- Constants and configuration
- Framework-agnostic

## Key Design Patterns

### 1. Ports & Adapters (Hexagonal Architecture)

**Port Interface (Contract)**:
```typescript
// src/features/blog/core/ports/post-repository.port.ts
export interface IPostRepository {
  getPosts(): Promise<Post[]>
  getPostBySlug(slug: string): Promise<Post | null>
}
```

**DTO with Transformation (Data Layer)**:
```typescript
// src/features/blog/data/models/post.model.ts
export interface PostDto {
  slug: string
  frontmatter: { title: string; date: string; /* ... */ }
  content: string
}

// ES2015 module functions (not namespace)
export function postDtoToDomain(dto: PostDto): Post {
  return {
    slug: dto.slug,
    title: dto.frontmatter.title,
    date: new Date(dto.frontmatter.date), // Transform
    // ...
  }
}
```

**Secondary Adapter (Implementation)**:
```typescript
// src/features/blog/data/repositories/post.filesystem.repository.ts
import { type PostDto, postDtoToDomain } from '@/features/blog/data/models/post.model'

export class FileSystemPostRepository implements IPostRepository {
  async getPosts(): Promise<Post[]> {
    const fs = await import('fs') // Dynamic import for server-only code
    // ... read from filesystem, create dto
    return postDtoToDomain(dto) // Transform to domain
  }
}
```

**Repository Provider**:
```typescript
// src/features/blog/data/repositories/post.repository.ts
import type { IPostRepository } from '@/features/blog/core/ports/post-repository.port'
import { FileSystemPostRepository } from './post.filesystem.repository'

// Central point to switch implementations
export const postRepository: IPostRepository = new FileSystemPostRepository()
```

**Use Case (Core Logic with Dependency Injection)**:
```typescript
// src/features/blog/core/use-cases/get-posts.use-case.ts
export async function getPostsUseCase(
  repository: IPostRepository = postRepository // Default for convenience
): Promise<Post[]> {
  const posts = await repository.getPosts()

  // Business logic: Filter drafts in production
  if (process.env.NODE_ENV === 'production') {
    return posts.filter(post => !post.draft)
  }

  return posts
}
```

**Primary Adapter (Direct Use-Case Call or Generic Hook Wrapper)**:
```typescript
// Option 1: Server Component (Direct call)
// app/(with-nav)/blog/page.tsx
export default async function BlogPage() {
  const posts = await getPostsUseCase()
  return <PostList posts={posts} />
}

// Option 2: Client Component (Generic hook wrapper)
// app/some-client-component.tsx
'use client'
import { useQueryWrapper } from '@/shared/hooks'
import { getPostsUseCase } from '@/features/blog/core/use-cases/get-posts.use-case'

export function SomeClientComponent() {
  const { data: posts } = useQueryWrapper(
    ['posts'],
    () => getPostsUseCase()
  )
  return <PostList posts={posts} />
}
```

**Benefits**:
- ✅ Use cases depend on interfaces, not implementations
- ✅ Easy to swap adapters (filesystem → API → cache) via provider
- ✅ Simple to test with mock implementations
- ✅ Business logic isolated from infrastructure
- ✅ Dependency injection allows testing with mocks
- ✅ No feature-specific hooks needed - use generic wrappers or direct calls
- ✅ Repository provider acts as single source of truth for implementation

### 2. Dynamic Imports in Adapters

```typescript
// FileSystemPostRepository - handles filesystem directly
export class FileSystemPostRepository implements IPostRepository {
  async getPosts(): Promise<Post[]> {
    // Dynamic import - prevents bundling server-only code in client
    const fs = await import('fs')
    const path = await import('path')

    // Adapter implementation directly accesses filesystem
    const files = fs.readdirSync(postsDirectory)
    // ... rest of implementation
  }
}
```

### 3. Repository Provider Pattern

```typescript
// post.filesystem.repository.ts - FileSystem implementation
export class FileSystemPostRepository implements IPostRepository {
  async getPosts(): Promise<Post[]> {
    const fs = await import('fs')
    // Read from local filesystem
  }
}

// post.api.repository.ts - API implementation (future)
export class ApiPostRepository implements IPostRepository {
  async getPosts(): Promise<Post[]> {
    const response = await fetch('/api/posts')
    // Fetch from REST API
  }
}

// post.cache.repository.ts - Cache implementation (future)
export class CachePostRepository implements IPostRepository {
  constructor(
    private primaryAdapter: IPostRepository,
    private cache: Cache
  ) {}

  async getPosts(): Promise<Post[]> {
    // Check cache, fallback to primary adapter
  }
}

// post.repository.ts - Provider (single source of truth)
import { FileSystemPostRepository } from './post.filesystem.repository'

// Switch implementations here without changing use-cases
export const postRepository: IPostRepository = process.env.USE_API
  ? new ApiPostRepository()
  : new FileSystemPostRepository()
```

### 4. Dependency Injection in Use Cases

```typescript
// Use cases accept repository through parameter (dependency injection)
export async function getPostsUseCase(
  repository: IPostRepository = postRepository // Default for convenience
): Promise<Post[]> {
  const posts = await repository.getPosts()

  // Business logic here
  if (process.env.NODE_ENV === 'production') {
    return posts.filter(post => !post.draft)
  }

  return posts
}

// Testing becomes trivial
const mockRepository: IPostRepository = {
  getPosts: async () => [/* mock data */],
  getPostBySlug: async () => null,
  createPost: async () => ({ slug: 'test', filename: 'test.md', path: '/test.md' })
}
await getPostsUseCase(mockRepository)
```

### 5. Generic React Query Wrappers

Instead of creating feature-specific hooks, use generic wrappers:

```typescript
// src/shared/hooks/use-query-wrapper.ts
export function useQueryWrapper<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseQueryOptions<TData, TError>
) {
  return useTanstackQuery<TData, TError>({
    queryKey,
    queryFn,
    ...options,
  })
}

// src/shared/hooks/use-mutation-wrapper.ts
export function useMutationWrapper<TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  return useTanstackMutation<TData, TError, TVariables>({
    mutationFn,
    ...options,
  })
}

// Usage in components
const { data: posts } = useQueryWrapper(['posts'], () => getPostsUseCase())
const savePost = useMutationWrapper(savePostUseCase, {
  onSuccess: () => { /* ... */ }
})
```

**Benefits**:
- ✅ No need to create hooks for every use-case
- ✅ Clear separation: use-cases are business logic, hooks are UI adapters
- ✅ Less boilerplate code
- ✅ Use-cases can be called directly in Server Components

### 6. Next.js Routing Exclusion

Files/folders starting with `_` are excluded from routing:
- `app/_lib/` - Not a route, safe to use for code organization
- `app/blog/_components/` - Not a route, components only

## Import Patterns

### Hexagonal Architecture Rules

```typescript
// ✅ UI/API ROUTES import use-cases directly or via generic hooks
import { getPostsUseCase } from '@/features/blog/core/use-cases/get-posts.use-case'
import { useQueryWrapper, useMutationWrapper } from '@/shared/hooks'

// ✅ CORE imports port interfaces (contracts), NOT implementations
import type { IPostRepository } from '@/features/blog/core/ports/post-repository.port'

// ✅ Use cases import from provider (single source of truth)
import { postRepository } from '@/features/blog/data/repositories/post.repository'

// ✅ Use cases accept dependencies via parameters (for testing)
export async function getPostsUseCase(
  repository: IPostRepository = postRepository
): Promise<Post[]>

// ✅ REPOSITORY PROVIDER imports specific implementation
import { FileSystemPostRepository } from './post.filesystem.repository'
export const postRepository: IPostRepository = new FileSystemPostRepository()

// ✅ SECONDARY ADAPTERS import and implement ports
import type { IPostRepository } from '@/features/blog/core/ports/post-repository.port'
export class FileSystemPostRepository implements IPostRepository { /* ... */ }

// ✅ Pages import UI components and generic hooks
import { Button } from '@/app/_lib/components/ui/button'
import { useQueryWrapper } from '@/shared/hooks'

// ✅ Anyone can import from shared utilities
import { cn } from '@/shared/utils/cn'
import { markdownService } from '@/shared/services/markdown.service'

// ❌ NEVER: Core imports concrete adapter classes
// import { FileSystemPostRepository } from '@/features/blog/data/repositories/post.filesystem.repository'

// ❌ NEVER: Use cases import from UI layer
// import { useQueryWrapper } from '@/shared/hooks'
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

### Hexagonal Architecture Advantages

✅ **Technology independence** - Core business logic has no framework dependencies
✅ **Testability** - Business logic easily tested with mock adapters
✅ **Flexibility** - Swap adapters without touching business logic
  - Filesystem → API → Cache → Memory
  - REST → GraphQL → gRPC
  - React Query → SWR → Zustand
✅ **Clear boundaries** - Ports define explicit contracts between layers
✅ **Maintainability** - Changes isolated to specific adapters
✅ **Scalability** - Add new adapters without modifying core
✅ **Type safety** - Interfaces enforce contracts at compile time
✅ **Developer experience** - Clear structure, predictable patterns

### Next.js-Specific Optimizations

✅ **Bundle optimization** - Dynamic imports prevent server code in client bundles
✅ **Route organization** - `_` prefix excludes directories from routing
✅ **Feature isolation** - Domain logic separated from framework concerns

## Adding a New Feature

Following hexagonal architecture principles:

### 1. Define the Core (Inside the Hexagon)
```
src/features/[feature-name]/core/
├── entities/           # Domain models (pure TypeScript)
├── ports/              # Port interfaces (contracts)
│   └── [name]-repository.port.ts
├── use-cases/          # Business operations
└── errors/             # Domain errors
```

### 2. Implement Secondary Adapters (Driven)
```
src/features/[feature-name]/data/
├── models/             # DTOs with transformation methods
│   └── [name].model.ts (interface + export functions for transformation)
└── repositories/       # Adapter implementations
    ├── [name].repository.ts            # Provider (exports repository instance)
    ├── [name].filesystem.repository.ts # FileSystem implementation
    ├── [name].api.repository.ts        # API implementation (future)
    └── [name].cache.repository.ts      # Cache implementation (future)
```

### 3. Implement Primary Adapters (Driving)
```
app/[feature-name]/
├── page.tsx            # Next.js pages (call use-cases directly or via generic hooks)
└── _components/        # UI components

Note: No feature-specific hooks needed - use generic wrappers from shared/hooks
```

### Example 1: Adding a new "Comments" feature

1. **Core** (`src/features/comments/core/`):
   ```typescript
   // ports/comment-repository.port.ts
   export interface ICommentRepository {
     getComments(postSlug: string): Promise<Comment[]>
     addComment(comment: Comment): Promise<void>
   }

   // use-cases/get-comments.use-case.ts
   export async function getCommentsUseCase(
     postSlug: string,
     repository: ICommentRepository = commentRepository
   ): Promise<Comment[]> {
     return repository.getComments(postSlug)
   }
   ```

2. **DTO with Transformation** (`src/features/comments/data/models/`):
   ```typescript
   // models/comment.model.ts
   export interface CommentDto {
     id: string
     author: string
     content: string
     created_at: string
   }

   export function commentDtoToDomain(dto: CommentDto): Comment {
     return {
       id: dto.id,
       author: dto.author,
       content: dto.content,
       createdAt: new Date(dto.created_at), // Transform
     }
   }
   ```

3. **Secondary Adapter** (`src/features/comments/data/`):
   ```typescript
   // repositories/comment.api.repository.ts
   import { commentDtoToDomain } from '../models/comment.model'

   export class ApiCommentRepository implements ICommentRepository {
     async getComments(postSlug: string): Promise<Comment[]> {
       const response = await fetch(`/api/comments/${postSlug}`)
       const dtos: CommentDto[] = await response.json()
       return dtos.map(commentDtoToDomain)
     }
   }

   // repositories/comment.repository.ts (Provider)
   import { ApiCommentRepository } from './comment.api.repository'
   export const commentRepository: ICommentRepository = new ApiCommentRepository()
   ```

4. **Primary Adapter** (in UI components):
   ```typescript
   // app/posts/[slug]/page.tsx (Server Component)
   export default async function PostPage({ params }: { params: { slug: string } }) {
     const comments = await getCommentsUseCase(params.slug)
     return <CommentList comments={comments} />
   }

   // Or in Client Component
   'use client'
   import { useQueryWrapper } from '@/shared/hooks'

   export function CommentSection({ postSlug }: { postSlug: string }) {
     const { data: comments } = useQueryWrapper(
       ['comments', postSlug],
       () => getCommentsUseCase(postSlug)
     )
     return <CommentList comments={comments} />
   }
   ```

### Example 2: Editor Feature (Framework-Agnostic Logic Pattern)

The editor demonstrates separating framework-agnostic logic from React:

1. **Framework-Agnostic Form Controller** (`src/features/editor/core/form/`):
   ```typescript
   // editor-form.controller.ts
   export class EditorFormController {
     updateField(state: EditorFormData, field: string, value: any): EditorFormData {
       return { ...state, [field]: value }
     }

     validate(state: EditorFormData): { isValid: boolean; errors: {} } {
       // Pure validation logic
     }

     canSave(state: EditorFormData): boolean {
       return this.validate(state).isValid
     }
   }

   export const editorFormController = new EditorFormController()
   ```

2. **React Adapter Hook** (`src/features/editor/hooks/`):
   ```typescript
   // use-editor-state.ts
   import { editorFormController } from '@/features/editor/core/form/editor-form.controller'

   export function useEditorState() {
     const [formData, setFormData] = useState(editorFormController.reset())

     const updateField = useCallback((field, value) => {
       setFormData(prev => editorFormController.updateField(prev, field, value))
     }, [])

     const canSave = editorFormController.canSave(formData)

     return { formData, updateField, canSave }
   }
   ```

3. **UI Component** (`app/editor/page.tsx`):
   ```typescript
   export default function EditorPage() {
     const { formData, updateField, canSave } = useEditorState()

     return (
       <input
         value={formData.title}
         onChange={(e) => updateField('title', e.target.value)}
       />
       <button disabled={!canSave}>Save</button>
     )
   }
   ```

**Benefits of this pattern:**
- ✅ Form logic testable without React
- ✅ Can migrate to Vue/Svelte by rewriting only the adapter hook
- ✅ Business rules in controller, React-specific code in hook
- ✅ Clear separation between "what changes" (UI) and "what's stable" (logic)

## Migration Notes

**From:** Flat structure with `src/core/`, `src/data/`, `src/presentation/`
**To:** Feature-based with `src/features/[domain]/`

**Key changes:**
- Feature-specific hooks removed → Use generic wrappers from `src/shared/hooks/`
- UI components moved from `src/presentation/components/` → `app/_lib/components/ui/`
- Domain code organized by feature rather than by layer
- Repository provider pattern: `[name].repository.ts` exports instance, implementations in separate files
- Use-cases called directly in Server Components or via generic hooks in Client Components

**Build status:** ✅ 22 pages successfully generated, no routing conflicts

## Testing Strategy

Hexagonal architecture makes testing straightforward:

### Unit Testing Use Cases

```typescript
// Mock the port interface
const mockRepository: IPostRepository = {
  getPosts: jest.fn().mockResolvedValue([
    { slug: 'test', title: 'Test Post', /* ... */ }
  ]),
  getPostBySlug: jest.fn(),
  createPost: jest.fn()
}

// Test business logic in isolation
test('filters drafts in production', async () => {
  process.env.NODE_ENV = 'production'
  const posts = await getPostsUseCase(mockRepository)
  expect(posts.every(p => !p.draft)).toBe(true)
})
```

### Integration Testing Adapters

```typescript
// Test real adapter implementation
test('FileSystemPostRepository reads posts from disk', async () => {
  const repository = new FileSystemPostRepository()
  const posts = await repository.getPosts()
  expect(posts).toHaveLength(expectedCount)
})
```

### E2E Testing

```typescript
// Test through primary adapters (UI, API)
test('user can view blog posts', async () => {
  render(<BlogPage />)
  await waitFor(() => {
    expect(screen.getByText('My Post Title')).toBeInTheDocument()
  })
})
```

## References

- [Hexagonal Architecture (Alistair Cockburn)](https://alistair.cockburn.us/hexagonal-architecture) - Original hexagonal architecture paper
- [CLEAN_ARCHITECTURE.md](./CLEAN_ARCHITECTURE.md) - Original clean architecture documentation
- [Next.js App Router](https://nextjs.org/docs/app)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Ports and Adapters Pattern](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software))
