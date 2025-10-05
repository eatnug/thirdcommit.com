import type { EditorVersion } from '@/features/editor/core/entities/editor.entity'
import { editorRepository } from '@/features/editor/data/repositories/editor.repository'

export async function getEditorVersionsUseCase(): Promise<EditorVersion[]> {
  return await editorRepository.getVersions()
}

export async function addEditorVersionUseCase(version: EditorVersion): Promise<void> {
  await editorRepository.addVersion(version)
}
