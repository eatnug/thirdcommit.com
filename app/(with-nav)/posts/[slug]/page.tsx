import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createBlogApi, getServerPostRepository } from '@/domain/blog'
import { Separator } from '@/app/_components/separator'
import { Button } from '@/app/_components/button'
import { Calendar, Clock, ArrowLeft, Edit } from 'lucide-react'
import { format } from 'date-fns'

export async function generateStaticParams() {
  const repository = await getServerPostRepository()
  const blog = createBlogApi(repository)
  const posts = await blog.getPosts()
  return posts.map(post => ({
    slug: post.slug || encodeURIComponent(post.title),
  }))
}

export default async function PostPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  try {
    const repository = await getServerPostRepository()
    const blog = createBlogApi(repository)
    const post = await blog.getPost(slug)
    const isDev = process.env.NODE_ENV === 'development'

    return (
      <article className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to posts
          </Link>

          {isDev && (
            <Link href={`/editor?id=${post.id}`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(post.created_at, 'MMMM dd, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readingTime}
            </span>
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