import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { createBlogApi } from '@/domain/blog';
import { getPostRepository } from '@/infrastructure/blog/repositories/post.repository';
import { markdownService } from '@/domain/blog/services/markdown.service';
import { Header } from '@/presentation/layouts/Header';
import {
  TableOfContents,
  TableOfContentsSkeleton,
} from '@/presentation/components/TableOfContents';
import { ArticleSkeleton } from '@/presentation/components/ArticleSkeleton';

const blogApi = createBlogApi(getPostRepository());

export function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [html, setHtml] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const {
    data: post,
    isLoading,
    isError,
  } = useQuery({
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
      <div className="flex flex-col">
        {isMobile ? (
          <Header variant="mobile-simple" />
        ) : (
          <div className="flex justify-center px-4 py-[20px]">
            <div className="w-full max-w-[700px]">
              <Header />
            </div>
          </div>
        )}

        <div className="flex justify-center gap-8 px-5 py-5">
          <div className="hidden xl:block w-[250px] shrink-0" />
          <ArticleSkeleton />
          <aside className="hidden xl:block w-[250px] shrink-0">
            <TableOfContentsSkeleton />
          </aside>
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
      {isMobile ? (
        <Header variant="mobile-simple" />
      ) : (
        <div className="flex justify-center px-4 py-[20px]">
          <div className="w-full max-w-[700px]">
            <Header />
          </div>
        </div>
      )}

      <div className="flex justify-center gap-8 px-5 py-5">
        {!isDraft && <div className="hidden xl:block w-[250px] shrink-0" />}

        <article className="prose prose-lg max-w-[700px] w-full [&_h2]:text-[1.375rem] [&_h2]:mt-6 [&_h2]:mb-3 md:[&_h2]:text-[1.5rem] md:[&_h2]:mt-8 md:[&_h2]:mb-4">
          <h1 id="title" className="!text-2xl md:!text-3xl">
            {post.title}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 not-prose">
            <time>{new Date(post.created_at).toLocaleDateString()}</time>
            {post.readingTime && <span>· {post.readingTime}</span>}
          </div>
          <div dangerouslySetInnerHTML={{ __html: displayContent }} />
        </article>

        {!isDraft && (
          <aside className="hidden xl:block w-[250px] shrink-0">
            <TableOfContents
              htmlContent={displayContent}
              postTitle={post.title}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
