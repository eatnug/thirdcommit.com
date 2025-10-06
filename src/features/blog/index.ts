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
export type { Post, PostFormData } from './core/entities/post.entity'

// ============================================================================
// POLICIES (TIER 3 - STABLE)
// ============================================================================
export { PostVisibilityPolicy } from './core/policies/post-visibility.policy'

// ============================================================================
// USE CASES (TIER 3 - STABLE)
// ============================================================================
export { getPostsUseCase } from './core/use-cases/get-posts.use-case'
export { getPostBySlugUseCase } from './core/use-cases/get-post-by-slug.use-case'
export { getDraftsUseCase } from './core/use-cases/get-drafts.use-case'
export { getAllTagsUseCase } from './core/use-cases/get-all-tags.use-case'
export { getPostsByTagUseCase } from './core/use-cases/get-posts-by-tag.use-case'
export { savePostUseCase } from './core/use-cases/save-post.use-case'
export { deletePostUseCase } from './core/use-cases/delete-post.use-case'
export { loadPostAsFormUseCase } from './core/use-cases/load-post-as-form.use-case'
export type { SavePostInput } from './core/use-cases/save-post.use-case'

// ============================================================================
// ERRORS (TIER 3 - STABLE)
// ============================================================================
export { PostNotFoundError } from './core/errors/post.error'

// ============================================================================
// PORTS (TIER 3 - STABLE)
// For dependency injection in tests
// ============================================================================
export type { IPostRepository } from './core/ports/post-repository.port'

// ============================================================================
// INFRASTRUCTURE (TIER 2 - MODERATE)
// Exported for testing and dependency injection
// ============================================================================
export { postRepository } from './data/repositories/post.repository'

// ============================================================================
// CONVENIENCE API (Pre-wired)
// ============================================================================
import { postRepository } from './data/repositories/post.repository'
import { getPostsUseCase } from './core/use-cases/get-posts.use-case'
import { getPostBySlugUseCase } from './core/use-cases/get-post-by-slug.use-case'
import { getDraftsUseCase } from './core/use-cases/get-drafts.use-case'
import { getAllTagsUseCase } from './core/use-cases/get-all-tags.use-case'
import { getPostsByTagUseCase } from './core/use-cases/get-posts-by-tag.use-case'
import { deletePostUseCase } from './core/use-cases/delete-post.use-case'
import { loadPostAsFormUseCase } from './core/use-cases/load-post-as-form.use-case'
import type { SavePostInput } from './core/use-cases/save-post.use-case'

/**
 * Pre-wired blog API with default repository injected
 *
 * Use this for convenience in application code.
 * For testing, import individual use-cases and inject mocks.
 *
 * Example usage:
 * ```typescript
 * import { blog } from '@/features/blog'
 *
 * const posts = await blog.getPosts()
 * const post = await blog.getPost('my-post')
 * ```
 */
export const blog = {
  // Queries
  getPosts: (environment?: string) => getPostsUseCase(postRepository, environment),

  getPost: (slug: string, environment?: string) =>
    getPostBySlugUseCase(slug, postRepository, environment),

  getDrafts: () => getDraftsUseCase(),

  getAllTags: () => getAllTagsUseCase(postRepository),

  getPostsByTag: (tag: string, environment?: string) =>
    getPostsByTagUseCase(tag, postRepository, environment),

  loadPostAsForm: (title: string) => loadPostAsFormUseCase(title, postRepository),

  // Commands
  deletePost: (title: string) => deletePostUseCase(title, postRepository),

  // Note: savePost is not included here because it uses fetch directly
  // This should be refactored to use a repository
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
