import type { Post } from '../entities/post.entity'
import type { IPostRepository } from '../ports/post-repository.port'
import { postRepository } from '@/features/blog/data/repositories/post.repository'

export async function getDraftsUseCase(
  repository: IPostRepository = postRepository
): Promise<Post[]> {
  return repository.getPosts()
}
