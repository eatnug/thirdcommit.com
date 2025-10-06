import type { Post } from '@/domain/blog/entities/post.entity'
import type { IPostRepository } from '@/domain/blog/ports/post-repository.port'
import { PostNotFoundError } from '@/domain/blog/errors/post.error'
import { PostVisibilityPolicy } from '@/domain/blog/policies/post-visibility.policy'

export async function getPostBySlugUseCase(
  slug: string,
  repository: IPostRepository,
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
