import type { Post } from '@/domain/blog/entities/post.entity'
import type { IPostRepository } from '@/domain/blog/ports/post-repository.port'
import { PostVisibilityPolicy } from '@/domain/blog/policies/post-visibility.policy'

/**
 * Use case for retrieving all posts
 *
 * In volatility-based hexagonal architecture:
 * - This is TIER 3 (STABLE) - business logic inside the hexagon
 * - Depends on port interface (IPostRepository), not concrete implementation
 * - Uses business policies for reusable rules
 * - Framework-agnostic and testable
 */
export async function getPostsUseCase(
  repository: IPostRepository
): Promise<Post[]> {
  const posts = await repository.getPosts()

  // Apply business policy for visibility
  return posts.filter((post) =>
    PostVisibilityPolicy.shouldShowInPublicList(post)
  )
}
