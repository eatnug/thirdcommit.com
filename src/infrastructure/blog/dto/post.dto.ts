import type { Post } from "@/domain/blog/entities/post.entity";

export interface PostDto {
  frontmatter: {
    title: string;
    created_at: string;
    tags: string[];
    description?: string;
    draft?: boolean;
  };
  content: string;
  html: string;
  readingTime: string;
}

/**
 * Convert a single DTO to domain entity
 */
export function postDtoToDomain(dto: PostDto): Post {
  return {
    title: dto.frontmatter.title,
    created_at: new Date(dto.frontmatter.created_at),
    tags: dto.frontmatter.tags,
    description: dto.frontmatter.description ?? "",
    content: dto.content,
    html: dto.html,
    readingTime: dto.readingTime,
    draft: dto.frontmatter.draft ?? false,
  };
}

/**
 * Convert a list of DTOs to domain entities
 */
export function postDtoToDomainList(dtos: PostDto[]): Post[] {
  return dtos.map(postDtoToDomain);
}
