import type { Post } from '@/core/entities/post.entity'
import { PostMapper } from '@/data/mappers/post.mapper'
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
    const { postFileSystem } = await import('@/data/sources/local/post-filesystem')
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
    const { postFileSystem } = await import('@/data/sources/local/post-filesystem')
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
    const { postFileSystem } = await import('@/data/sources/local/post-filesystem')
    return postFileSystem.createPost(data)
  }
}

export const postRepository = new PostRepository()
