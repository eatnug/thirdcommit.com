'use client'

import { blog } from '@/domain/blog'
import { useQueryWrapper } from './use-query-wrapper'
import { useMutationWrapper } from './use-mutation-wrapper'

/**
 * Example: Blog-specific React hooks
 *
 * In volatility-based architecture:
 * - This is TIER 1 (VOLATILE) - React-specific adapter
 * - Wraps stable use-cases with React Query for client components
 * - Optional: You can also call blog.getPosts() directly without hooks
 *
 * Note: For server components, import directly from '@/domain/blog'
 * and call use-cases without hooks:
 *
 * ```typescript
 * // Server Component
 * import { blog } from '@/domain/blog'
 *
 * export default async function BlogPage() {
 *   const posts = await blog.getPosts()
 *   return <PostList posts={posts} />
 * }
 * ```
 */

export function usePosts(environment?: string) {
  return useQueryWrapper(['posts', environment], () => blog.getPosts(environment))
}

export function usePost(slug: string, environment?: string) {
  return useQueryWrapper(['posts', slug, environment], () =>
    blog.getPost(slug, environment)
  )
}

export function useDrafts() {
  return useQueryWrapper(['drafts'], blog.getDrafts)
}

export function useAllTags() {
  return useQueryWrapper(['tags'], blog.getAllTags)
}

export function usePostsByTag(tag: string, environment?: string) {
  return useQueryWrapper(['posts', 'tag', tag, environment], () =>
    blog.getPostsByTag(tag, environment)
  )
}

export function useDeletePost() {
  return useMutationWrapper((title: string) => blog.deletePost(title))
}
