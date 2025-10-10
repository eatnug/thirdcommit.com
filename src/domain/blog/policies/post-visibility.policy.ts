import type { Post } from '@/domain/blog/entities/post.entity'

/**
 * Business policies for post visibility
 *
 * In volatility-based architecture:
 * - This is TIER 3 (STABLE) - pure business rules
 * - Framework-agnostic, testable in isolation
 * - Reusable across multiple use-cases
 * - Rarely changes (only when business requirements change)
 *
 * These policies define WHO can see WHAT posts and WHEN
 */
export class PostVisibilityPolicy {
  /**
   * Determines if a post should be shown in public lists
   *
   * Business Rule:
   * - All posts are shown (published and draft)
   *
   * @param post - The post to evaluate
   */
  static shouldShowInPublicList(_post: Post): boolean {
    return true
  }

  /**
   * Determines if a post is accessible to a specific user
   *
   * Business Rule:
   * - Published posts: accessible to everyone
   * - Draft posts: only accessible to authenticated users with proper permissions
   *
   * @param post - The post to evaluate
   * @param user - The user attempting to access (optional)
   */
  static canUserAccess(
    post: Post,
    user?: { id: string; role: string; email: string }
  ): boolean {
    // Published posts are accessible to everyone
    if (post.status === 'published') {
      return true
    }

    // Draft posts require authentication
    if (!user) {
      return false
    }

    // Admins can see all drafts
    if (user.role === 'admin') {
      return true
    }

    // Note: This is a placeholder - you'd need to add authorId to Post entity
    // to implement proper author-only access
    // return user.id === post.authorId

    return false
  }

  /**
   * Determines if a post should be indexed by search engines
   *
   * Business Rule:
   * - Only published posts should be indexed
   *
   * @param post - The post to evaluate
   */
  static shouldIndexForSEO(post: Post): boolean {
    return post.status === 'published'
  }

  /**
   * Filter a list of posts based on visibility rules
   *
   * @param posts - Array of posts to filter
   * @param user - Optional user context
   */
  static filterVisiblePosts(
    posts: Post[],
    user?: { id: string; role: string; email: string }
  ): Post[] {
    return posts.filter((post) => {
      // For public lists, use public visibility rules
      const isPubliclyVisible = this.shouldShowInPublicList(post)

      // For authenticated users, use access rules
      const isAccessible = user ? this.canUserAccess(post, user) : isPubliclyVisible

      return isAccessible
    })
  }
}
