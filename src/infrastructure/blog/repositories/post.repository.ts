import type { IPostRepository } from '@/domain/blog/ports/post-repository.port'

/**
 * IOC Container for Post Repository
 *
 * Provides singleton instances of repository implementations:
 * - clientPostRepository: ApiPostRepository - HTTP API calls (client-side)
 * - serverPostRepository: FileSystemPostRepository - direct file access (server-side)
 *
 * Consumer decides which implementation to use based on their environment.
 */

let clientInstance: IPostRepository | null = null
let serverInstance: IPostRepository | null = null

/**
 * Get client-side repository (uses API)
 * Safe to use in browser environment
 */
export async function getClientPostRepository(): Promise<IPostRepository> {
  if (!clientInstance) {
    const { ApiPostRepository } = await import('./post.api.repository')
    clientInstance = new ApiPostRepository()
  }
  return clientInstance
}

/**
 * Get server-side repository (uses filesystem)
 * Only works in Node.js environment
 */
export async function getServerPostRepository(): Promise<IPostRepository> {
  if (!serverInstance) {
    const { FileSystemPostRepository } = await import('./post.filesystem.repository')
    serverInstance = new FileSystemPostRepository()
  }
  return serverInstance
}
