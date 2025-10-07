import type { IProjectRepository } from '../ports/project-repository.port'
import type { Project } from '../entities/project.entity'

export async function getProjectsUseCase(
  repository: IProjectRepository
): Promise<Project[]> {
  return repository.getProjects()
}
