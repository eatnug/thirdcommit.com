import type { Post } from '@/features/blog/core/entities/post.entity'
import { postRepository } from '@/features/blog/data/repositories/post.repository'

export async function getPostsUseCase(): Promise<Post[]> {
  const posts = await postRepository.getPosts()

  // Business logic: Filter out drafts in production
  if (process.env.NODE_ENV === 'production') {
    return posts.filter(post => !post.draft)
  }

  return posts
}
