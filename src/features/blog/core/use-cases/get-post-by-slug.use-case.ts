import type { Post } from '@/features/blog/core/entities/post.entity'
import type { IPostRepository } from '@/features/blog/core/ports/post-repository.port'
import { postRepository } from '@/features/blog/data/repositories/post.repository'
import { PostNotFoundError } from '@/features/blog/core/errors/post.error'

export async function getPostBySlugUseCase(
  slug: string,
  repository: IPostRepository = postRepository
): Promise<Post> {
  const post = await repository.getPostBySlug(slug)

  if (!post) {
    throw new PostNotFoundError(slug)
  }

  // Business logic: Block drafts in production
  if (process.env.NODE_ENV === 'production' && post.draft) {
    throw new PostNotFoundError(slug)
  }

  return post
}
