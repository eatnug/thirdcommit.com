export interface Post {
  slug: string
  title: string
  date: Date
  tags: string[]
  description: string
  content: string
  html: string
  readingTime: string
  draft: boolean
}

export interface PostFormData {
  title: string
  description: string
  tags: string
  content: string
  draft: boolean
}
