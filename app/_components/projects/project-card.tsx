import type { Project } from '@/domain/projects'

export function ProjectCard({ project }: { project: Project }) {
  const CardWrapper = project.externalLink ? 'a' : 'div'
  const linkProps = project.externalLink
    ? {
        href: project.externalLink,
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    : {}

  return (
    <CardWrapper {...linkProps}>
      <div className="border-b border-[#bbbbbb] py-[20px] flex flex-col gap-[10px]">
        <h2 className="text-[25px] font-medium text-black">
          {project.title}
        </h2>
        <p className="text-[18px] text-black">
          {project.description}
        </p>
        {project.externalLink && (
          <p className="text-[15px] text-blue-600 flex items-center gap-1">
            View Project →
          </p>
        )}
      </div>
    </CardWrapper>
  )
}
