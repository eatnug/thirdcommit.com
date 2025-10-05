import { useState, useEffect, useCallback, useRef } from 'react'
import type { EditorVersion } from '@/features/editor/core/entities/editor.entity'
import type { EditorFormData } from '@/features/editor/core/form/editor-form.controller'
import { EditorStateService, type EditorStateData } from '@/features/editor/core/services/editor-state.service'
import { useAutosave, useBeforeUnload, useLocalStorage } from '@/app/_lib/hooks'

export type { EditorFormData }

export function useEditorState() {
  const serviceRef = useRef<EditorStateService | null>(null)

  if (!serviceRef.current) {
    serviceRef.current = new EditorStateService()
  }

  const service = serviceRef.current

  const [formData, setFormData] = useState<EditorFormData>(service.getFormData())
  const [lastAutosave, setLastAutosave] = useState<number | null>(service.getLastAutosave())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(service.hasUnsaved())
  const [versions, setVersions] = useLocalStorage<EditorVersion[]>('editor-versions', [])

  // Set up service callbacks
  useEffect(() => {
    service.setCallbacks({
      onStateChange: (data: EditorStateData) => {
        setFormData(data.formData)
        setLastAutosave(data.lastAutosave)
        setHasUnsavedChanges(data.hasUnsavedChanges)
      },
      onAutosave: (timestamp: number) => {
        setLastAutosave(timestamp)
      },
    })
  }, [service])

  // Restore autosave on mount
  useEffect(() => {
    service.restoreAutosave()
  }, [service])

  // Sync versions to service
  useEffect(() => {
    service.setVersions(versions)
  }, [service, versions])

  // Autosave setup
  const handleAutosave = useCallback(async () => {
    await service.autosave()
  }, [service])

  useAutosave({
    data: formData,
    onSave: handleAutosave,
    interval: 30000,
  })

  // Warn before leaving
  useBeforeUnload(hasUnsavedChanges)

  // API
  const updateFormData = useCallback(
    (updates: Partial<EditorFormData>) => {
      service.updateFormData(updates)
    },
    [service]
  )

  const updateField = useCallback(
    <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => {
      service.updateField(field, value)
    },
    [service]
  )

  const saveVersion = useCallback(async () => {
    await service.saveVersion()
    setVersions(service.getVersions())
  }, [service, setVersions])

  const restoreVersion = useCallback(
    (version: EditorVersion) => {
      service.restoreVersion(version)
    },
    [service]
  )

  const clearAutosave = useCallback(async () => {
    await service.clearAutosave()
  }, [service])

  return {
    formData,
    updateFormData,
    updateField,
    lastAutosave,
    hasUnsavedChanges,
    versions,
    saveVersion,
    restoreVersion,
    clearAutosave,
    validation: service.validate(),
    canSave: service.canSave(),
    descriptionCharCount: service.getDescriptionCharCount(),
    contentLineCount: service.getContentLineCount(),
  }
}
