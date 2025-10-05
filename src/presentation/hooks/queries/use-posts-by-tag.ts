'use client'

import { useQuery } from '@tanstack/react-query'
import { getPostsByTagUseCase } from '@/core/use-cases/get-posts-by-tag.use-case'

export function usePostsByTag(tag: string) {
  return useQuery({
    queryKey: ['posts', 'tag', tag],
    queryFn: () => getPostsByTagUseCase(tag),
    enabled: !!tag,
  })
}
