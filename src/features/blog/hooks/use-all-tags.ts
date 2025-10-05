'use client'

import { useQuery } from '@tanstack/react-query'
import { getAllTagsUseCase } from '@/features/blog/core/use-cases/get-all-tags.use-case'

export function useAllTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: getAllTagsUseCase,
  })
}
