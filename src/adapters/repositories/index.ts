import type { IPostRepository } from '@/domain/blog/ports/post-repository.port';
import type { IProjectRepository } from '@/domain/projects/ports/project-repository.port';
import { StaticPostRepository } from './post.static.repository';
import { StaticProjectRepository } from './project.static.repository';

// Singleton instances
let postRepository: IPostRepository | null = null;
let projectRepository: IProjectRepository | null = null;

export function getPostRepository(): IPostRepository {
  if (!postRepository) {
    postRepository = new StaticPostRepository();
  }
  return postRepository;
}

export function getProjectRepository(): IProjectRepository {
  if (!projectRepository) {
    projectRepository = new StaticProjectRepository();
  }
  return projectRepository;
}
