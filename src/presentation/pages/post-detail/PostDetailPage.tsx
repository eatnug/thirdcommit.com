import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createBlogApi } from '@/domain/blog';
import { getPostRepository } from '@/infrastructure/blog/repositories/post.repository';
import { Header } from '@/presentation/layouts/Header';

const blogApi = createBlogApi(getPostRepository());

export function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => blogApi.getPost(slug!),
    enabled: !!slug,
  });

  useEffect(() => {
    if (post?.title) {
      document.title = `${post.title} | Jake Park`;
    }

    return () => {
      document.title = 'Jake Park - Software Engineer';
    };
  }, [post?.title]);

  useEffect(() => {
    if (isError || (!isLoading && !post)) {
      navigate('/', { replace: true });
    }
  }, [isError, isLoading, post, navigate]);

  if (isLoading) {
    return (
      <div>
        <div className="px-4 md:px-[400px] py-[20px]">
          <Header />
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div>
        <div className="px-4 md:px-[400px] py-[20px]">
          <Header />
          <div>Post not found</div>
        </div>
      </div>
    );
  }

  // Show placeholder content for draft posts
  const isDraft = post.status === 'draft';
  const displayContent = isDraft
    ? '<div style="color: #6b7280; padding: 1rem 0;"><p style="font-size: 2rem; margin: 0;">✍️ing...</p></div>'
    : post.html;

  return (
    <div className="flex flex-col">
      {/* Mobile header */}
      <div className="md:hidden">
        <Header variant="mobile-simple" />
      </div>

      {/* Desktop header */}
      <div className="hidden md:block px-4 md:px-[400px] py-[20px]">
        <Header />
      </div>

      {/* Post content */}
      <div className="px-5 md:px-[400px] py-5 md:py-0 flex flex-col gap-[20px]">
        <article className="prose prose-lg max-w-none">
          <h1>{post.title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 not-prose">
            <time>{new Date(post.created_at).toLocaleDateString()}</time>
            {post.readingTime && <span>· {post.readingTime}</span>}
          </div>
          <div dangerouslySetInnerHTML={{ __html: displayContent }} />
        </article>
      </div>
    </div>
  );
}
