import type { Post } from "@/features/blog/core/entities/post.entity";

export interface PostDto {
  slug: string;
  frontmatter: {
    title: string;
    date: string;
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
    slug: dto.slug,
    title: dto.frontmatter.title,
    date: new Date(dto.frontmatter.date),
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
