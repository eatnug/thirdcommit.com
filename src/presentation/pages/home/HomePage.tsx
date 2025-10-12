import { useQuery } from '@tanstack/react-query';
import { createBlogApi } from '@/domain/blog';
import { createProjectsApi } from '@/domain/projects';
import { getPostRepository } from '@/infrastructure/blog/repositories/post.repository';
import { getProjectRepository } from '@/infrastructure/projects/repositories/project.repository';
import { TabsUI } from '@/presentation/components/tabs/TabsUI';
import { Header } from '@/presentation/layouts/Header';

const blogApi = createBlogApi(getPostRepository());
const projectsApi = createProjectsApi(getProjectRepository());

export function HomePage() {
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => blogApi.getPosts(),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
  });

  if (postsLoading || projectsLoading) {
    return (
      <div className="px-4 py-[20px] flex flex-col items-center">
        <div className="w-full max-w-[700px]">
          <Header />
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-[20px] flex flex-col gap-[20px] items-center">
      <div className="w-full max-w-[700px] flex flex-col gap-[40px]">
        <Header />
        <TabsUI posts={posts} projects={projects} />
      </div>
    </div>
  );
}
