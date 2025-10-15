import type { IPostRepository } from '@/domain/blog/ports/post-repository.port';
import type { Post } from '@/domain/blog/entities/post.entity';

export class StaticPostRepository implements IPostRepository {
  async getPosts(): Promise<Post[]> {
    // In dev mode, use API for real-time updates
    const url = import.meta.env.DEV ? '/api/posts' : '/posts.json';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch posts: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  }

  async getPostById(id: string): Promise<Post | null> {
    const posts = await this.getPosts();
    return posts.find((post) => post.id === id) || null;
  }

  async getPostByTitle(title: string): Promise<Post | null> {
    const posts = await this.getPosts();
    return posts.find((post) => post.title === title) || null;
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    try {
      // In dev mode, use API; in production, use static JSON
      const url = import.meta.env.DEV
        ? `/api/posts/${slug}`
        : `/post-${slug}.json`;

      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      return response.json();
    } catch {
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
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create post');
    }

    return response.json();
  }

  async updatePost(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      content: string;
      status: 'draft' | 'published';
      published_at: Date | null;
    }>
  ): Promise<Post> {
    const response = await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update post');
    }

    return response.json();
  }

  async deletePost(title: string): Promise<void> {
    const response = await fetch(`/api/posts/${title}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete post');
    }
  }
}
