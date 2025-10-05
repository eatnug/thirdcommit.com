import type { IPostRepository } from '../ports/post-repository.port'
import { postRepository } from '@/features/blog/data/repositories/post.repository'

export async function deletePostUseCase(
  slug: string,
  repository: IPostRepository = postRepository
): Promise<void> {
  return repository.deletePost(slug)
}
