import type { Draft } from '@/features/editor/core/entities/draft.entity'

export interface DraftDto {
  slug: string
  title: string
  date: string
  tags: string[]
  description?: string
  content: string
  draft: boolean
  contentPreview: string
}

export function draftDtoToDomain(dto: DraftDto): Draft {
  return {
    slug: dto.slug,
    title: dto.title,
    date: dto.date,
    tags: dto.tags,
    description: dto.description,
    content: dto.content,
    draft: dto.draft,
    contentPreview: dto.contentPreview,
  }
}
