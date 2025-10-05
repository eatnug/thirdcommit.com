import type { Post } from '@/features/blog/core/entities/post.entity'
import { postRepository } from '@/features/blog/data/repositories/post.repository'

export async function getPostsByTagUseCase(tag: string): Promise<Post[]> {
  const allPosts = await postRepository.getPosts()
  const filteredPosts = allPosts.filter(post => post.tags.includes(tag))

  // Business logic: Filter out drafts in production
  if (process.env.NODE_ENV === 'production') {
    return filteredPosts.filter(post => !post.draft)
  }

  return filteredPosts
}
