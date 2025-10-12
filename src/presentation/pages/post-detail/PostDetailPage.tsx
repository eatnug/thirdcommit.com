import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { createBlogApi } from '@/domain/blog';
import { getPostRepository } from '@/infrastructure/blog/repositories/post.repository';
import { markdownService } from '@/domain/blog/services/markdown.service';
import { Header } from '@/presentation/layouts/Header';
import { TableOfContents } from '@/presentation/components/TableOfContents';

const blogApi = createBlogApi(getPostRepository());

export function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [html, setHtml] = useState<string>('');

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => blogApi.getPost(slug!),
    enabled: !!slug,
  });

  // Convert markdown to HTML on client-side
  useEffect(() => {
    if (post?.content) {
      markdownService.toHtml(post.content).then(setHtml);
    }
  }, [post?.content]);

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
    : html;

  return (
    <div className="flex flex-col">
      {/* Mobile header */}
      <div className="md:hidden">
        <Header variant="mobile-simple" />
      </div>

      {/* Desktop header */}
      <div className="hidden md:flex justify-center px-4 py-[20px]">
        <div className="w-full max-w-[700px]">
          <Header />
        </div>
      </div>

      {/* Post content with ToC */}
      <div className="flex justify-center gap-8 px-5 py-5">
        {/* Left spacer (Desktop Only, ≥1280px) - same width as ToC for centering */}
        {!isDraft && <div className="hidden xl:block w-[250px] shrink-0" />}

        {/* Main Content */}
        <article className="prose prose-lg max-w-[700px] w-full">
          <h1 id="title">{post.title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 not-prose">
            <time>{new Date(post.created_at).toLocaleDateString()}</time>
            {post.readingTime && <span>· {post.readingTime}</span>}
          </div>
          <div dangerouslySetInnerHTML={{ __html: displayContent }} />
        </article>

        {/* ToC Sidebar (Desktop Only, ≥1280px) */}
        {!isDraft && (
          <aside className="hidden xl:block w-[250px] shrink-0">
            <TableOfContents htmlContent={displayContent} postTitle={post.title} />
          </aside>
        )}
      </div>
    </div>
  );
}
