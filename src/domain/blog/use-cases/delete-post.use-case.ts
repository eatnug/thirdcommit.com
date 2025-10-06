export async function deletePostUseCase(title: string): Promise<void> {
  if (typeof window === 'undefined') {
    // Server-side: use filesystem
    const { postRepository } = await import('@/infrastructure/blog/repositories/post.repository')
    return postRepository.deletePost(title)
  }

  // Client-side: use API
  const response = await fetch(`/api/posts/${encodeURIComponent(title)}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete post')
  }
}
