'use client'

import { useQuery } from '@tanstack/react-query'
import { getPostsUseCase } from '@/core/use-cases/get-posts.use-case'

export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: getPostsUseCase,
  })
}
