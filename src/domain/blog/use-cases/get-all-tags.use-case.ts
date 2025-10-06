import type { IPostRepository } from '@/domain/blog/ports/post-repository.port'

export async function getAllTagsUseCase(
  repository: IPostRepository
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
