'use client'

import {
  useQuery,
  type UseQueryOptions,
  type QueryKey,
} from '@tanstack/react-query'

/**
 * Generic React Query wrapper for use-cases
 *
 * In volatility-based architecture:
 * - This is TIER 1 (VOLATILE) - React/React Query specific
 * - Acts as PRIMARY ADAPTER - drives use-cases from UI
 * - Can be replaced when migrating to Vue/Svelte
 *
 * Usage:
 * ```typescript
 * import { useQueryWrapper } from '@/app/_adapters/hooks'
 * import { blog } from '@/features/blog'
 *
 * function BlogList() {
 *   const { data: posts } = useQueryWrapper(['posts'], blog.getPosts)
 *   return <div>{posts?.map(...)}</div>
 * }
 * ```
 */
export function useQueryWrapper<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<
    UseQueryOptions<TData, TError, TData, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    ...options,
  })
}
