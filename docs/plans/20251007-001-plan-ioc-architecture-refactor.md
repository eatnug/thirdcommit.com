# 20251007-001-PLAN: IOC Container Architecture Refactor

**Created**: 2025-10-07
**Status**: COMPLETED
**Based on**: Architectural improvements during draft/publish workflow implementation

---

## Overview

완전한 IOC (Inversion of Control) 컨테이너 패턴을 도입하여 repository 주입을 명시적으로 관리하도록 아키텍처를 리팩토링했습니다. 이를 통해 의존성 역전 원칙을 더 명확하게 적용하고, 테스트 용이성을 개선했습니다.

---

## Completed Work

### 1. Tags Feature Removal ✅

**작업 내용:**
- Post entity에서 `tags` 필드 완전 제거
- Use-cases, repositories, API routes에서 tags 로직 제거
- UI 컴포넌트에서 tags 입력/표시 제거
- DTO에서 backward compatibility 유지 (old posts 읽기용)

**변경된 파일:**
- `src/domain/blog/entities/post.entity.ts` - tags 필드 제거
- `src/domain/blog/use-cases/save-post.use-case.ts` - tags 파라미터 제거
- `src/infrastructure/blog/dto/post.dto.ts` - tags 옵셔널로 변경
- `app/editor/_components/metadata-form.tsx` - tags 입력 제거
- `app/(with-nav)/blog/_components/post-card.tsx` - tags 표시 제거
- `app/(with-nav)/posts/[slug]/page.tsx` - tags 표시 제거

---

### 2. Repository 명시적 주입 패턴 ✅

**Before (Environment 자동 감지):**
```typescript
// use-cases에서 직접 repository import 및 환경 체크
export async function savePostUseCase(input: SavePostInput) {
  if (typeof window === 'undefined') {
    const { postRepository } = await import('...')
    // server logic
  } else {
    // client API call
  }
}
```

**After (Repository 주입):**
```typescript
// use-cases는 repository 인터페이스만 의존
export async function savePostUseCase(
  input: SavePostInput,
  repository: IPostRepository
) {
  if (input.id) {
    return repository.updatePost(input.id, {...})
  } else {
    return repository.createPost({...})
  }
}
```

**변경된 Use-cases:**
- `save-post.use-case.ts` - repository 주입
- `publish-post.use-case.ts` - repository 주입
- `delete-post.use-case.ts` - repository 주입
- `load-post-as-form.use-case.ts` - repository 주입

---

### 3. IOC Container 구현 ✅

**파일:** `src/infrastructure/blog/repositories/post.repository.ts`

```typescript
// IOC Container - 환경별 repository 인스턴스 제공
export async function getClientPostRepository(): Promise<IPostRepository>
export async function getServerPostRepository(): Promise<IPostRepository>
```

**특징:**
- Singleton 패턴으로 인스턴스 재사용
- Client: `ApiPostRepository` (HTTP API 호출)
- Server: `FileSystemPostRepository` (파일시스템 직접 접근)
- 사용하는 쪽에서 명시적으로 선택

---

### 4. API Repository 구현 ✅

**파일:** `src/infrastructure/blog/repositories/post.api.repository.ts`

클라이언트 환경에서 사용할 API 기반 repository 구현:
- `getPosts()` - GET /api/posts
- `getPostById()` - GET /api/posts/[id]
- `createPost()` - POST /api/posts
- `updatePost()` - PUT /api/posts/[id]
- `deletePost()` - DELETE /api/posts/[id]

---

### 5. Blog API Factory 패턴 ✅

**Before (Legacy):**
```typescript
import { blog } from '@/domain/blog'
await blog.getPosts()
```

**After (Factory Pattern):**
```typescript
// Server Component
import { createBlogApi, getServerPostRepository } from '@/domain/blog'

const repository = await getServerPostRepository()
const blog = createBlogApi(repository)
await blog.getPosts()

// Client Component
const repository = await getClientPostRepository()
const blog = createBlogApi(repository)
await blog.getPosts()
```

**변경된 파일:**
- `src/domain/blog/index.ts` - `createBlogApi()` 추가, 레거시 `blog` export 제거

---

### 6. 전체 코드베이스 마이그레이션 ✅

**Server Components:**
- `app/(with-nav)/blog/page.tsx`
- `app/(with-nav)/posts/[slug]/page.tsx`

**Client Components:**
- `app/_adapters/_hooks/use-posts.ts` - singleton 패턴
- `app/editor/use-editor-view-model.ts` - singleton 패턴

**API Routes:**
- `app/api/drafts/route.ts`
- `app/api/posts/route.ts`
- `app/api/posts/[id]/route.ts`
- `app/api/posts/[id]/publish/route.ts`

모든 파일이 `getServerPostRepository()` 또는 `getClientPostRepository()`를 명시적으로 사용하도록 변경

---

## Architecture Benefits

### 1. **의존성 역전 원칙 (DIP) 준수**
- Use-cases가 infrastructure를 알지 못함
- Domain layer가 완전히 독립적

### 2. **테스트 용이성**
```typescript
// Mock repository 주입 가능
const mockRepo: IPostRepository = {
  getPosts: jest.fn(),
  // ...
}
const blog = createBlogApi(mockRepo)
```

### 3. **확장성**
- 새로운 repository 구현 추가 쉬움
- 예: DatabasePostRepository, CachePostRepository

