import type { IDraftRepository } from '@/features/editor/core/ports/draft-repository.port'
import { ApiDraftRepository } from './draft.api.repository'

export const draftRepository: IDraftRepository = new ApiDraftRepository()
