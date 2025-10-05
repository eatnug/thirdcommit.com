'use client'

import { useQuery } from '@tanstack/react-query'
import { getPostBySlugUseCase } from '@/core/use-cases/get-post-by-slug.use-case'

export function usePost(slug: string) {
  return useQuery({
    queryKey: ['posts', slug],
    queryFn: () => getPostBySlugUseCase(slug),
    enabled: !!slug,
  })
}
