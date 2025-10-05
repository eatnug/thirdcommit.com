import type { IDraftRepository } from '../ports/draft-repository.port'
import { draftRepository } from '@/features/editor/data/repositories/draft.repository'

export async function deleteDraftUseCase(
  slug: string,
  repository: IDraftRepository = draftRepository
): Promise<void> {
  return repository.deleteDraft(slug)
}
