import type { IProjectRepository } from '@/domain/projects'
import { InMemoryProjectRepository } from './project.inmemory.repository'

let instance: IProjectRepository | null = null

export function getProjectRepository(): IProjectRepository {
  if (!instance) {
    instance = new InMemoryProjectRepository()
  }
  return instance
}
