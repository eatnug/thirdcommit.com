import type { Post } from "@/domain/blog/entities/post.entity";

export interface PostDto {
  frontmatter: {
    id?: string;
    slug?: string;
    title: string;
    status?: 'draft' | 'published';
    created_at: string;
    updated_at?: string;
    published_at?: string | null;
    description?: string;
    // Backward compatibility
    draft?: boolean;
    tags?: string[];
  };
  content: string;
  html: string;
  readingTime: string;
}

/**
 * Convert a single DTO to domain entity
 * Supports backward compatibility with old format (draft boolean)
 */
export function postDtoToDomain(dto: PostDto): Post {
  // Backward compatibility: derive status from draft if status missing
  let status: 'draft' | 'published' = 'published';
  if (dto.frontmatter.status) {
    status = dto.frontmatter.status;
  } else if (dto.frontmatter.draft !== undefined) {
    status = dto.frontmatter.draft ? 'draft' : 'published';
  }

  // Default updated_at to created_at if missing
  const createdAt = new Date(dto.frontmatter.created_at);
  const updatedAt = dto.frontmatter.updated_at
    ? new Date(dto.frontmatter.updated_at)
    : createdAt;

  // Handle published_at
  let publishedAt: Date | null = null;
  if (dto.frontmatter.published_at) {
    publishedAt = new Date(dto.frontmatter.published_at);
  } else if (status === 'published') {
    // If status is published but no published_at, use created_at as fallback
    publishedAt = createdAt;
  }

  return {
    id: dto.frontmatter.id ?? '',
    slug: dto.frontmatter.slug ?? '',
    title: dto.frontmatter.title,
    status,
    created_at: createdAt,
    updated_at: updatedAt,
    published_at: publishedAt,
    description: dto.frontmatter.description ?? "",
    content: dto.content,
    html: dto.html,
    readingTime: dto.readingTime,
  };
}

/**
 * Convert a list of DTOs to domain entities
 */
export function postDtoToDomainList(dtos: PostDto[]): Post[] {
  return dtos.map(postDtoToDomain);
}
