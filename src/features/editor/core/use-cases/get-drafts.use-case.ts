import type { Draft } from '../entities/draft.entity'
import type { IDraftRepository } from '../ports/draft-repository.port'
import { draftRepository } from '@/features/editor/data/repositories/draft.repository'

export async function getDraftsUseCase(
  repository: IDraftRepository = draftRepository
): Promise<Draft[]> {
  return repository.getDrafts()
}
