import type { IEditorRepository } from '@/features/editor/core/ports/editor-repository.port'
import { LocalStorageEditorRepository } from './editor.localstorage.repository'

/**
 * Repository Provider
 *
 * This file acts as a provider/factory for the editor repository.
 * Switch implementations here without changing use-cases.
 *
 * Available implementations:
 * - LocalStorageEditorRepository (browser localStorage)
 * - IndexedDBEditorRepository (future: IndexedDB for larger data)
 * - ApiEditorRepository (future: REST API sync)
 */

export const editorRepository: IEditorRepository = new LocalStorageEditorRepository()
