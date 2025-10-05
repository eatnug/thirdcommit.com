import type { EditorVersion } from '../entities/editor.entity'
import type { EditorFormData } from '../form/editor-form.controller'
import { editorFormController } from '../form/editor-form.controller'
import { restoreAutosaveUseCase } from '../use-cases/restore-autosave.use-case'
import { saveAutosaveUseCase } from '../use-cases/save-autosave.use-case'
import { clearAutosaveUseCase } from '../use-cases/clear-autosave.use-case'
import { addEditorVersionUseCase } from '../use-cases/manage-editor-versions.use-case'
import { generateId } from '@/shared/utils'

export interface EditorStateData {
  formData: EditorFormData
  lastAutosave: number | null
  hasUnsavedChanges: boolean
  versions: EditorVersion[]
}

export interface EditorStateCallbacks {
  onStateChange: (data: EditorStateData) => void
  onAutosave: (timestamp: number) => void
}

export class EditorStateService {
  private data: EditorStateData = {
    formData: editorFormController.reset(),
    lastAutosave: null,
    hasUnsavedChanges: false,
    versions: [],
  }

  private callbacks: EditorStateCallbacks | null = null

  setCallbacks(callbacks: EditorStateCallbacks) {
    this.callbacks = callbacks
  }

  private notifyChange() {
    if (this.callbacks) {
      this.callbacks.onStateChange({ ...this.data })
    }
  }

  // Restore autosaved data
  async restoreAutosave(): Promise<void> {
    const autosave = await restoreAutosaveUseCase()
    if (autosave) {
      this.data.formData = {
        title: autosave.title,
        description: autosave.description,
        tags: autosave.tags,
        content: autosave.content,
        draft: autosave.draft,
      }
      this.data.lastAutosave = autosave.timestamp
      this.data.hasUnsavedChanges = true
      this.notifyChange()
    }
  }

  // Update form data
  updateFormData(updates: Partial<EditorFormData>): void {
    this.data.formData = editorFormController.updateFields(this.data.formData, updates)
    this.data.hasUnsavedChanges = editorFormController.hasChanges(this.data.formData)
    this.notifyChange()
  }

  // Update single field
  updateField<K extends keyof EditorFormData>(
    field: K,
    value: EditorFormData[K]
  ): void {
    this.data.formData = editorFormController.updateField(this.data.formData, field, value)
    this.data.hasUnsavedChanges = editorFormController.hasChanges(this.data.formData)
    this.notifyChange()
  }

  // Autosave
  async autosave(): Promise<void> {
    const timestamp = Date.now()
    await saveAutosaveUseCase({
      ...this.data.formData,
      timestamp,
    })
    this.data.lastAutosave = timestamp
    if (this.callbacks) {
      this.callbacks.onAutosave(timestamp)
    }
    this.notifyChange()
  }

  // Clear autosave
  async clearAutosave(): Promise<void> {
    await clearAutosaveUseCase()
    this.data.hasUnsavedChanges = false
    this.data.lastAutosave = null
    this.notifyChange()
  }

  // Save version
  async saveVersion(): Promise<void> {
    const newVersion: EditorVersion = {
      id: generateId(),
      ...this.data.formData,
      timestamp: Date.now(),
    }

    await addEditorVersionUseCase(newVersion)
    this.data.versions = [newVersion, ...this.data.versions].slice(0, 10)
    this.notifyChange()
  }

  // Restore version
  restoreVersion(version: EditorVersion): void {
    this.data.formData = {
      title: version.title,
      description: version.description,
      tags: version.tags,
      content: version.content,
      draft: version.draft,
    }
    this.notifyChange()
  }

  // Set versions (for initialization from localStorage)
  setVersions(versions: EditorVersion[]): void {
    this.data.versions = versions
    this.notifyChange()
  }

  // Getters
  getFormData(): EditorFormData {
    return { ...this.data.formData }
  }

  getLastAutosave(): number | null {
    return this.data.lastAutosave
  }

  hasUnsaved(): boolean {
    return this.data.hasUnsavedChanges
  }

  getVersions(): EditorVersion[] {
    return [...this.data.versions]
  }

  validate() {
    return editorFormController.validate(this.data.formData)
  }

  canSave(): boolean {
    return editorFormController.canSave(this.data.formData)
  }

  getDescriptionCharCount() {
    return editorFormController.getDescriptionCharCount(this.data.formData.description)
  }

  getContentLineCount(): number {
    return editorFormController.getContentLineCount(this.data.formData.content)
  }
}
