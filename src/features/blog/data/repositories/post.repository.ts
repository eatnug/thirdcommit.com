import type { Post } from '@/features/blog/core/entities/post.entity'
import { PostMapper } from '@/features/blog/data/mappers/post.mapper'
import { markdownService } from '@/shared/services/markdown.service'

export interface IPostRepository {
  getPosts(): Promise<Post[]>
  getPostBySlug(slug: string): Promise<Post | null>
  createPost(data: {
    title: string
    description?: string
    tags: string[]
    content: string
    draft: boolean
  }): Promise<{ slug: string; filename: string; path: string }>
}

export class PostRepository implements IPostRepository {
  async getPosts(): Promise<Post[]> {
    // Dynamic import to prevent bundling server-only code (fs, path) in client
    // Repository can be imported anywhere, but source is only loaded at runtime on server
    const { postFileSystem } = await import('@/features/blog/data/sources/local/post-filesystem')
    const dtos = await postFileSystem.getAllPosts()

    // Process HTML for all posts
    const postsWithHtml = await Promise.all(
      dtos.map(async dto => {
        const html = await markdownService.toHtml(dto.content)
        return { ...dto, html }
      })
    )

    return PostMapper.toDomainList(postsWithHtml)
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    // Dynamic import to prevent bundling server-only code (fs, path) in client
    const { postFileSystem } = await import('@/features/blog/data/sources/local/post-filesystem')
    const dto = await postFileSystem.getPostBySlug(slug)
    if (!dto) return null

    const html = await markdownService.toHtml(dto.content)
    return PostMapper.toDomain({ ...dto, html })
  }

  async createPost(data: {
    title: string
    description?: string
    tags: string[]
    content: string
    draft: boolean
  }): Promise<{ slug: string; filename: string; path: string }> {
    // Dynamic import to prevent bundling server-only code (fs, path) in client
    const { postFileSystem } = await import('@/features/blog/data/sources/local/post-filesystem')
    return postFileSystem.createPost(data)
  }
}

export const postRepository = new PostRepository()
