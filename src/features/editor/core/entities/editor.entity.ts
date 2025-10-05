export interface AutosaveDraft {
  title: string
  description: string
  tags: string
  content: string
  draft: boolean
  timestamp: number
}

export interface EditorVersion {
  id: string
  title: string
  content: string
  description: string
  tags: string
  draft: boolean
  timestamp: number
}

export interface EditorState {
  autosave: AutosaveDraft | null
  versions: EditorVersion[]
}
