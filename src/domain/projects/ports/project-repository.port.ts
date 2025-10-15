import type { Project } from '../entities/project.entity';

/**
 * Port (interface) for project repository
 * Defines the contract for project data access
 *
 * In hexagonal architecture:
 * - This is a SECONDARY PORT (driven by the application)
 * - Implementations are ADAPTERS (e.g., InMemoryProjectRepository)
 * - Use cases depend on this interface, not concrete implementations
 */
export interface IProjectRepository {
  /**
   * Retrieve all projects from the data source
   */
  getProjects(): Promise<Project[]>;
}
