import type { Post } from '@/domain/blog/entities/post.entity'
import type { IPostRepository } from '@/domain/blog/ports/post-repository.port'
import { type PostDto, postDtoToDomain } from '@/infrastructure/blog/dto/post.dto'
import { markdownService } from '@/domain/blog/services/markdown.service'

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
    return path.join(process.cwd(), 'storage/posts')
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
          const title = file.replace(/\.md$/, '')
          return this.getPostByTitle(title)
        })
    )

    const validPosts = dtos
      .filter((post): post is Post => post !== null)
      .sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

    return validPosts
  }

  async getPostByTitle(title: string): Promise<Post | null> {
    try {
      // Dynamic imports to prevent bundling server-only code in client
      const [fs, path, matter, readingTime] = await Promise.all([
        import('fs'),
        import('path'),
        import('gray-matter'),
        import('reading-time')
      ])

      const postsDirectory = await this.getPostsDirectory()
      const fullPath = path.join(postsDirectory, `${title}.md`)

      if (!fs.existsSync(fullPath)) {
        return null
      }

      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter.default(fileContents)
      const stats = readingTime.default(content)

      const dto: PostDto = {
        frontmatter: {
          title: data.title,
          created_at: data.created_at || data.date, // fallback for old posts
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

  // Keep for backward compatibility
  async getPostBySlug(slug: string): Promise<Post | null> {
    return this.getPostByTitle(slug)
  }

  async createPost(data: {
    title: string
    description?: string
    tags: string[]
    content: string
    draft: boolean
  }): Promise<{ title: string; filename: string; path: string }> {
    // Dynamic imports to prevent bundling server-only code in client
    const [fs, path] = await Promise.all([
      import('fs'),
      import('path')
    ])

    const filename = `${data.title}.md`

    const frontmatter = `---
title: "${data.title}"
created_at: "${new Date().toISOString()}"
tags: ${JSON.stringify(data.tags)}
${data.description ? `description: "${data.description}"` : ''}
draft: ${data.draft}
---

${data.content}
`

    const postsDir = await this.getPostsDirectory()

    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true })
    }

    const filePath = path.join(postsDir, filename)

    if (fs.existsSync(filePath)) {
      throw new Error(`Post with title "${data.title}" already exists`)
    }

    fs.writeFileSync(filePath, frontmatter, 'utf-8')

    return {
      title: data.title,
      filename,
      path: filePath,
    }
  }

  async deletePost(title: string): Promise<void> {
    const [fs, path] = await Promise.all([
      import('fs'),
      import('path')
    ])

    const postsDir = await this.getPostsDirectory()
    const filePath = path.join(postsDir, `${title}.md`)

    if (!fs.existsSync(filePath)) {
      throw new Error(`Post "${title}" not found`)
    }

    fs.unlinkSync(filePath)
  }
}
