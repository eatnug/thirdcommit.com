import type { IPostRepository } from '@/domain/blog/ports/post-repository.port'
import { FileSystemPostRepository } from './post.filesystem.repository'

/**
 * Repository Provider
 *
 * Provides dependency injection for PostRepository
 */
export const postRepository: IPostRepository = new FileSystemPostRepository()
