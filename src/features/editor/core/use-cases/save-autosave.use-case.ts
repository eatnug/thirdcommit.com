import type { AutosaveDraft } from '@/features/editor/core/entities/editor.entity'
import { editorRepository } from '@/features/editor/data/repositories/editor.repository'

export async function saveAutosaveUseCase(draft: AutosaveDraft): Promise<void> {
  await editorRepository.saveAutosave(draft)
}
