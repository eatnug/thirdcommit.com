import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Post } from '@/domain/blog/entities/post.entity';
import type { Project } from '@/domain/projects/entities/project.entity';

type TabValue = 'blog' | 'about';

interface TabsUIProps {
  posts: Post[];
  projects: Project[];
}

function getValidTab(params: { tab?: string }): TabValue {
  if (params.tab === 'blog' || params.tab === 'about') {
    return params.tab;
  }
  return 'blog';
}

export function TabsUI({ posts, projects }: TabsUIProps) {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabValue>('blog');

  // Sync state with URL changes (browser back/forward)
  useEffect(() => {
    const tab = getValidTab({ tab: searchParams.get('tab') || undefined });
    setActiveTab(tab);
  }, [searchParams]);

  return (
    <>
      <div id="panel-about" className={activeTab === 'about' ? '' : 'hidden'}>
        <div className="flex flex-col gap-[20px]">
          {projects.map((project) => (
            <div key={project.title}>
              <h3 className="text-lg font-semibold">{project.title}</h3>
              <p className="text-sm text-gray-600">{project.description}</p>
              {project.externalLink && (
                <a href={project.externalLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                  View Project →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <div id="panel-blog" className={activeTab === 'blog' ? '' : 'hidden'}>
        <div className="flex flex-col">
          {posts.map((post, index) => (
            <div key={post.id}>
              {index > 0 && <div className="border-t border-gray-200 my-[20px]" />}
              <a href={`/posts/${post.slug}`} className="block group">
                <div className="flex flex-col gap-[10px]">
                  <h2 className="text-[20px] font-medium group-hover:underline">{post.title}</h2>
                  {post.description && (
                    <p className="text-[15px] text-gray-600">{post.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                    <time>{new Date(post.created_at).toLocaleDateString()}</time>
                    {post.readingTime && <span>· {post.readingTime}</span>}
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
