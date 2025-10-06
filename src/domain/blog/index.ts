/**
 * Blog Feature - Public API
 *
 * This is the single entry point for the blog feature.
 * All consumers should import from here, not from internal files.
 *
 * In volatility-based architecture:
 * - This file acts as a PUBLIC API CONTRACT
 * - Internal structure can change without breaking consumers
 * - Provides both pre-wired convenience API and granular imports for testing
 */

// ============================================================================
// ENTITIES (TIER 3 - STABLE)
// ============================================================================
export type { Post, PostFormData } from './entities/post.entity'

// ============================================================================
// POLICIES (TIER 3 - STABLE)
// ============================================================================
export { PostVisibilityPolicy } from './policies/post-visibility.policy'

// ============================================================================
// USE CASES (TIER 3 - STABLE)
// ============================================================================
export { getPostsUseCase } from './use-cases/get-posts.use-case'
export { getPostBySlugUseCase } from './use-cases/get-post-by-slug.use-case'
export { getDraftsUseCase } from './use-cases/get-drafts.use-case'
export { savePostUseCase } from './use-cases/save-post.use-case'
export { deletePostUseCase } from './use-cases/delete-post.use-case'
export { loadPostAsFormUseCase } from './use-cases/load-post-as-form.use-case'
export type { SavePostInput } from './use-cases/save-post.use-case'

// ============================================================================
// ERRORS (TIER 3 - STABLE)
// ============================================================================
export { PostNotFoundError } from './errors/post.error'

// ============================================================================
// PORTS (TIER 3 - STABLE)
// For dependency injection in tests
// ============================================================================
export type { IPostRepository } from './ports/post-repository.port'

// ============================================================================
// REPOSITORY EXPORTS (IOC Container)
// ============================================================================
export { getServerPostRepository, getClientPostRepository } from '@/infrastructure/blog/repositories/post.repository'

// ============================================================================
// CONVENIENCE API (Server-side only)
// ============================================================================
import type { IPostRepository } from './ports/post-repository.port'
import { getPostsUseCase } from './use-cases/get-posts.use-case'
import { getPostBySlugUseCase } from './use-cases/get-post-by-slug.use-case'
import { getDraftsUseCase } from './use-cases/get-drafts.use-case'
import { getPostByIdUseCase } from './use-cases/get-post-by-id.use-case'
import { publishPostUseCase } from './use-cases/publish-post.use-case'
import { deletePostUseCase } from './use-cases/delete-post.use-case'
import { loadPostAsFormUseCase } from './use-cases/load-post-as-form.use-case'
import { savePostUseCase } from './use-cases/save-post.use-case'
import type { SavePostInput } from './use-cases/save-post.use-case'

/**
 * Blog API Factory
 *
 * Creates a blog API instance with injected repository.
 * Consumers decide which repository implementation to use based on their environment.
 *
 * Example usage:
 * ```typescript
 * // Server Component
 * import { createBlogApi } from '@/domain/blog'
 * import { getServerPostRepository } from '@/infrastructure/blog/repositories/post.repository'
 *
 * export default async function BlogPage() {
 *   const repository = await getServerPostRepository()
 *   const blog = createBlogApi(repository)
 *   const posts = await blog.getPosts()
 *   return <PostList posts={posts} />
 * }
 * ```
 */
export function createBlogApi(repository: IPostRepository) {
  return {
    // Queries
    getPosts: () => getPostsUseCase(repository),
    getPost: (slug: string) => getPostBySlugUseCase(slug, repository),
    getPostById: (id: string) => getPostByIdUseCase(id, repository),
    getDrafts: () => getDraftsUseCase(repository),
    loadPostAsForm: (id: string) => loadPostAsFormUseCase(id, repository),

    // Commands
    savePost: (input: SavePostInput) => savePostUseCase(input, repository),
    publishPost: (id: string) => publishPostUseCase(id, repository),
    deletePost: (id: string) => deletePostUseCase(id, repository),
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
Example 1: Server Component (Direct call)
─────────────────────────────────────────
// app/(routes)/blog/page.tsx
import { blog } from '@/features/blog'

export default async function BlogPage() {
  const posts = await blog.getPosts()
  return <PostList posts={posts} />
}


Example 2: Client Component (With React Query)
───────────────────────────────────────────────
// app/_adapters/hooks/use-posts.ts
import { blog } from '@/features/blog'
import { useQueryWrapper } from './use-query-wrapper'

export function usePosts() {
  return useQueryWrapper(['posts'], blog.getPosts)
}


Example 3: Testing with Mock Repository
────────────────────────────────────────
// tests/get-posts.test.ts
import { getPostsUseCase } from '@/features/blog'
import type { IPostRepository } from '@/features/blog'

const mockRepository: IPostRepository = {
  getPosts: jest.fn().mockResolvedValue([
    { title: 'Test', draft: false, ... }
  ]),
  // ... other methods
}

const posts = await getPostsUseCase(mockRepository, 'production')
expect(posts).toHaveLength(1)


Example 4: Using Policies Directly
───────────────────────────────────
// app/admin/posts/page.tsx
import { PostVisibilityPolicy, type Post } from '@/features/blog'

function shouldShowEditButton(post: Post, user: User) {
  return PostVisibilityPolicy.canUserAccess(post, user)
}
*/
