import type { PostFormData } from '@/domain/blog/entities/post.entity';
import type { IPostRepository } from '@/domain/blog/ports/post-repository.port';

/**
 * Use case for loading a post as form data
 *
 * In volatility-based hexagonal architecture:
 * - This is TIER 3 (STABLE) - business logic inside the hexagon
 * - Depends on port interface (IPostRepository), not concrete implementation
 * - Transforms Post entity to PostFormData DTO
 */
export async function loadPostAsFormUseCase(
  id: string,
  repository: IPostRepository
): Promise<PostFormData | null> {
  const post = await repository.getPostById(id);

  if (!post) {
    return null;
  }

  return {
    id: post.id,
    title: post.title,
    description: post.description || '',
    content: post.content,
    status: post.status,
  };
}
