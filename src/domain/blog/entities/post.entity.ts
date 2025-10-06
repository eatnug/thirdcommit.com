export interface Post {
  id: string
  slug: string
  title: string
  status: 'draft' | 'published'
  created_at: Date
  updated_at: Date
  published_at: Date | null
  description: string
  content: string
  html: string
  readingTime: string
}

export interface PostFormData {
  id?: string
  title: string
  description: string
  content: string
  status: 'draft' | 'published'
}
