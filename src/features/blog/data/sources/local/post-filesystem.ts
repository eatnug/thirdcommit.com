import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import type { PostDto } from '@/features/blog/data/models/post.model'

const postsDirectory = path.join(process.cwd(), 'src/storage/posts')

export class PostFileSystem {
  async getPostBySlug(slug: string): Promise<PostDto | null> {
    try {
      const fullPath = path.join(postsDirectory, `${slug}.md`)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)
      const stats = readingTime(content)

      return {
        slug,
        frontmatter: {
          title: data.title,
          date: data.date,
          tags: data.tags || [],
          description: data.description,
          draft: data.draft || false,
        },
        content,
        html: '', // Will be processed by markdown service
        readingTime: stats.text,
      }
    } catch {
      return null
    }
  }

  async getAllPosts(): Promise<PostDto[]> {
    const files = fs.readdirSync(postsDirectory)

    const posts = await Promise.all(
      files
        .filter(file => file.endsWith('.md'))
        .map(async file => {
          const slug = file.replace(/\.md$/, '')
          return this.getPostBySlug(slug)
        })
    )

    return posts
      .filter((post): post is PostDto => post !== null)
      .sort((a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
      )
  }

  async createPost(data: {
    title: string
    description?: string
    tags: string[]
    content: string
    draft: boolean
  }): Promise<{ slug: string; filename: string; path: string }> {
    const slug = this.generateSlug(data.title)
    const date = new Date().toISOString().split('T')[0]
    const filename = `${slug}.md`

    const frontmatter = `---
title: "${data.title}"
date: "${date}"
tags: ${JSON.stringify(data.tags)}
${data.description ? `description: "${data.description}"` : ''}
draft: ${data.draft}
---

${data.content}
`

    const postsDir = path.join(process.cwd(), 'src/storage', 'posts')

    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true })
    }

    const filePath = path.join(postsDir, filename)

    if (fs.existsSync(filePath)) {
      throw new Error(`File ${filename} already exists`)
    }

    fs.writeFileSync(filePath, frontmatter, 'utf-8')

    return {
      slug,
      filename,
      path: filePath,
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
}

export const postFileSystem = new PostFileSystem()
