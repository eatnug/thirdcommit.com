import type { Post } from '@/features/blog/core/entities/post.entity'
import type { IPostRepository } from '@/features/blog/core/ports/post-repository.port'
import { postRepository } from '@/features/blog/data/repositories/post.repository'

/**
 * Use case for retrieving all posts
 *
 * In hexagonal architecture:
 * - This is BUSINESS LOGIC (inside the hexagon)
 * - Depends on port interface (IPostRepository), not concrete implementation
 * - Framework-agnostic and testable
 */
export async function getPostsUseCase(
  repository: IPostRepository = postRepository
): Promise<Post[]> {
  const posts = await repository.getPosts()

  // Business logic: Filter out drafts in production
  if (process.env.NODE_ENV === 'production') {
    return posts.filter(post => !post.draft)
  }

  return posts
}
