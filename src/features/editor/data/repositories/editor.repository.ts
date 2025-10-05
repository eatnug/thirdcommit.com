import type { AutosaveDraft, EditorVersion } from '@/features/editor/core/entities/editor.entity'

export interface IEditorRepository {
  getAutosave(): Promise<AutosaveDraft | null>
  saveAutosave(draft: AutosaveDraft): Promise<void>
  clearAutosave(): Promise<void>
  getVersions(): Promise<EditorVersion[]>
  addVersion(version: EditorVersion): Promise<void>
}

export class EditorRepository implements IEditorRepository {
  async getAutosave(): Promise<AutosaveDraft | null> {
    const { editorStorage } = await import('@/features/editor/data/repositories/editor-storage')
    return editorStorage.getAutosave()
  }

  async saveAutosave(draft: AutosaveDraft): Promise<void> {
    const { editorStorage } = await import('@/features/editor/data/repositories/editor-storage')
    editorStorage.setAutosave(draft)
  }

  async clearAutosave(): Promise<void> {
    const { editorStorage } = await import('@/features/editor/data/repositories/editor-storage')
    editorStorage.clearAutosave()
  }

  async getVersions(): Promise<EditorVersion[]> {
    const { editorStorage } = await import('@/features/editor/data/repositories/editor-storage')
    return editorStorage.getVersions()
  }

  async addVersion(version: EditorVersion): Promise<void> {
    const { editorStorage } = await import('@/features/editor/data/repositories/editor-storage')
    editorStorage.addVersion(version)
  }
}

export const editorRepository = new EditorRepository()
