import type { Post } from '@/domain/blog/entities/post.entity';
import type { IPostRepository } from '@/domain/blog/ports/post-repository.port';
import { PostNotFoundError } from '@/domain/blog/errors/post.error';

export async function getPostBySlugUseCase(
  slug: string,
  repository: IPostRepository
): Promise<Post> {
  const post = await repository.getPostBySlug(slug);

  if (!post) {
    throw new PostNotFoundError(slug);
  }

  return post;
}
