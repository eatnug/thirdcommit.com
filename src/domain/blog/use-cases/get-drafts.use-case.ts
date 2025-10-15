import type { Post } from '@/domain/blog/entities/post.entity';
import type { IPostRepository } from '@/domain/blog/ports/post-repository.port';

/**
 * Use case for retrieving all draft posts
 *
 * In volatility-based hexagonal architecture:
 * - This is TIER 3 (STABLE) - business logic inside the hexagon
 * - Depends on port interface (IPostRepository), not concrete implementation
 * - Filters posts by status = 'draft'
 * - Sorts by updated_at DESC
 */
export async function getDraftsUseCase(
  repository: IPostRepository
): Promise<Post[]> {
  const posts = await repository.getPosts();

  // Filter to only draft posts
  const drafts = posts.filter((post) => post.status === 'draft');

  // Sort by updated_at DESC (most recently updated first)
  return drafts.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
}
