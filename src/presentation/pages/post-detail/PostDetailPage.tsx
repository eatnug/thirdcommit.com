import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createBlogApi } from '@/domain/blog';
import { getPostRepository } from '@/adapters/repositories';
import { Header } from '@/presentation/layouts/Header';

const blogApi = createBlogApi(getPostRepository());

export function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => blogApi.getPost(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="px-4 md:px-[400px] py-[20px]">
        <Header />
        <div>Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="px-4 md:px-[400px] py-[20px]">
        <Header />
        <div>Post not found</div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-[400px] py-[20px] flex flex-col gap-[20px]">
      <Header />
      <article className="prose prose-lg max-w-none">
        <h1>{post.title}</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 not-prose">
          <time>{new Date(post.created_at).toLocaleDateString()}</time>
          {post.readingTime && <span>· {post.readingTime}</span>}
        </div>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
    </div>
  );
}
