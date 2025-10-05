import { editorRepository } from '@/features/editor/data/repositories/editor.repository'

export async function clearAutosaveUseCase(): Promise<void> {
  await editorRepository.clearAutosave()
}
