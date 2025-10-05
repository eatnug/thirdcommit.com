import type { IEditorRepository } from '@/features/editor/core/ports/editor-repository.port'
import type { AutosaveDraft, EditorVersion } from '@/features/editor/core/entities/editor.entity'
import { getLocalStorage, setLocalStorage } from '@/shared/utils/local-storage'

/**
 * LocalStorage Adapter for Editor Repository
 * Implements the IEditorRepository port using browser's localStorage as the data source
 *
 * In hexagonal architecture:
 * - This is a SECONDARY ADAPTER (driven by the application)
 * - Implements the port interface defined in core layer
 * - Can be swapped with other adapters (e.g., IndexedDBEditorRepository, ApiEditorRepository)
 */

const AUTOSAVE_KEY = 'post-editor-autosave'
const VERSIONS_KEY = 'post-editor-versions'

export class LocalStorageEditorRepository implements IEditorRepository {
  async getAutosave(): Promise<AutosaveDraft | null> {
    return getLocalStorage<AutosaveDraft | null>(AUTOSAVE_KEY, null)
  }

  async saveAutosave(draft: AutosaveDraft): Promise<void> {
    setLocalStorage(AUTOSAVE_KEY, draft)
  }

  async clearAutosave(): Promise<void> {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(AUTOSAVE_KEY)
  }

  async getVersions(): Promise<EditorVersion[]> {
    return getLocalStorage<EditorVersion[]>(VERSIONS_KEY, [])
  }

  async addVersion(version: EditorVersion): Promise<void> {
    const versions = await this.getVersions()
    setLocalStorage(VERSIONS_KEY, [version, ...versions])
  }

  // Additional utility methods (not in port interface)
  removeVersion(id: string): void {
    const versions = getLocalStorage<EditorVersion[]>(VERSIONS_KEY, [])
    setLocalStorage(VERSIONS_KEY, versions.filter(v => v.id !== id))
  }

  clearVersions(): void {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(VERSIONS_KEY)
  }
}
