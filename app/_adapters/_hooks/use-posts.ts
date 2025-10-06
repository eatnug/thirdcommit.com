'use client'

import { createBlogApi, getClientPostRepository } from '@/domain/blog'
import { useQueryWrapper } from './use-query-wrapper'
import { useMutationWrapper } from './use-mutation-wrapper'

/**
 * Blog-specific React hooks for client components
 *
 * In volatility-based architecture:
 * - This is TIER 1 (VOLATILE) - React-specific adapter
 * - Wraps stable use-cases with React Query for client components
 * - Uses client-side repository (API calls)
 *
 * Note: For server components, use getServerPostRepository instead:
 *
 * ```typescript
 * // Server Component
 * import { createBlogApi, getServerPostRepository } from '@/domain/blog'
 *
 * export default async function BlogPage() {
 *   const repository = await getServerPostRepository()
 *   const blog = createBlogApi(repository)
 *   const posts = await blog.getPosts()
 *   return <PostList posts={posts} />
 * }
 * ```
 */

// Create a singleton blog API instance for client-side use
let blogApiInstance: ReturnType<typeof createBlogApi> | null = null

async function getBlogApi() {
  if (!blogApiInstance) {
    const repository = await getClientPostRepository()
    blogApiInstance = createBlogApi(repository)
  }
  return blogApiInstance
}

export function usePosts() {
  return useQueryWrapper(['posts'], async () => {
    const blog = await getBlogApi()
    return blog.getPosts()
  })
}

export function usePost(slug: string) {
  return useQueryWrapper(['posts', slug], async () => {
    const blog = await getBlogApi()
    return blog.getPost(slug)
  })
}

export function useDrafts() {
  return useQueryWrapper(['drafts'], async () => {
    const blog = await getBlogApi()
    return blog.getDrafts()
  })
}

export function useDeletePost() {
  return useMutationWrapper(async (id: string) => {
    const blog = await getBlogApi()
    return blog.deletePost(id)
  })
}
