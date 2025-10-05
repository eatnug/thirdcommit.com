export interface Draft {
  slug: string
  title: string
  date: string
  tags: string[]
  description?: string
  content: string
  draft: boolean
  contentPreview: string
}

export interface DraftFormData {
  title: string
  description: string
  tags: string
  content: string
  draft: boolean
}
