import type { Post } from '@/core/entities/post.entity'
import { postRepository } from '@/data/repositories/post.repository'
import { PostNotFoundError } from '@/core/errors/post.error'

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
