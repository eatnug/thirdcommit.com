import type { IPostRepository } from '@/domain/blog/ports/post-repository.port'
import type { Post } from '@/domain/blog/entities/post.entity'

/**
 * API-based Post Repository (Client-side)
 *
 * Implements IPostRepository using browser fetch API to communicate with backend
 * Used when running in browser environment
 */
export class ApiPostRepository implements IPostRepository {
  async getPosts(): Promise<Post[]> {
    const response = await fetch('/api/posts')
    if (!response.ok) {
      throw new Error('Failed to fetch posts')
    }
    const data = await response.json()
    return data.posts.map(this.parsePost)
  }

  async getPostById(id: string): Promise<Post | null> {
    const response = await fetch(`/api/posts/${encodeURIComponent(id)}`)
    if (response.status === 404) {
      return null
    }
    if (!response.ok) {
      throw new Error('Failed to fetch post')
    }
    const data = await response.json()
    return this.parsePost(data)
  }

  async getPostByTitle(title: string): Promise<Post | null> {
    // For client-side, we need to fetch all and filter
    // This is not ideal but works for now
    const posts = await this.getPosts()
    return posts.find(p => p.title === title) || null
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    const posts = await this.getPosts()
    return posts.find(p => p.slug === slug) || null
  }

  async createPost(data: {
    title: string
    description?: string
    content: string
    status: 'draft' | 'published'
  }): Promise<{
    id: string
    slug: string
    title: string
    status: 'draft' | 'published'
    filename: string
    path: string
  }> {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create post')
    }

    return response.json()
  }

  async updatePost(
    id: string,
    data: Partial<{
      title: string
      description: string
      content: string
      status: 'draft' | 'published'
      published_at: Date | null
    }>
  ): Promise<Post> {
    const response = await fetch(`/api/posts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update post')
    }

    const result = await response.json()
    return this.parsePost(result)
  }

  async deletePost(title: string): Promise<void> {
    // Find post by title first to get ID
    const post = await this.getPostByTitle(title)
    if (!post) {
      throw new Error(`Post "${title}" not found`)
    }

    const response = await fetch(`/api/posts/${encodeURIComponent(post.id)}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete post')
    }
  }

  private parsePost(data: Record<string, unknown>): Post {
    return {
      id: data.id as string,
      slug: data.slug as string,
      title: data.title as string,
      status: data.status as 'draft' | 'published',
      created_at: new Date(data.created_at as string),
      updated_at: new Date(data.updated_at as string),
      published_at: data.published_at ? new Date(data.published_at as string) : null,
      description: (data.description as string) || '',
      content: data.content as string,
      readingTime: data.readingTime as string,
    }
  }
}
