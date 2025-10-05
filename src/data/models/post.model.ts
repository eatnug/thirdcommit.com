export interface PostDto {
  slug: string
  frontmatter: {
    title: string
    date: string
    tags: string[]
    description?: string
    draft?: boolean
  }
  content: string
  html: string
  readingTime: string
}
