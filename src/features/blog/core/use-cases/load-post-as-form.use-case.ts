import type { PostFormData } from '../entities/post.entity'

export async function loadPostAsFormUseCase(
  title: string
): Promise<PostFormData | null> {
  if (typeof window === 'undefined') {
    // Server-side: use filesystem
    const { postRepository } = await import('@/features/blog/data/repositories/post.repository')
    const post = await postRepository.getPostByTitle(title)

    if (!post) {
      return null
    }

    return {
      title: post.title,
      description: post.description || '',
      tags: post.tags.join(', '),
      content: post.content,
      draft: post.draft,
    }
  }

  // Client-side: use API
  const response = await fetch(`/api/posts/${encodeURIComponent(title)}`)
  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error('Failed to load post')
  }

  const data = await response.json()
  return {
    title: data.title,
    description: data.description || '',
    tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
    content: data.content,
    draft: data.draft,
  }
}
