import type { AutosaveDraft, EditorVersion } from '@/features/editor/core/entities/editor.entity'

/**
 * Port (interface) for editor repository
 * Defines the contract for editor data access
 *
 * In hexagonal architecture:
 * - This is a SECONDARY PORT (driven by the application)
 * - Implementations are ADAPTERS (e.g., LocalStorageEditorRepository, IndexedDBEditorRepository)
 * - Use cases depend on this interface, not concrete implementations
 */
export interface IEditorRepository {
  /**
   * Retrieve autosaved draft
   */
  getAutosave(): Promise<AutosaveDraft | null>

  /**
   * Save draft as autosave
   */
  saveAutosave(draft: AutosaveDraft): Promise<void>

  /**
   * Clear autosaved draft
   */
  clearAutosave(): Promise<void>

  /**
   * Retrieve all editor versions
   */
  getVersions(): Promise<EditorVersion[]>

  /**
   * Add a new version to history
   */
  addVersion(version: EditorVersion): Promise<void>
}
