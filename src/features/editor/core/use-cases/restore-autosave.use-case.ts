import type { AutosaveDraft } from '@/features/editor/core/entities/editor.entity'
import { editorRepository } from '@/features/editor/data/repositories/editor.repository'

export async function restoreAutosaveUseCase(): Promise<AutosaveDraft | null> {
  return await editorRepository.getAutosave()
}
