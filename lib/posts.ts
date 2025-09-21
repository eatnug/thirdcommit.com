import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import { Post, PostFrontmatter } from './types'
import { markdownToHtml } from './markdown'

const postsDirectory = path.join(process.cwd(), 'content/posts')

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    const html = await markdownToHtml(content)
    const stats = readingTime(content)

    return {
      slug,
      frontmatter: data as PostFrontmatter,
      content,
      html,
      readingTime: stats.text
    }
  } catch {
    return null
  }
}

export async function getAllPosts(): Promise<Post[]> {
  const files = fs.readdirSync(postsDirectory)

  const posts = await Promise.all(
    files
      .filter(file => file.endsWith('.md'))
      .map(async file => {
        const slug = file.replace(/\.md$/, '')
        return getPostBySlug(slug)
      })
  )

  return posts
    .filter((post): post is Post => post !== null)
    .filter(post => !post.frontmatter.draft)
    .sort((a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
    )
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const allPosts = await getAllPosts()
  return allPosts.filter(post =>
    post.frontmatter.tags.includes(tag)
  )
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts()
  const tagSet = new Set<string>()

  posts.forEach(post => {
    post.frontmatter.tags.forEach(tag => tagSet.add(tag))
  })

  return Array.from(tagSet).sort()
}