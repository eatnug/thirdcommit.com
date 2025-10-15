import type { Post } from '@/domain/blog/entities/post.entity';
import type { IPostRepository } from '@/domain/blog/ports/post-repository.port';

/**
 * Use case for publishing a draft post
 *
 * In volatility-based hexagonal architecture:
 * - This is TIER 3 (STABLE) - business logic inside the hexagon
 * - Depends on port interface (IPostRepository), not concrete implementation
 * - Changes post status from 'draft' to 'published'
 * - Sets published_at timestamp
 */
export async function publishPostUseCase(
  id: string,
  repository: IPostRepository
): Promise<Post> {
  const post = await repository.getPostById(id);
  if (!post) {
    throw new Error('Post not found');
  }

  if (post.status === 'published') {
    throw new Error('Post is already published');
  }

  const now = new Date();
  const updatedPost = await repository.updatePost(id, {
    status: 'published',
    published_at: post.published_at || now,
  });

  return updatedPost;
}
