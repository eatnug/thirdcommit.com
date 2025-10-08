import type { IProjectRepository } from "@/domain/projects/ports/project-repository.port";
import type { Project } from "@/domain/projects/entities/project.entity";

export class StaticProjectRepository implements IProjectRepository {
  async getProjects(): Promise<Project[]> {
    const response = await fetch("/projects.json");
    if (!response.ok) {
      throw new Error(
        `Failed to fetch projects: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  }
}
