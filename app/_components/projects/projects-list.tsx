import type { Project } from '@/domain/projects'
import { ProjectCard } from './project-card'

export function ProjectsList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No projects yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {projects.map((project) => (
        <ProjectCard key={project.title} project={project} />
      ))}
    </div>
  )
}
