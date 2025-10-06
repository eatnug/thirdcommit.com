'use client'

import { useMutation as useTanstackMutation, type UseMutationOptions } from '@tanstack/react-query'

export function useMutationWrapper<TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) {
  return useTanstackMutation<TData, TError, TVariables>({
    mutationFn,
    ...options,
  })
}
