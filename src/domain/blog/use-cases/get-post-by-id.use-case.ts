import type { Post } from '@/domain/blog/entities/post.entity'
import type { IPostRepository } from '@/domain/blog/ports/post-repository.port'

/**
 * Use case for retrieving a post by its ID (ULID)
 *
 * In volatility-based hexagonal architecture:
 * - This is TIER 3 (STABLE) - business logic inside the hexagon
 * - Depends on port interface (IPostRepository), not concrete implementation
 * - Returns post or null if not found
 */
export async function getPostByIdUseCase(
  id: string,
  repository: IPostRepository
): Promise<Post | null> {
  return await repository.getPostById(id)
}
