import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPostsUseCase } from '@/features/blog/core/use-cases/get-posts.use-case'
import { getPostBySlugUseCase } from '@/features/blog/core/use-cases/get-post-by-slug.use-case'
import { Badge } from '@/app/_components/badge'
import { Separator } from '@/app/_components/separator'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export async function generateStaticParams() {
  const posts = await getPostsUseCase()
  return posts.map(post => ({
    slug: encodeURIComponent(post.title),
  }))
}

export default async function PostPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const title = decodeURIComponent(slug)

  try {
    const post = await getPostBySlugUseCase(title)

    return (
      <article className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to posts
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(post.created_at, 'MMMM dd, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readingTime}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {post.tags.map(tag => (
              <Link key={tag} href={`/tags/${tag}`}>
                <Badge>{tag}</Badge>
              </Link>
            ))}
          </div>
        </header>

        <Separator className="mb-8" />

        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>
    )
  } catch {
    notFound()
  }
}