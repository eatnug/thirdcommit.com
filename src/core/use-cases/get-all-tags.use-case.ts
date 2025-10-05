import { postRepository } from '@/data/repositories/post.repository'

export async function getAllTagsUseCase(): Promise<string[]> {
  const posts = await postRepository.getPosts()

  const tagSet = new Set<string>()

  posts.forEach(post => {
    if (process.env.NODE_ENV === 'production' && post.draft) {
      return
    }
    post.tags.forEach(tag => tagSet.add(tag))
  })

  return Array.from(tagSet).sort()
}
