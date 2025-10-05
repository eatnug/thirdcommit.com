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
