import type { PostFormData } from '../entities/post.entity'
import type { IPostRepository } from '../ports/post-repository.port'
import { postRepository } from '@/features/blog/data/repositories/post.repository'

export async function loadPostAsFormUseCase(
  slug: string,
  repository: IPostRepository = postRepository
): Promise<PostFormData | null> {
  const post = await repository.getPostBySlug(slug)

  if (!post) {
    return null
  }

  return {
    title: post.title,
    description: post.description || '',
    tags: post.tags.join(', '),
    content: post.content,
    draft: post.draft,
  }
}
