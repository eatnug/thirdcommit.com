import type { DraftFormData } from '../entities/draft.entity'
import type { IDraftRepository } from '../ports/draft-repository.port'
import { draftRepository } from '@/features/editor/data/repositories/draft.repository'

export async function loadDraftAsFormUseCase(
  slug: string,
  repository: IDraftRepository = draftRepository
): Promise<DraftFormData | null> {
  const draft = await repository.getDraftBySlug(slug)

  if (!draft) {
    return null
  }

  return {
    title: draft.title,
    description: draft.description || '',
    tags: draft.tags.join(', '),
    content: draft.content,
    draft: draft.draft,
  }
}
