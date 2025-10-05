import { useState, useCallback, useEffect } from 'react'
import type { Draft, DraftFormData } from '@/features/editor/core/entities/draft.entity'
import { getDraftsUseCase } from '@/features/editor/core/use-cases/get-drafts.use-case'
import { loadDraftAsFormUseCase } from '@/features/editor/core/use-cases/load-draft-as-form.use-case'
import { deleteDraftUseCase } from '@/features/editor/core/use-cases/delete-draft.use-case'

interface UseDraftsResult {
  drafts: Draft[]
  loading: boolean
  currentDraftSlug: string | null
  loadDraft: (slug: string) => Promise<DraftFormData | null>
  deleteDraft: (slug: string) => Promise<void>
  refreshDrafts: () => Promise<void>
  setCurrentDraftSlug: (slug: string | null) => void
}

export function useDrafts(): UseDraftsResult {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(false)
  const [currentDraftSlug, setCurrentDraftSlug] = useState<string | null>(null)

  const refreshDrafts = useCallback(async () => {
    setLoading(true)
    try {
      const fetchedDrafts = await getDraftsUseCase()
      setDrafts(fetchedDrafts)
    } catch (error) {
      console.error('Failed to fetch drafts:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDraft = useCallback(async (slug: string): Promise<DraftFormData | null> => {
    try {
      const formData = await loadDraftAsFormUseCase(slug)
      if (formData) {
        setCurrentDraftSlug(slug)
      }
      return formData
    } catch (error) {
      console.error('Failed to load draft:', error)
      throw error
    }
  }, [])

  const deleteDraft = useCallback(
    async (slug: string) => {
      try {
        await deleteDraftUseCase(slug)
        await refreshDrafts()
        if (currentDraftSlug === slug) {
          setCurrentDraftSlug(null)
        }
      } catch (error) {
        console.error('Failed to delete draft:', error)
        throw error
      }
    },
    [refreshDrafts, currentDraftSlug]
  )

  useEffect(() => {
    refreshDrafts()
  }, [refreshDrafts])

  return {
    drafts,
    loading,
    currentDraftSlug,
    loadDraft,
    deleteDraft,
    refreshDrafts,
    setCurrentDraftSlug,
  }
}
