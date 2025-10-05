import { getLocalStorage, setLocalStorage } from '@/shared/utils/local-storage'
import type { AutosaveDraft, EditorVersion, EditorState } from '@/features/editor/core/entities/editor.entity'

const AUTOSAVE_KEY = 'post-editor-autosave'
const VERSIONS_KEY = 'post-editor-versions'

export class EditorStorage {
  getAutosave(): AutosaveDraft | null {
    return getLocalStorage<AutosaveDraft | null>(AUTOSAVE_KEY, null)
  }

  setAutosave(draft: AutosaveDraft): void {
    setLocalStorage(AUTOSAVE_KEY, draft)
  }

  clearAutosave(): void {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(AUTOSAVE_KEY)
  }

  getVersions(): EditorVersion[] {
    return getLocalStorage<EditorVersion[]>(VERSIONS_KEY, [])
  }

  addVersion(version: EditorVersion): void {
    const versions = this.getVersions()
    setLocalStorage(VERSIONS_KEY, [version, ...versions])
  }

  removeVersion(id: string): void {
    const versions = this.getVersions()
    setLocalStorage(VERSIONS_KEY, versions.filter(v => v.id !== id))
  }

  clearVersions(): void {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(VERSIONS_KEY)
  }

  getState(): EditorState {
    return {
      autosave: this.getAutosave(),
      versions: this.getVersions(),
    }
  }
}

export const editorStorage = new EditorStorage()
