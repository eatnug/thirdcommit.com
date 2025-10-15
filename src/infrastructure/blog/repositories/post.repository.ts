import type { IPostRepository } from '@/domain/blog/ports/post-repository.port';
import { StaticPostRepository } from './post.static.repository';

/**
 * IOC Container for Post Repository
 *
 * Returns appropriate repository based on environment:
 * - DEV: StaticPostRepository with /api proxy
 * - PROD: StaticPostRepository with static JSON
 */

let instance: IPostRepository | null = null;

export function getPostRepository(): IPostRepository {
  if (!instance) {
    instance = new StaticPostRepository();
  }
  return instance;
}
