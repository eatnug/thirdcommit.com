import type { Post } from '@/domain/blog/entities/post.entity'

/**
 * Port (interface) for post repository
 * Defines the contract for post data access
 *
 * In hexagonal architecture:
 * - This is a SECONDARY PORT (driven by the application)
 * - Implementations are ADAPTERS (e.g., FileSystemPostRepository, ApiPostRepository)
 * - Use cases depend on this interface, not concrete implementations
 */
export interface IPostRepository {
  /**
   * Retrieve all posts from the data source
   */
  getPosts(): Promise<Post[]>

  /**
   * Retrieve a single post by its title
   */
  getPostByTitle(title: string): Promise<Post | null>

  /**
   * Retrieve a single post by its slug (deprecated, use getPostByTitle)
   */
  getPostBySlug(slug: string): Promise<Post | null>

  /**
   * Create a new post
   */
  createPost(data: {
    title: string
    description?: string
    tags: string[]
    content: string
    draft: boolean
  }): Promise<{ title: string; filename: string; path: string }>

  /**
   * Delete a post by its title
   */
  deletePost(title: string): Promise<void>
}
