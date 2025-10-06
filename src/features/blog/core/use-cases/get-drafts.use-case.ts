import type { Post } from '../entities/post.entity'

export async function getDraftsUseCase(): Promise<Post[]> {
  if (typeof window === 'undefined') {
    // Server-side: use filesystem
    const { postRepository } = await import('@/features/blog/data/repositories/post.repository')
    return postRepository.getPosts()
  }

  // Client-side: use API
  const response = await fetch('/api/drafts')
  if (!response.ok) {
    throw new Error('Failed to fetch drafts')
  }
  const data = await response.json()
  return data.drafts || []
}
