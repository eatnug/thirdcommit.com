import type { IDraftRepository } from '@/features/editor/core/ports/draft-repository.port'
import type { Draft } from '@/features/editor/core/entities/draft.entity'
import { type DraftDto, draftDtoToDomain } from '../models/draft.model'

export class ApiDraftRepository implements IDraftRepository {
  async getDrafts(): Promise<Draft[]> {
    const response = await fetch('/api/drafts')
    if (!response.ok) {
      throw new Error(`Failed to fetch drafts: ${response.statusText}`)
    }
    const data = await response.json()
    const dtos: DraftDto[] = data.drafts || []
    return dtos.map(draftDtoToDomain)
  }

  async getDraftBySlug(slug: string): Promise<Draft | null> {
    const response = await fetch(`/api/posts/${slug}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch draft: ${response.statusText}`)
    }
    const dto: DraftDto = await response.json()
    return draftDtoToDomain(dto)
  }

  async deleteDraft(slug: string): Promise<void> {
    const response = await fetch(`/api/posts/${slug}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`Failed to delete draft: ${response.statusText}`)
    }
  }
}
