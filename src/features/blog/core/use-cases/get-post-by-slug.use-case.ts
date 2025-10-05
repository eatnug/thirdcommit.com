import type { Post } from '@/features/blog/core/entities/post.entity'
import { postRepository } from '@/features/blog/data/repositories/post.repository'
import { PostNotFoundError } from '@/features/blog/core/errors/post.error'

export async function getPostBySlugUseCase(slug: string): Promise<Post> {
  const post = await postRepository.getPostBySlug(slug)

  if (!post) {
    throw new PostNotFoundError(slug)
  }

  // Business logic: Block drafts in production
  if (process.env.NODE_ENV === 'production' && post.draft) {
    throw new PostNotFoundError(slug)
  }

  return post
}
