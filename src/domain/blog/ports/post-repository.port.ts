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
   * Retrieve a single post by its ID (ULID)
   */
  getPostById(id: string): Promise<Post | null>

  /**
   * Retrieve a single post by its title
   */
  getPostByTitle(title: string): Promise<Post | null>

  /**
   * Retrieve a single post by its slug
   */
  getPostBySlug(slug: string): Promise<Post | null>

  /**
   * Create a new post
   */
  createPost(data: {
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
  }>

  /**
   * Update an existing post
   */
  updatePost(
    id: string,
    data: Partial<{
      title: string
      description: string
      content: string
      status: 'draft' | 'published'
      published_at: Date | null
    }>
  ): Promise<Post>

  /**
   * Delete a post by its title
   */
  deletePost(title: string): Promise<void>
}
