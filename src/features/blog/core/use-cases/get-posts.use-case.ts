import type { Post } from '@/features/blog/core/entities/post.entity'
import type { IPostRepository } from '@/features/blog/core/ports/post-repository.port'
import { postRepository } from '@/features/blog/data/repositories/post.repository'
import { PostVisibilityPolicy } from '@/features/blog/core/policies/post-visibility.policy'

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
  repository: IPostRepository = postRepository,
  environment: string = process.env.NODE_ENV || 'development'
): Promise<Post[]> {
  const posts = await repository.getPosts()

  // Apply business policy for visibility
  return posts.filter((post) =>
    PostVisibilityPolicy.shouldShowInPublicList(post, environment)
  )
}
