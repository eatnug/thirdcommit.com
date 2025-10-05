import type { IPostRepository } from '@/features/blog/core/ports/post-repository.port'
import { FileSystemPostRepository } from './post.filesystem.repository'
import { ApiPostRepository } from './post.api.repository'

/**
 * Repository Provider
 *
 * Automatically selects the appropriate repository based on environment:
 * - Server-side: FileSystemPostRepository (direct filesystem access)
 * - Client-side: ApiPostRepository (fetch through API endpoints)
 */
const isServer = typeof window === 'undefined'

export const postRepository: IPostRepository = isServer
  ? new FileSystemPostRepository()
  : new ApiPostRepository()