### 4. **명시성**
- 코드 읽을 때 어떤 repository 사용하는지 명확
- 환경 자동 감지 로직 제거로 코드 단순화

### 5. **헥사고날 아키텍처 강화**
```
Domain (Use-cases) → Ports (IPostRepository)
                         ↑
Infrastructure ──────────┘
 - FileSystemPostRepository
 - ApiPostRepository
```

---

## Code Patterns

### Server Component Pattern
```typescript
import { createBlogApi, getServerPostRepository } from '@/domain/blog'

export default async function Page() {
  const repository = await getServerPostRepository()
  const blog = createBlogApi(repository)
  const data = await blog.getPosts()
  return <View data={data} />
}
```

### Client Hook Pattern
```typescript
import { createBlogApi, getClientPostRepository } from '@/domain/blog'

let blogApiInstance: ReturnType<typeof createBlogApi> | null = null

async function getBlogApi() {
  if (!blogApiInstance) {
    const repository = await getClientPostRepository()
    blogApiInstance = createBlogApi(repository)
  }
  return blogApiInstance
}

export function usePosts() {
  return useQuery(['posts'], async () => {
    const blog = await getBlogApi()
    return blog.getPosts()
  })
}
```

### API Route Pattern
```typescript
export async function GET() {
  const { getServerPostRepository } = await import('...')
  const repository = await getServerPostRepository()
  const posts = await repository.getPosts()
  return NextResponse.json({ posts })
}
```

---

## Technical Decisions

### Q1: 왜 Factory Pattern을 사용했나?
**Answer:** Repository 주입을 캡슐화하고, 사용하는 쪽에서 편리한 API를 제공하기 위해. `createBlogApi(repo)`는 모든 use-case에 repository를 자동으로 전달해줌.

### Q2: 왜 Singleton을 사용했나?
**Answer:** 클라이언트에서 repository 인스턴스를 재사용하여 메모리 효율성 향상. 각 hook 호출마다 새 인스턴스를 만들 필요 없음.

### Q3: 레거시 코드는 왜 제거했나?
**Answer:**
- 자동 환경 감지는 암묵적이고 디버깅 어려움
- 명시적 주입이 코드 의도를 더 명확하게 전달
- 모든 사용처를 마이그레이션하여 일관성 확보

---

## Performance Impact

**빌드 결과:**
```
Route (app)                                 Size  First Load JS
┌ ○ /                                    2.02 kB         111 kB
├ ○ /blog                                  169 B         110 kB
├ ○ /editor                              73.8 kB         193 kB
└ ● /posts/[slug]                          830 B         119 kB
```

- Client bundle 크기 변화 없음 (ApiPostRepository는 필요시에만 로드)
- Server bundle에서 불필요한 환경 체크 로직 제거됨
- 전체적으로 코드 간결해짐

---

## Testing Strategy

### Unit Tests (Use-cases)
```typescript
describe('savePostUseCase', () => {
  it('should create post when id is not provided', async () => {
    const mockRepo = {
      createPost: jest.fn().mockResolvedValue(mockPost)
    }

    const result = await savePostUseCase(input, mockRepo)

    expect(mockRepo.createPost).toHaveBeenCalled()
  })
})
```

### Integration Tests (API Routes)
```typescript
describe('POST /api/posts', () => {
  it('should create post using server repository', async () => {
    const response = await POST(mockRequest)
    expect(response.status).toBe(201)
  })
})
```

---

## Migration Checklist

- [x] Tags 기능 완전 제거
- [x] IOC Container 구현 (post.repository.ts)
- [x] ApiPostRepository 구현
- [x] Blog API Factory 패턴 구현
- [x] Use-cases repository 주입 패턴으로 변경
- [x] Server components 마이그레이션
- [x] Client hooks 마이그레이션
- [x] API routes 마이그레이션
- [x] 레거시 코드 제거
- [x] 빌드 테스트 성공

---

## Future Enhancements

### 1. Database Repository
```typescript
export class DatabasePostRepository implements IPostRepository {
  constructor(private db: Database) {}

  async getPosts(): Promise<Post[]> {
    return this.db.query('SELECT * FROM posts')
  }
}
```

### 2. Cache Repository (Decorator Pattern)
```typescript
export class CachePostRepository implements IPostRepository {
  constructor(
    private inner: IPostRepository,
    private cache: Cache
  ) {}

  async getPosts(): Promise<Post[]> {
    const cached = await this.cache.get('posts')
    if (cached) return cached

    const posts = await this.inner.getPosts()
    await this.cache.set('posts', posts)
    return posts
  }
}
```

### 3. Repository Composition
```typescript
const fsRepo = await getServerPostRepository()
const cachedRepo = new CachePostRepository(fsRepo, cache)
const blog = createBlogApi(cachedRepo)
```

---

## Related Documents

- [20251006-001-PLAN: Draft/Publish Workflow](./20251006-001-plan-editor-draft-publish-workflow.md)
- [Architecture Documentation](../kb/ARCHITECTURE.md)

---

## Changelog

**2025-10-07**
- Tags 기능 완전 제거
- Repository 명시적 주입 패턴 도입
- IOC Container 구현
- ApiPostRepository 구현
- Blog API Factory 패턴 구현
- 전체 코드베이스 마이그레이션
- 레거시 코드 제거
- 문서 작성
