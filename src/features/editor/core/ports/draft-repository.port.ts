import type { Draft } from '../entities/draft.entity'

export interface IDraftRepository {
  getDrafts(): Promise<Draft[]>
  getDraftBySlug(slug: string): Promise<Draft | null>
  deleteDraft(slug: string): Promise<void>
}
