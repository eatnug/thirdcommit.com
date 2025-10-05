import type { IPostRepository } from '@/features/blog/core/ports/post-repository.port'
import { FileSystemPostRepository } from './post.filesystem.repository'

/**
 * Repository Provider
 *
 * This file acts as a provider/factory for the post repository.
 * Switch implementations here without changing use-cases.
 *
 * Available implementations:
 * - FileSystemPostRepository (local markdown files)
 * - ApiPostRepository (future: REST API)
 * - CachePostRepository (future: cached wrapper)
 */

export const postRepository: IPostRepository = new FileSystemPostRepository()
