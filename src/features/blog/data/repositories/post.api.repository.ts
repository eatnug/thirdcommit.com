import type { Post } from '@/features/blog/core/entities/post.entity'
import type { IPostRepository } from '@/features/blog/core/ports/post-repository.port'

interface DraftApiResponse {
  slug: string
  title: string
  date: string
  tags: string[]
  description?: string
  contentPreview: string
}

interface PostApiResponse {
  slug: string
  title: string
  date: string
  tags: string[]
  description?: string
  content: string
  draft: boolean
}

/**
 * API Post Repository
 * Client-side repository that fetches data through API endpoints
 */
export class ApiPostRepository implements IPostRepository {
  async getPosts(): Promise<Post[]> {
    const response = await fetch('/api/drafts')
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`)
    }
    const data = await response.json()
    const drafts: DraftApiResponse[] = data.drafts || []

    return drafts.map(draft => ({
      slug: draft.slug,
      title: draft.title,
      date: new Date(draft.date),
      tags: draft.tags,
      description: draft.description || '',
      content: draft.contentPreview,
      html: '',
      readingTime: '',
      draft: true,
    }))
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    const response = await fetch(`/api/posts/${slug}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch post: ${response.statusText}`)
    }
    const data: PostApiResponse = await response.json()

    return {
      slug: data.slug,
      title: data.title,
      date: new Date(data.date),
      tags: data.tags,
      description: data.description || '',
      content: data.content,
      html: '',
      readingTime: '',
      draft: data.draft,
    }
  }

  async createPost(data: {
    title: string
    description?: string
    tags: string[]
    content: string
    draft: boolean
  }): Promise<{ slug: string; filename: string; path: string }> {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create post')
    }

    return response.json()
  }

  async deletePost(slug: string): Promise<void> {
    const response = await fetch(`/api/posts/${slug}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`Failed to delete post: ${response.statusText}`)
    }
  }
}
