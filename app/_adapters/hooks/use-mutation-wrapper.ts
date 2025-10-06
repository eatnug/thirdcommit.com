'use client'

import {
  useMutation,
  type UseMutationOptions,
} from '@tanstack/react-query'

/**
 * Generic React Query mutation wrapper for use-cases
 *
 * In volatility-based architecture:
 * - This is TIER 1 (VOLATILE) - React/React Query specific
 * - Acts as PRIMARY ADAPTER - drives use-cases from UI
 * - Can be replaced when migrating to Vue/Svelte
 *
 * Usage:
 * ```typescript
 * import { useMutationWrapper } from '@/app/_adapters/hooks'
 * import { blog } from '@/features/blog'
 *
 * function DeleteButton({ title }: { title: string }) {
 *   const deleteMutation = useMutationWrapper(
 *     (title: string) => blog.deletePost(title),
 *     {
 *       onSuccess: () => {
 *         queryClient.invalidateQueries(['posts'])
 *       }
 *     }
 *   )
 *
 *   return <button onClick={() => deleteMutation.mutate(title)}>Delete</button>
 * }
 * ```
 */
export function useMutationWrapper<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn'
  >
) {
  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    ...options,
  })
}
