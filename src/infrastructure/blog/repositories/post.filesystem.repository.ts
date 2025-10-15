import type { Post } from '@/domain/blog/entities/post.entity';
import type { IPostRepository } from '@/domain/blog/ports/post-repository.port';
import {
  type PostDto,
  postDtoToDomain,
} from '@/infrastructure/blog/dto/post.dto';
import { markdownService } from '@/domain/blog/services/markdown.service';
import { ulid } from 'ulid';

/**
 * FileSystem Adapter for Post Repository
 * Implements the IPostRepository port using local filesystem as the data source
 *
 * In hexagonal architecture:
 * - This is a SECONDARY ADAPTER (driven by the application)
 * - Implements the port interface defined in core layer
 * - Can be swapped with other adapters (e.g., ApiPostRepository, CachePostRepository)
 *
 * File Naming Strategy:
 * - New format: {ulid}-{slug}.md (e.g., 01ARZ3NDEKTSV4-my-blog-post.md)
 * - Legacy format: {title}.md (backward compatible)
 */
export class FileSystemPostRepository implements IPostRepository {
  private async getPostsDirectory(): Promise<string> {
    const path = await import('path');
    return path.join(process.cwd(), 'storage/posts');
  }

  /**
   * Generate a URL-friendly slug from a title
   * Supports Korean characters and other Unicode letters
   */
  private slugify(title: string): string {
    return (
      title
        .toLowerCase()
        // Keep Korean, English, numbers, spaces, and hyphens; remove everything else
        .replace(/[^\u3131-\uD79D\w\s-]/g, '')
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/--+/g, '-') // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .trim()
    );
  }

  /**
   * Parse filename to extract ID and slug
   * Returns { id, slug, isLegacy }
   */
  private parseFilename(filename: string): {
    id: string | null;
    slug: string;
    isLegacy: boolean;
  } {
    const nameWithoutExt = filename.replace(/\.md$/, '');

    // Check if it's new format (contains hyphen separator)
    const separatorIndex = nameWithoutExt.indexOf('-');
    if (separatorIndex > 0 && separatorIndex === 26) {
      // ULID is exactly 26 chars
      const potentialId = nameWithoutExt.substring(0, 26);
      const slug = nameWithoutExt.substring(27); // Skip the hyphen
      return { id: potentialId, slug, isLegacy: false };
    }

    // Legacy format: filename is the slug
    return { id: null, slug: nameWithoutExt, isLegacy: true };
  }

  async getPosts(): Promise<Post[]> {
    // Dynamic imports to prevent bundling server-only code in client
    const fs = await import('fs');
    const path = await import('path');
    const postsDirectory = await this.getPostsDirectory();

    if (!fs.existsSync(postsDirectory)) {
      return [];
    }

    const files = fs.readdirSync(postsDirectory);

    const dtos = await Promise.all(
      files
        .filter((file) => file.endsWith('.md'))
        .map(async (file) => {
          const fullPath = path.join(postsDirectory, file);
          return this.readPostFromFile(fullPath, file);
        })
    );

    const validPosts = dtos
      .filter((post): post is Post => post !== null)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    return validPosts;
  }

  /**
   * Read and parse a post file
   */
  private async readPostFromFile(
    fullPath: string,
    filename: string
  ): Promise<Post | null> {
    try {
      const [fs, matter, readingTime] = await Promise.all([
        import('fs'),
        import('gray-matter'),
        import('reading-time'),
      ]);

      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter.default(fileContents);
      const stats = readingTime.default(content);

      const {
        id: parsedId,
        slug: parsedSlug,
        isLegacy,
      } = this.parseFilename(filename);

      const dto: PostDto = {
        frontmatter: {
          id: data.id || parsedId || '',
          slug: data.slug || parsedSlug || '',
          title: data.title,
          status: data.status,
          created_at: data.created_at || data.date,
          updated_at: data.updated_at,
          published_at: data.published_at,
          tags: data.tags, // Backward compatibility - keep for old posts
          description: data.description,
          draft: data.draft, // Backward compatibility
        },
        content,
        html: await markdownService.toHtml(content),
        readingTime: stats.text,
      };

      if (isLegacy) {
        console.warn(
          `Legacy post format detected: ${filename}. Consider migrating to new format.`
        );
      }

      return postDtoToDomain(dto);
    } catch (error) {
      console.error(`Error reading post file ${filename}:`, error);
      return null;
    }
  }

  async getPostById(id: string): Promise<Post | null> {
    try {
      const [fs, path] = await Promise.all([import('fs'), import('path')]);
      const postsDirectory = await this.getPostsDirectory();

      if (!fs.existsSync(postsDirectory)) {
        return null;
      }

      // Find file starting with the ID
      const files = fs.readdirSync(postsDirectory);
      const matchingFile = files.find((file) => file.startsWith(`${id}-`));

      if (!matchingFile) {
        return null;
      }

      const fullPath = path.join(postsDirectory, matchingFile);
      return this.readPostFromFile(fullPath, matchingFile);
    } catch (error) {
      console.error(`Error getting post by ID ${id}:`, error);
      return null;
    }
  }

  async getPostByTitle(title: string): Promise<Post | null> {
    try {
      const [fs, path] = await Promise.all([import('fs'), import('path')]);
      const postsDirectory = await this.getPostsDirectory();
      const fullPath = path.join(postsDirectory, `${title}.md`);

      if (!fs.existsSync(fullPath)) {
        return null;
      }

      return this.readPostFromFile(fullPath, `${title}.md`);
    } catch (error) {
      console.error(`Error getting post by title ${title}:`, error);
      return null;
    }
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    try {
      // First try to find by filename (for both new and legacy formats)
      const posts = await this.getPosts();
      return posts.find((post) => post.slug === slug) || null;
    } catch (error) {
      console.error(`Error getting post by slug ${slug}:`, error);
      return null;
    }
  }

  async createPost(data: {
    title: string;
    description?: string;
    content: string;
    status: 'draft' | 'published';
  }): Promise<{
    id: string;
    slug: string;
    title: string;
    status: 'draft' | 'published';
    filename: string;
    path: string;
  }> {
    // Dynamic imports to prevent bundling server-only code in client
    const [fs, path] = await Promise.all([import('fs'), import('path')]);

    // Generate ULID and slug
    const id = ulid();
    const slug = this.slugify(data.title);
    const filename = `${id}-${slug}.md`;

    const now = new Date().toISOString();
    const frontmatter = `---
id: "${id}"
slug: "${slug}"
title: "${data.title}"
status: "${data.status}"
created_at: "${now}"
updated_at: "${now}"
published_at: ${data.status === 'published' ? `"${now}"` : 'null'}
${data.description ? `description: "${data.description}"` : ''}
---

${data.content}
`;

    const postsDir = await this.getPostsDirectory();

    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }

    const filePath = path.join(postsDir, filename);

    if (fs.existsSync(filePath)) {
      throw new Error(`Post with ID "${id}" already exists`);
    }

    fs.writeFileSync(filePath, frontmatter, 'utf-8');

    return {
      id,
      slug,
      title: data.title,
      status: data.status,
      filename,
      path: filePath,
    };
  }

  async updatePost(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      tags: string[];
      content: string;
      status: 'draft' | 'published';
      published_at: Date | null;
    }>
  ): Promise<Post> {
    const [fs, path, matter] = await Promise.all([
      import('fs'),
      import('path'),
      import('gray-matter'),
    ]);

    const postsDirectory = await this.getPostsDirectory();

    // Find existing file
    const files = fs.readdirSync(postsDirectory);
    const matchingFile = files.find((file) => file.startsWith(`${id}-`));

    if (!matchingFile) {
      throw new Error(`Post with ID "${id}" not found`);
    }

    const oldFilePath = path.join(postsDirectory, matchingFile);
    const fileContents = fs.readFileSync(oldFilePath, 'utf8');
    const { data: existingFrontmatter, content: existingContent } =
      matter.default(fileContents);

    // Merge updates with existing data
    const updatedSlug = data.title
      ? this.slugify(data.title)
      : existingFrontmatter.slug;
    const updatedContent =
      data.content !== undefined ? data.content : existingContent;

    // Update frontmatter
    const updatedFrontmatter = {
      ...existingFrontmatter,
      ...(data.title && { title: data.title }),
      ...(data.title && { slug: updatedSlug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status && { status: data.status }),
      ...(data.published_at !== undefined && {
        published_at: data.published_at?.toISOString() || null,
      }),
      updated_at: new Date().toISOString(),
    };

    // Check if filename needs to change (title changed)
    const oldSlug = this.parseFilename(matchingFile).slug;
    const newFilename = `${id}-${updatedSlug}.md`;
    const newFilePath = path.join(postsDirectory, newFilename);

    // Build new file content
    const newFileContent = matter.default.stringify(
      updatedContent,
      updatedFrontmatter
    );

    // Write to file (rename if needed)
    if (oldSlug !== updatedSlug) {
      // Rename file
      fs.writeFileSync(newFilePath, newFileContent, 'utf-8');
      fs.unlinkSync(oldFilePath);
    } else {
      // Overwrite existing file
      fs.writeFileSync(oldFilePath, newFileContent, 'utf-8');
    }

    // Read back and return the updated post
    const updated = await this.getPostById(id);
    if (!updated) {
      throw new Error('Failed to read updated post');
    }

    return updated;
  }

  async deletePost(title: string): Promise<void> {
    const [fs, path] = await Promise.all([import('fs'), import('path')]);

    const postsDir = await this.getPostsDirectory();
    const filePath = path.join(postsDir, `${title}.md`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Post "${title}" not found`);
    }

    fs.unlinkSync(filePath);
  }
}
