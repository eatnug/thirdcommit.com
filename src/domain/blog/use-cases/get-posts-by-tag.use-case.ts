import type { Post } from '@/domain/blog/entities/post.entity'
import type { IPostRepository } from '@/domain/blog/ports/post-repository.port'
import { PostVisibilityPolicy } from '@/domain/blog/policies/post-visibility.policy'

export async function getPostsByTagUseCase(
  tag: string,
  repository: IPostRepository,
  environment: string = process.env.NODE_ENV || 'development'
): Promise<Post[]> {
  const allPosts = await repository.getPosts()
  const filteredPosts = allPosts.filter(post => post.tags.includes(tag))

  // Apply business policy for visibility
  return filteredPosts.filter((post) =>
    PostVisibilityPolicy.shouldShowInPublicList(post, environment)
  )
}
