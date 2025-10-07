/**
 * Projects Feature - Public API
 *
 * This is the single entry point for the projects feature.
 * All consumers should import from here, not from internal files.
 *
 * In volatility-based architecture:
 * - This file acts as a PUBLIC API CONTRACT
 * - Internal structure can change without breaking consumers
 * - Provides both pre-wired convenience API and granular imports for testing
 */

// ============================================================================
// ENTITIES (TIER 3 - STABLE)
// ============================================================================
export type { Project } from './entities/project.entity'

// ============================================================================
// USE CASES (TIER 3 - STABLE)
// ============================================================================
export { getProjectsUseCase } from './use-cases/get-projects.use-case'

// ============================================================================
// PORTS (TIER 3 - STABLE)
// For dependency injection in tests
// ============================================================================
export type { IProjectRepository } from './ports/project-repository.port'

// ============================================================================
// REPOSITORY EXPORTS (IOC Container)
// Removed - repositories now in adapters layer
// Import from @/adapters/repositories instead
// ============================================================================

// ============================================================================
// CONVENIENCE API (Server-side only)
// ============================================================================
import type { IProjectRepository } from './ports/project-repository.port'
import { getProjectsUseCase } from './use-cases/get-projects.use-case'

/**
 * Projects API Factory
 *
 * Creates a projects API instance with injected repository.
 * Consumers decide which repository implementation to use based on their environment.
 *
 * Example usage:
 * ```typescript
 * // Server Component
 * import { createProjectsApi, getProjectRepository } from '@/domain/projects'
 *
 * export default async function HomePage() {
 *   const repository = getProjectRepository()
 *   const projects = createProjectsApi(repository)
 *   const projectList = await projects.getProjects()
 *   return <ProjectsList projects={projectList} />
 * }
 * ```
 */
export function createProjectsApi(repository: IProjectRepository) {
  return {
    getProjects: () => getProjectsUseCase(repository),
  }
}
