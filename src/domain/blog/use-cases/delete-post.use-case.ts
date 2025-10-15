import type { IPostRepository } from '@/domain/blog/ports/post-repository.port';

/**
 * Use case for deleting a post
 *
 * In volatility-based hexagonal architecture:
 * - This is TIER 3 (STABLE) - business logic inside the hexagon
 * - Depends on port interface (IPostRepository), not concrete implementation
 * - Validates post exists before deletion
 */
export async function deletePostUseCase(
  id: string,
  repository: IPostRepository
): Promise<void> {
  const post = await repository.getPostById(id);
  if (!post) {
    throw new Error('Post not found');
  }
  return repository.deletePost(post.title);
}
