import type { IPostRepository } from '@/features/blog/core/ports/post-repository.port'
import { postRepository } from '@/features/blog/data/repositories/post.repository'

export async function getAllTagsUseCase(
  repository: IPostRepository = postRepository
): Promise<string[]> {
  const posts = await repository.getPosts()

  const tagSet = new Set<string>()

  posts.forEach(post => {
    if (process.env.NODE_ENV === 'production' && post.draft) {
      return
    }
    post.tags.forEach(tag => tagSet.add(tag))
  })

  return Array.from(tagSet).sort()
}
