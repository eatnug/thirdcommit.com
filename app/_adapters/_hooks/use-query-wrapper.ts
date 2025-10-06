'use client'

import { useQuery as useTanstackQuery, type UseQueryOptions } from '@tanstack/react-query'

type QueryKey = readonly unknown[]

export function useQueryWrapper<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useTanstackQuery<TData, TError>({
    queryKey,
    queryFn,
    ...options,
  })
}
