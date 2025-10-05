import type { IPostRepository } from '@/features/blog/core/ports/post-repository.port'
import { FileSystemPostRepository } from './post.filesystem.repository'

/**
 * Repository Provider
 *
 * Provides dependency injection for PostRepository
 */
export const postRepository: IPostRepository = new FileSystemPostRepository()
