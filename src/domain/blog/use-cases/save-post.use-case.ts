import type { Post } from '@/domain/blog/entities/post.entity';
import type { IPostRepository } from '@/domain/blog/ports/post-repository.port';

export interface SavePostInput {
  id?: string;
  title: string;
  description: string;
  content: string;
  status: 'draft' | 'published';
}

/**
 * Use case for saving a post (create or update)
 *
 * In volatility-based hexagonal architecture:
 * - This is TIER 3 (STABLE) - business logic inside the hexagon
 * - Depends on port interface (IPostRepository), not concrete implementation
 * - Handles both create and update operations
 */
export async function savePostUseCase(
  input: SavePostInput,
  repository: IPostRepository
): Promise<
  | Post
  | {
      id: string;
      slug: string;
      title: string;
      status: 'draft' | 'published';
      filename: string;
      path: string;
    }
> {
  if (input.id) {
    // UPDATE existing post
    const updatedPost = await repository.updatePost(input.id, {
      title: input.title,
      description: input.description,
      content: input.content,
    });
    return updatedPost;
  } else {
    // CREATE new post
    const result = await repository.createPost({
      title: input.title,
      description: input.description,
      content: input.content,
      status: input.status,
    });
    return result;
  }
}
