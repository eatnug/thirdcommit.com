import type { Post } from '@/core/entities/post.entity'
import type { PostDto } from '@/data/models/post.model'

export class PostMapper {
  static toDomain(dto: PostDto): Post {
    return {
      slug: dto.slug,
      title: dto.frontmatter.title,
      date: new Date(dto.frontmatter.date),
      tags: dto.frontmatter.tags,
      description: dto.frontmatter.description ?? '',
      content: dto.content,
      html: dto.html,
      readingTime: dto.readingTime,
      draft: dto.frontmatter.draft ?? false,
    }
  }

  static toDomainList(dtos: PostDto[]): Post[] {
    return dtos.map(this.toDomain)
  }
}
