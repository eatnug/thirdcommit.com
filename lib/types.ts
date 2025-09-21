export interface PostFrontmatter {
  title: string
  date: string
  tags: string[]
  description?: string
  draft?: boolean
}

export interface Post {
  slug: string
  frontmatter: PostFrontmatter
  content: string
  html: string
  readingTime: string
}