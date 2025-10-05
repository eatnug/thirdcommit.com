import type { Post } from '@/features/blog/core/entities/post.entity'
import type { IPostRepository } from '@/features/blog/core/ports/post-repository.port'
import { type PostDto, postDtoToDomain } from '@/features/blog/data/models/post.model'
import { markdownService } from '@/shared/services/markdown.service'

/**
 * FileSystem Adapter for Post Repository
 * Implements the IPostRepository port using local filesystem as the data source
 *
 * In hexagonal architecture:
 * - This is a SECONDARY ADAPTER (driven by the application)
 * - Implements the port interface defined in core layer
 * - Can be swapped with other adapters (e.g., ApiPostRepository, CachePostRepository)
 */
export class FileSystemPostRepository implements IPostRepository {
  private async getPostsDirectory(): Promise<string> {
    const path = await import('path')
    return path.join(process.cwd(), 'src/storage/posts')
  }

  async getPosts(): Promise<Post[]> {
    // Dynamic imports to prevent bundling server-only code in client
    const fs = await import('fs')
    const postsDirectory = await this.getPostsDirectory()

    const files = fs.readdirSync(postsDirectory)

    const dtos = await Promise.all(
      files
        .filter(file => file.endsWith('.md'))
        .map(async file => {
          const slug = file.replace(/\.md$/, '')
          return this.getPostBySlug(slug)
        })
    )

    const validPosts = dtos
      .filter((post): post is Post => post !== null)
      .sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )

    return validPosts
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    try {
      // Dynamic imports to prevent bundling server-only code in client
      const [fs, path, matter, readingTime] = await Promise.all([
        import('fs'),
        import('path'),
        import('gray-matter'),
        import('reading-time')
      ])

      const postsDirectory = await this.getPostsDirectory()
      const fullPath = path.join(postsDirectory, `${slug}.md`)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter.default(fileContents)
      const stats = readingTime.default(content)

      const dto: PostDto = {
        slug,
        frontmatter: {
          title: data.title,
          date: data.date,
          tags: data.tags || [],
          description: data.description,
          draft: data.draft || false,
        },
        content,
        html: await markdownService.toHtml(content),
        readingTime: stats.text,
      }

      return postDtoToDomain(dto)
    } catch {
      return null
    }
  }

  async createPost(data: {
    title: string
    description?: string
    tags: string[]
    content: string
    draft: boolean
  }): Promise<{ slug: string; filename: string; path: string }> {
    // Dynamic imports to prevent bundling server-only code in client
    const [fs, path] = await Promise.all([
      import('fs'),
      import('path')
    ])

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

  async deletePost(slug: string): Promise<void> {
    const [fs, path] = await Promise.all([
      import('fs'),
      import('path')
    ])

    const postsDir = path.join(process.cwd(), 'src/storage', 'posts')
    const filePath = path.join(postsDir, `${slug}.md`)

    if (!fs.existsSync(filePath)) {
      throw new Error(`Post ${slug} not found`)
    }

    fs.unlinkSync(filePath)
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
}
