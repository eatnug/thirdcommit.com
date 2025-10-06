import type { Post } from '@/features/blog/core/entities/post.entity'
import type { IPostRepository } from '@/features/blog/core/ports/post-repository.port'
import { postRepository } from '@/features/blog/data/repositories/post.repository'
import { PostNotFoundError } from '@/features/blog/core/errors/post.error'
import { PostVisibilityPolicy } from '@/features/blog/core/policies/post-visibility.policy'

export async function getPostBySlugUseCase(
  slug: string,
  repository: IPostRepository = postRepository,
  environment: string = process.env.NODE_ENV || 'development'
): Promise<Post> {
  const post = await repository.getPostBySlug(slug)

  if (!post) {
    throw new PostNotFoundError(slug)
  }

  // Apply business policy: Block drafts based on environment
  if (!PostVisibilityPolicy.shouldShowInPublicList(post, environment)) {
    throw new PostNotFoundError(slug)
  }

  return post
}
