import { useState, useEffect, useCallback } from 'react'
import type { EditorVersion } from '@/features/editor/core/entities/editor.entity'
import { restoreAutosaveUseCase } from '@/features/editor/core/use-cases/restore-autosave.use-case'
import { saveAutosaveUseCase } from '@/features/editor/core/use-cases/save-autosave.use-case'
import { clearAutosaveUseCase } from '@/features/editor/core/use-cases/clear-autosave.use-case'
import { addEditorVersionUseCase } from '@/features/editor/core/use-cases/manage-editor-versions.use-case'
import { generateId } from '@/shared/utils'
import { useAutosave, useBeforeUnload, useLocalStorage } from '@/app/_lib/hooks'

export interface EditorFormData {
  title: string
  description: string
  tags: string
  content: string
  draft: boolean
}

export function useEditorState() {
  const [formData, setFormData] = useState<EditorFormData>({
    title: '',
    description: '',
    tags: '',
    content: '',
    draft: true,
  })

  const [lastAutosave, setLastAutosave] = useState<number | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [versions, setVersions] = useLocalStorage<EditorVersion[]>('editor-versions', [])

  // Restore autosaved draft on mount
  useEffect(() => {
    restoreAutosaveUseCase().then(autosave => {
      if (autosave) {
        setFormData({
          title: autosave.title,
          description: autosave.description,
          tags: autosave.tags,
          content: autosave.content,
          draft: autosave.draft,
        })
        setLastAutosave(autosave.timestamp)
        setHasUnsavedChanges(true)
      }
    })
  }, [])

  // Track unsaved changes
  useEffect(() => {
    const hasContent = !!(
      formData.title ||
      formData.description ||
      formData.tags ||
      formData.content
    )
    setHasUnsavedChanges(hasContent)
  }, [formData])

  // Autosave callback
  const handleAutosave = useCallback(async (data: typeof formData) => {
    await saveAutosaveUseCase({
      ...data,
      timestamp: Date.now(),
    })
    setLastAutosave(Date.now())
  }, [])

  // Set up autosave
  useAutosave({
    data: formData,
    onSave: handleAutosave,
    interval: 30000, // 30 seconds
  })

  // Warn before leaving with unsaved changes
  useBeforeUnload(hasUnsavedChanges)

  // Update form data
  const updateFormData = useCallback((updates: Partial<EditorFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  // Save current state as a version
  const saveVersion = useCallback(async () => {
    const newVersion: EditorVersion = {
      id: generateId(),
      ...formData,
      timestamp: Date.now(),
    }

    await addEditorVersionUseCase(newVersion)
    setVersions(prev => {
      const updated = [newVersion, ...prev]
      return updated.slice(0, 10) // Keep only last 10 versions
    })
  }, [formData, setVersions])

  // Restore a version
  const restoreVersion = useCallback((version: EditorVersion) => {
    setFormData({
      title: version.title,
      description: version.description,
      tags: version.tags,
      content: version.content,
      draft: version.draft,
    })
  }, [])

  // Clear autosave
  const clearAutosave = useCallback(async () => {
    await clearAutosaveUseCase()
    setHasUnsavedChanges(false)
    setLastAutosave(null)
  }, [])

  return {
    formData,
    updateFormData,
    lastAutosave,
    hasUnsavedChanges,
    versions,
    saveVersion,
    restoreVersion,
    clearAutosave,
  }
}
